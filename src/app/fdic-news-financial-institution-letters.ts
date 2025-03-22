import { downloadHtml } from '../lib/extractor';
import * as cheerio from 'cheerio';

interface FdicLetter {
    date: string;
    title: string;
    url: string;
    category: string;
    releaseNumber: string;
}

async function extractFdicLetters(url: string): Promise<FdicLetter[]> {
    const html = await downloadHtml(url);
    const $ = cheerio.load(html);
    const letters: FdicLetter[] = [];

    // Find all the news rows in the table
    $('.views-row').each((index, element) => {
        // Extract date
        const dateText = $(element).find('.news-date time').attr('datetime') || '';
        const date = dateText ? new Date(dateText).toISOString().split('T')[0] : '';

        // Extract title and URL
        const titleElement = $(element).find('.news-title a');
        const title = titleElement.text().trim();
        const relativeUrl = titleElement.attr('href') || '';
        const fullUrl = relativeUrl.startsWith('/')
            ? `https://fdic.gov${relativeUrl}`
            : relativeUrl;

        // Extract category
        const category = $(element)
            .find('.field--name-field-fil-purpose-category .field__item')
            .text()
            .trim();

        // Extract release number
        const releaseNumber = $(element)
            .find('.field--name-field-release-number .field__item')
            .text()
            .trim();

        letters.push({
            date,
            title,
            url: fullUrl,
            category,
            releaseNumber,
        });
    });

    return letters;
}

export async function getFdicFinancialInstitutionLetters(url: string): Promise<FdicLetter[]> {
    try {
        const letters = await extractFdicLetters(url);
        console.log(`Extracted ${letters.length} FDIC financial institution letters`);
        return letters;
    } catch (error) {
        console.error('Error extracting FDIC financial institution letters:', error);
        return [];
    }
}

// // Main function to execute when run directly
// async function main() {
//     console.log('Fetching FDIC financial institution letters...');
//     const url = 'https://fdic.gov/news/financial-institution-letters/index.html';
//     const letters = await getFdicFinancialInstitutionLetters(url);
//     console.log(JSON.stringify(letters, null, 2));
// }

// // Check if this file is being run directly
// if (require.main === module) {
//     main().catch(err => {
//         console.error('Error in main execution:', err);
//         process.exit(1);
//     });
// }
