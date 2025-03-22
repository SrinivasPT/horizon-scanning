/**
 * Main entry point for the regulatory scanning tools
 */

// Import scanners
import { getFdicFinancialInstitutionLetters } from './app/fdic-news-financial-institution-letters';
import { fetchSECRuleMakingActivity } from './app/sec';
import { downloadUrlContent } from './app/poc-scanner';
const bisRss = require('./app/fetch-bis-rss');
import axios from 'axios';

// Define a common interface for all scanners
interface Scanner {
    name: string;
    description: string;
    run: () => Promise<any>;
}

// Refactored scanner implementations
const fdicScanner: Scanner = {
    name: 'fdic',
    description: 'FDIC Financial Institution Letters',
    run: async () => {
        console.log('Fetching FDIC financial institution letters...');
        const url = 'https://fdic.gov/news/financial-institution-letters/index.html';
        const letters = await getFdicFinancialInstitutionLetters(url);
        // console.log(JSON.stringify(letters, null, 2));
        return letters;
    },
};

const secScanner: Scanner = {
    name: 'sec',
    description: 'SEC Rule Making Activity',
    run: async () => {
        console.log('Fetching SEC rule making activity...');
        const url = 'https://www.sec.gov/rules-regulations/rulemaking-activity';
        const ruleMakingItems = await fetchSECRuleMakingActivity(url);
        console.log('SEC Rule Making Activity:');
        // console.table(ruleMakingItems);
        return ruleMakingItems;
    },
};

const bisScanner: Scanner = {
    name: 'bis',
    description: 'BIS Publications RSS Feed',
    run: async () => {
        console.log('Fetching BIS publications RSS feed...');
        const rawItems = await bisRss.fetchBISRssFeed();
        const simplifiedItems = bisRss.simplifyRssItems(rawItems);
        console.log('\nFormatted Publications:');
        bisRss.displaySimplifiedItems(simplifiedItems);
        return simplifiedItems;
    },
};

const pocScanner: Scanner = {
    name: 'poc',
    description: 'Proof of Concept URL Content Downloader',
    run: async () => {
        console.log('Running POC URL content downloader...');
        const url = 'https://www.sec.gov/rules-regulations/rulemaking-activity';
        return await downloadUrlContent(url);
    },
};

// Scanner registry - maps scanner names to their implementations
const scanners: Record<string, Scanner> = {
    fdic: fdicScanner,
    sec: secScanner,
    bis: bisScanner,
    poc: pocScanner,
};

// Main function
async function main() {
    // Get scanner to run from command line args
    const args = process.argv.slice(2);
    const scannerName = args[0]?.toLowerCase() || 'all';

    try {
        if (scannerName === 'all') {
            console.log('=== Running all scanners ===');
            for (const scanner of Object.values(scanners)) {
                console.log(`\n--- Running ${scanner.description} scanner ---`);
                await scanner.run();
                console.log('\n');
            }
            return;
        }

        const scanner = scanners[scannerName];
        if (scanner) {
            await scanner.run();
        } else {
            const availableScanners = Object.keys(scanners).join(', ');
            console.log(`Unknown scanner. Available options: ${availableScanners}, all`);
        }
    } catch (error) {
        console.error('Error running scanner:', error);
        process.exit(1);
    }
}

// Run the main function if this file is executed directly
if (require.main === module) {
    main();
}
