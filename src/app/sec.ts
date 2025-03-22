import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface RuleMakingItem {
    title: string;
    date: string;
    fileNumber: string;
    status: string;
    division?: string;
    releaseNumber?: string;
    detailUrl?: string;
}

export async function fetchSECRuleMakingActivity(url: string): Promise<RuleMakingItem[]> {
    // Launch a visible browser (not headless)
    const browser = await chromium.launch({
        headless: false, // Set to false to make the browser visible
        slowMo: 100, // Add a small delay between actions to make it easier to see what's happening
    });
    try {
        console.log('Browser launched');
        // Create a new browser context
        const context = await browser.newContext({
            userAgent:
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        });

        // Create a new page
        const page = await context.newPage();
        console.log('Page created');

        // Navigate to the SEC rule making activity page
        console.log('Navigating to SEC page...');
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000, // Increase timeout to 60 seconds
        });
        console.log('Page loaded');

        // // Take a screenshot to help debug
        // await page.screenshot({ path: 'sec-page.png' });
        // console.log('Screenshot saved to sec-page.png');

        // Wait for the table to be visible - try a more specific selector
        // console.log('Waiting for table to appear...');
        try {
            await page.waitForSelector('table.usa-table', { timeout: 30000 });
        } catch (e) {
            console.log('Table selector timed out, trying alternative approach');
            // If the specific selector fails, let's take a more general approach
            await page.waitForSelector('table', { timeout: 30000 });
            console.log('Generic table found');
        }

        // Debug: Log available tables on the page
        const tableCount = await page.evaluate(() => {
            const tables = document.querySelectorAll('table');
            console.log(`Found ${tables.length} tables`);
            return tables.length;
        });
        console.log(`Found ${tableCount} tables on the page`);

        // Extract data from the table with more robust error handling
        const ruleMakingItems = await page.evaluate(() => {
            console.log('Starting data extraction');
            const items: any[] = [];

            // Try different table selectors in case the structure has changed
            let rows = document.querySelectorAll('table.usa-table tbody tr');
            if (rows.length === 0) {
                console.log('No rows found with usa-table selector, trying generic table');
                // Try to find any table with data
                const tables = document.querySelectorAll('table');
                for (const table of tables) {
                    const tableRows = table.querySelectorAll('tbody tr');
                    if (tableRows.length > 0) {
                        rows = tableRows;
                        console.log(`Found ${rows.length} rows in alternative table`);
                        break;
                    }
                }
            }

            console.log(`Processing ${rows.length} rows`);

            rows.forEach((row, index) => {
                try {
                    const columns = row.querySelectorAll('td');
                    console.log(`Row ${index}: has ${columns.length} columns`);

                    if (columns.length >= 4) {
                        // ...existing code for extracting data from columns...
                        const dateCell = columns[0];
                        const fileNumberCell = columns[1];
                        const ruleMakingCell = columns[2];
                        const statusCell = columns[3];

                        // Extract title and division
                        const title = ruleMakingCell.childNodes[0]?.textContent?.trim() || '';
                        const divisionElement = ruleMakingCell.querySelector('.division');
                        const division = divisionElement?.textContent?.trim() || '';

                        // Extract status and details
                        const statusLink = statusCell.querySelector('a.info-button');
                        const status =
                            statusLink?.querySelector('.info-button__top')?.textContent?.trim() ||
                            '';
                        const detailUrl = statusLink?.getAttribute('href') || '';

                        // Extract release numbers
                        const releaseNumberElements =
                            statusLink?.querySelectorAll('.regulation-node-release-number span') ||
                            [];
                        const releaseNumbers = Array.from(releaseNumberElements)
                            .map(el => el.textContent?.trim())
                            .filter(Boolean)
                            .join(' ');

                        items.push({
                            title: title,
                            date:
                                dateCell.querySelector('time')?.textContent?.trim() ||
                                dateCell.textContent?.trim() ||
                                '',
                            fileNumber: fileNumberCell.textContent?.trim() || '',
                            status: status,
                            division: division,
                            releaseNumber: releaseNumbers,
                            detailUrl: detailUrl
                                ? new URL(detailUrl, window.location.origin).href
                                : '',
                        });

                        console.log(`Extracted data for row ${index}`);
                    }
                } catch (err) {
                    console.log(`Error processing row ${index}: ${err}`);
                }
            });

            console.log(`Finished extraction. Found ${items.length} items`);
            return items;
        });

        console.log(`Extracted ${ruleMakingItems.length} items`);

        // Pause for a moment before closing browser so you can see the final state
        await page.waitForTimeout(5000);

        return ruleMakingItems;
    } catch (error) {
        console.error('Error fetching SEC rule making activity:', error);
        throw error;
    } finally {
        // Make sure to close the browser
        await browser.close();
        console.log('Browser closed');
    }
}

/**
 * Saves the rule making data to a JSON file
 */
// async function saveRuleMakingData(data: RuleMakingItem[], filePath: string): Promise<void> {
//     // Ensure the directory exists
//     const dir = path.dirname(filePath);
//     if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, { recursive: true });
//         console.log(`Created directory: ${dir}`);
//     }

//     // Write the data to the file
//     fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
//     console.log(`Data saved to ${filePath}`);
// }

/**
 * Example usage of the scraper
 */
// async function main() {
//     try {
//         const ruleMakingItems = await fetchSECRuleMakingActivity();
//         console.log('SEC Rule Making Activity:');
//         console.table(ruleMakingItems);

//         // Save the data to a JSON file
//         const filePath = path.resolve(__dirname, '..', 'data', 'sec-rule-making.json');
//         await saveRuleMakingData(ruleMakingItems, filePath);
//     } catch (error) {
//         console.error('Failed to fetch SEC rule making activity:', error);
//     }
// }

// // Execute the main function if this file is run directly
// if (require.main === module) {
//     main();
// }
