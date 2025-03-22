const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

/**
 * Fetches and parses the BIS RSS feed
 * @returns {Promise<Array>} - Array of feed items
 */
async function fetchBISRssFeed() {
    try {
        const rssUrl = 'https://www.bis.org/doclist/bcbspubls.rss';
        const response = await axios.get(rssUrl);

        // For debugging, save the raw XML
        const debugDir = path.resolve(__dirname, '..', 'data');
        ensureDirectoryExists(debugDir);
        fs.writeFileSync(path.join(debugDir, 'raw-rss.xml'), response.data);

        // Parse the XML content with minimal normalization
        const parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true,
            normalize: true,
            normalizeTags: false,
            xmlns: true,
        });
        const result = await parser.parseStringPromise(response.data);

        // Save the raw parsed result for debugging
        fs.writeFileSync(path.join(debugDir, 'parsed-raw.json'), JSON.stringify(result, null, 2));

        // Extract the items based on the structure
        let items = [];

        // Try different possible structures
        if (result.rss && result.rss.channel && result.rss.channel.item) {
            // Standard RSS format
            items = Array.isArray(result.rss.channel.item)
                ? result.rss.channel.item
                : [result.rss.channel.item];
        } else if (result['rdf:RDF'] && result['rdf:RDF'].item) {
            // RDF format
            items = Array.isArray(result['rdf:RDF'].item)
                ? result['rdf:RDF'].item
                : [result['rdf:RDF'].item];
        }

        console.log(`Found ${items.length} items in the feed`);
        return items;
    } catch (error) {
        console.error('Error fetching or parsing the RSS feed:', error.message);
        throw error;
    }
}

/**
 * Safely gets a value from a potentially nested object structure
 * @param {Object} obj - The object to extract from
 * @param {string} path - Dot notation path to the desired property
 * @param {any} defaultValue - Default value if property doesn't exist
 * @returns {any} - The property value or default
 */
function safeGet(obj, path, defaultValue = '') {
    if (!obj) return defaultValue;

    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
            // If it's an array with one element, return that element
            if (Array.isArray(result) && result.length === 1) {
                result = result[0];
            }
        } else {
            return defaultValue;
        }
    }

    // Handle different types properly
    if (typeof result === 'string') {
        return result.trim();
    } else if (result === null || result === undefined) {
        return defaultValue;
    }

    return result;
}

/**
 * Formats the RSS feed items for display
 * @param {Array} items - Array of RSS feed items
 */
function displayRssItems(items) {
    console.log(`Found ${items.length} publications:\n`);

    items.forEach((item, index) => {
        const title = safeGet(item, 'title.0', 'No title available');
        const link = safeGet(item, 'link.0', 'No link available');
        const description = safeGet(item, 'description.0', 'No description available');
        const date = safeGet(item, 'dc:date.0', safeGet(item, 'pubDate.0', 'Date not available'));

        console.log(`${index + 1}. ${title}`);
        console.log(`   Published: ${date}`);
        console.log(`   Link: ${link}`);
        console.log(`   Description: ${description}`);

        // Display additional metadata if available from cb:paper
        if (item['cb:paper']) {
            const paper = item['cb:paper'][0];

            const publicationDate = safeGet(paper, 'cb:publicationDate.0');
            if (publicationDate) {
                console.log(`   Publication Date: ${publicationDate}`);
            }

            const publication = safeGet(paper, 'cb:publication.0');
            if (publication) {
                console.log(`   Publication: ${publication}`);
            }

            // Display PDF link if available
            const pdfLink = safeGet(paper, 'cb:resource.0.cb:link.0');
            if (pdfLink) {
                console.log(`   PDF: ${pdfLink}`);
            }
        }
        console.log('');
    });
}

/**
 * Ensures that a directory exists, creating it if necessary
 * @param {string} dirPath - Directory path to check/create
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

/**
 * Saves the RSS feed items to a JSON file
 * @param {Array} items - Array of RSS feed items
 * @param {string} filePath - Path to save the JSON file
 */
function saveRssItemsToJson(items, filePath) {
    try {
        // Ensure the directory exists
        const dir = path.dirname(filePath);
        ensureDirectoryExists(dir);

        // Write the data to file
        fs.writeFileSync(filePath, JSON.stringify(items, null, 2));
        console.log(`Saved RSS data to ${filePath}`);
    } catch (error) {
        console.error(`Error saving RSS data to ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * Transforms the parsed RSS items into a simpler JSON structure
 * @param {Array} items - Original parsed RSS items
 * @returns {Array} - Simplified items with essential data
 */
function simplifyRssItems(items) {
    return items.map((item, index) => {
        // For debugging
        console.log(
            `Processing item ${index + 1}:`,
            JSON.stringify(item).substring(0, 150) + '...'
        );

        // Build a simpler object with proper null checks
        const simpleItem = {
            id: index + 1,
            title: extractValue(item, 'title'),
            link: extractValue(item, 'link'),
            description: extractValue(item, 'description'),
            date: extractValue(item, 'dc:date') || extractValue(item, 'pubDate'),
        };

        // Extract CB paper data if available
        if (item['cb:paper']) {
            const paper = Array.isArray(item['cb:paper']) ? item['cb:paper'][0] : item['cb:paper'];

            simpleItem.publicationDate = extractValue(paper, 'cb:publicationDate');
            simpleItem.publication = extractValue(paper, 'cb:publication');

            // Extract PDF link if available
            if (paper['cb:resource']) {
                const resource = Array.isArray(paper['cb:resource'])
                    ? paper['cb:resource'][0]
                    : paper['cb:resource'];
                simpleItem.pdfLink = extractValue(resource, 'cb:link');
            }
        }

        return simpleItem;
    });
}

/**
 * Extracts a value from an object with proper handling of arrays and types
 * @param {Object} obj - The object to extract from
 * @param {string} key - The key to extract
 * @returns {string} - The extracted value or empty string
 */
function extractValue(obj, key) {
    if (!obj || !key || typeof obj !== 'object') return '';

    const value = obj[key];
    if (!value) return '';

    if (Array.isArray(value)) {
        return value.length > 0 ? value[0] || '' : '';
    }

    if (typeof value === 'object') {
        return value._ || '';
    }

    return String(value).trim();
}

// // Main execution function
// async function main() {
//     try {
//         console.log('Fetching BIS publications RSS feed...');
//         const rawItems = await fetchBISRssFeed();

//         // Save the raw items for inspection
//         const rawPath = path.resolve(__dirname, '..', 'data', 'bis-rss-raw.json');
//         saveRssItemsToJson(rawItems, rawPath);

//         // Process and save simplified items
//         const simplifiedItems = simplifyRssItems(rawItems);
//         const jsonFilePath = path.resolve(__dirname, '..', 'data', 'bis-rss.json');
//         saveRssItemsToJson(simplifiedItems, jsonFilePath);

//         // Display the simplified items
//         console.log('\nFormatted Publications:');
//         displaySimplifiedItems(simplifiedItems);
//     } catch (error) {
//         console.error('Failed to retrieve RSS feed:', error);
//         process.exit(1);
//     }
// }

/**
 * Displays simplified RSS items in a readable format
 * @param {Array} items - Simplified RSS items
 */
function displaySimplifiedItems(items) {
    console.log(`Found ${items.length} publications:\n`);

    items.forEach(item => {
        console.log(`${item.id}. ${item.title}`);
        console.log(`   Published: ${item.date}`);
        console.log(`   Link: ${item.link}`);
        console.log(`   Description: ${item.description}`);

        if (item.publicationDate) {
            console.log(`   Publication Date: ${item.publicationDate}`);
        }

        if (item.publication) {
            console.log(`   Publication: ${item.publication}`);
        }

        if (item.pdfLink) {
            console.log(`   PDF: ${item.pdfLink}`);
        }

        console.log('');
    });
}

// // Execute if this file is run directly
// if (require.main === module) {
//     main();
// }

module.exports = {
    fetchBISRssFeed,
    displayRssItems,
    saveRssItemsToJson,
    simplifyRssItems,
    extractValue,
    displaySimplifiedItems,
};
