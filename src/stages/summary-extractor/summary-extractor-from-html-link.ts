import { State, JobConfig, Document, ExtractionOptions } from '../../model';
import axios from 'axios';
import { load } from 'cheerio';
import { cleanText } from '../../common';

export const summaryExtractorFromHtmlLink = async (state: State, jobConfig: JobConfig): Promise<State> => {
    const { documents = [] } = state;

    // Find the summary extractor configuration
    const config = jobConfig.pipeline.find(stage => stage.stage === 'SUMMARY-FROM-SITE-LINK-EXTRACTOR');

    if (!config || !config.config || !config.config.selector) {
        console.warn('Summary extractor configuration not found or missing selector');
        return state;
    }

    const { selector, extractionMode = 'auto', endSelector = '', containerSelector = '' } = config.config;

    // Process each document
    const updatedDocuments: Document[] = await Promise.all(
        documents.map(async document => {
            if (!document.linkToRegChangeText) return document;

            try {
                const html = await fetchHtmlContent(document.linkToRegChangeText);
                const summaryText = extractSummaryFromHtml(html, {
                    selector,
                    extractionMode,
                    endSelector,
                    containerSelector,
                });
                const cleanedText = cleanText(summaryText);

                // Update the document with the extracted information
                return { ...document, summary: cleanedText || document.summary || '' };
            } catch (error) {
                console.error(`Error extracting summary from ${document.linkToRegChangeText}:`, error);
                return document;
            }
        })
    );

    // Return updated state with processed documents
    return { ...state, documents: updatedDocuments };
};

async function fetchHtmlContent(url: string): Promise<string> {
    try {
        const response = await axios.get(url, { timeout: 5000 });
        return response.data || ''; // Ensure we return an empty string if data is null/undefined
    } catch (error) {
        console.error(`Failed to fetch HTML from ${url}:`, error);
        return ''; // Return empty string on error
    }
}

function extractSummaryFromHtml(html: string, options: ExtractionOptions): string {
    // Check if html exists and is a string
    if (!html || typeof html !== 'string') {
        console.warn('Invalid HTML content received for parsing');
        return '';
    }

    try {
        // Parse the HTML with Cheerio
        const $ = load(html);

        // Find the summary heading/element using the selector
        const summaryElement = $(options.selector);

        if (summaryElement.length === 0) {
            return '';
        }

        // Extract summary text based on extraction mode
        return extractSummaryText($, summaryElement, options);
    } catch (error) {
        console.error('Error parsing HTML content:', error);
        return '';
    }
}

function extractSummaryText($: any, summaryElement: any, options: ExtractionOptions): string {
    const { extractionMode, endSelector, containerSelector } = options;

    try {
        // Different extraction strategies based on the mode
        switch (extractionMode) {
            case 'nextParagraph':
                // Simple case: just get the next paragraph
                return summaryElement.next('p').text().trim();

            case 'betweenSections':
                if (endSelector) {
                    // Extract content between the starting element and a specific end selector
                    return extractBetweenElements($, summaryElement, $(endSelector));
                } else {
                    // Extract content between the element and the next one with same tag
                    const tagName = summaryElement[0].name;
                    return extractUntilNextSameTag($, summaryElement, tagName);
                }

            case 'withinContainer':
                if (containerSelector) {
                    // Extract all content within a container element
                    return $(containerSelector).text().trim();
                }
                return summaryElement.text().trim();

            case 'auto':
            default:
                // Use the auto extraction function for intelligent content retrieval
                return autoExtraction($, summaryElement);
        }
    } catch (error) {
        console.error('Error extracting summary text:', error);
        return '';
    }
}

function autoExtraction($: any, summaryElement: any): string {
    try {
        // 1. If it looks like a heading (h1-h6), try extracting until next heading
        if (/^h[1-6]$/.test(summaryElement[0].name)) {
            const content = extractUntilNextSameTag($, summaryElement, summaryElement[0].name);
            if (content) return content;
        }

        // 2. Check if the element itself contains meaningful text
        const elementText = summaryElement.text().trim();
        if (elementText.length > 30) {
            // Assume it's meaningful if reasonably long
            return elementText;
        }

        // 3. Try getting the next paragraph
        const paragraphText = summaryElement.next('p').text().trim();
        if (paragraphText) return paragraphText;

        // 4. Try finding any div or section that might follow
        let nextEl = summaryElement.next();
        if (nextEl.length && (nextEl[0].name === 'div' || nextEl[0].name === 'section')) {
            const contentText = nextEl.text().trim();
            if (contentText) return contentText;
        }

        // Return whatever we've got at this point, which might be the element's text
        return elementText;
    } catch (error) {
        console.error('Error in auto extraction:', error);
        return '';
    }
}

function extractUntilNextSameTag($: any, startElement: any, tagName: string): string {
    let summaryContent = '';
    let nextElement = startElement.next();

    while (nextElement.length > 0) {
        // If we've reached another element of the same type, stop
        if (nextElement[0].name === tagName) {
            break;
        }

        // Add the HTML content to our summary
        summaryContent += $.html(nextElement);
        nextElement = nextElement.next();
    }

    // Clean up the HTML - extract just the text content
    if (summaryContent.trim()) {
        return $(summaryContent).text().trim();
    }

    return '';
}

function extractBetweenElements($: any, startElement: any, endElement: any): string {
    if (!endElement || endElement.length === 0) {
        return extractUntilNextSameTag($, startElement, startElement[0].name);
    }

    let content = '';
    let currentElement = startElement.next();

    // Handle case where start and end are the same element
    if (startElement.is(endElement)) {
        return startElement.text().trim();
    }

    // Iterate through DOM until we reach the end element
    while (currentElement.length > 0 && !currentElement.is(endElement)) {
        content += $.html(currentElement);
        currentElement = currentElement.next();
    }

    return $(content).text().trim();
}
