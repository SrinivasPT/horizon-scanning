import axios from 'axios';
import { State, JobConfig, Document } from '../../model';
import * as cheerio from 'cheerio';
import { cleanText } from '../../common';
/**
 * In some cases RSS Feed description of the item is in HTML format. In other cases we need to extract
 * the text using the html link provided in the item. This function is handling both the scenarios
 */
export const summaryHtmlToTextExtractor = async (state: State, jobConfig: JobConfig): Promise<State> => {
    const { documents = [] } = state;

    const config = jobConfig.pipeline.find(stage => stage.stage === 'SUMMARY-HTML-TO-TEXT-EXTRACTOR');
    const source = config?.config?.source || 'summary';
    console.log('Source for summary extraction:', source);

    let updatedDocuments: Document[];

    // Process sequentially if we're fetching external content to avoid overwhelming the API
    if (source === 'linkToRegChangeText') {
        console.log('Processing documents sequentially to avoid overwhelming external API');
        updatedDocuments = [];

        for (const document of documents) {
            const processedDoc = await processDocument(document, source);
            updatedDocuments.push(processedDoc);
        }
    } else {
        // Process in parallel for other sources
        updatedDocuments = await Promise.all(documents.map(document => processDocument(document, source)));
    }

    // Return updated state with processed documents
    return { ...state, documents: updatedDocuments };
};

// Helper function to process a single document
async function processDocument(document: Document, htmlSource: string): Promise<Document> {
    if (!document.summary || typeof document.summary !== 'string') return document;

    const htmlContent = await getHtmlContent(document, htmlSource);
    console.log('Before HTML conversion:', htmlContent.substring(0, 100) + '...');

    const formattedText = convertHtmlToFormattedText(htmlContent);
    console.log('After HTML conversion:', formattedText.substring(0, 100) + '...');

    const cleanedText = cleanText(formattedText);
    console.log('After cleanText:', cleanedText.substring(0, 100) + '...');

    // Force additional cleaning if needed
    const furtherCleanedText = cleanedText
        .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
        .replace(/(\n\s*){3,}/g, '\n\n') // Limit consecutive newlines
        .trim(); // Remove leading/trailing whitespace

    console.log('After additional cleaning:', furtherCleanedText.substring(0, 100) + '...');

    return { ...document, summary: furtherCleanedText };
}

async function getHtmlContent(document: Document, source: string): Promise<string> {
    if (source === 'summary') {
        return document[source] || '';
    }

    if (source === 'linkToRegChangeText') {
        const link = document.linkToRegChangeText;
        if (!link) return '';

        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Fetching content from ${link}`);

        try {
            const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
            await sleep(1000); // Wait 1 second between calls

            const response = await axios.get(link, { timeout: 6000 });
            console.log(`[${timestamp}] Successfully fetched from ${link}, content length: ${response.data?.length || 0}`);
            return response.data || '';
        } catch (error: any) {
            console.error(`[${timestamp}] Error fetching from ${link}:`, error.message);
            return '';
        }
    }

    return '';
}

function convertHtmlToFormattedText(html: string): string {
    console.log(html);
    try {
        const $ = cheerio.load(html);

        // Remove unwanted elements
        $('script, style, noscript').remove();

        // Format specific elements
        $('h1, h2, h3').each((i, el) => {
            const text = $(el).text().toUpperCase();
            $(el).text(`\n\n${text}\n${'='.repeat(text.length)}\n\n`);
        });

        $('p').each((i, el) => $(el).text(`\n${$(el).text()}\n`));

        $('li').each((i, el) => $(el).text(`- ${$(el).text()}\n`));

        $('a').each((i, el) => {
            const href = $(el).attr('href');
            $(el).text(`${$(el).text()} [${href}]`);
        });

        $('br').replaceWith('\n');

        // Get final text and clean up
        let text = $('body').text();

        // Clean up excessive whitespace
        text = text.replace(/\n{3,}/g, '\n\n'); // Limit consecutive newlines
        text = text.replace(/[ \t]+/g, ' '); // Collapse whitespace

        // Further cleanup of blank lines - especially in sections with social media links
        text = text.replace(/\n\s*\n\s*\n/g, '\n\n');

        // Clean up blank lines around contact information
        text = text.replace(/MEDIA CONTACT:\s*\n+/g, 'MEDIA CONTACT: ');
        text = text.replace(/\n{2,}(The FDIC does not send)/g, '\n\n$1');

        // Fix spacing around stay connected section
        text = text.replace(/\n{2,}(STAY CONNECTED)/g, '\n\n$1');

        return text.trim();
    } catch (error) {
        console.error('Error converting HTML to text:', error);
        return html; // Return original HTML if conversion fails
    }
}
