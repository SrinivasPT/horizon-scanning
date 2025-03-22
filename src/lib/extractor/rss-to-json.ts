import axios from 'axios';
import { parseStringPromise } from 'xml2js';

// Define interfaces for our data structures
interface RssItem {
    title?: any;
    link?: any;
    description?: any;
    pubDate?: any;
    guid?: any;
    date?: any;
    creator?: any;
    paper?: {
        simpleTitle?: any;
        occurrenceDate?: any;
        institutionAbbrev?: any;
        publicationDate?: any;
        publication?: any;
        resource?: {
            title?: any;
            link?: any;
            description?: any;
        };
    };
}

interface ParsedResult {
    RDF?: {
        item?: RssItem | RssItem[];
    };
    rss?: {
        channel?: {
            item?: RssItem | RssItem[];
        };
    };
    item?: RssItem | RssItem[];
}

interface NormalizedItem {
    title?: string;
    link?: string;
    description?: string;
    pubDate?: string;
    guid?: string;
    dc: {
        title?: string;
        date?: string;
        creator?: string;
    };
    cb: {
        simpleTitle?: string;
        occurrenceDate?: string;
        institutionAbbrev?: string;
        publicationDate?: string;
        publication?: string;
        resource: {
            title?: string;
            link?: string;
            description?: string;
        };
    };
}

// Function to parse RDF-based RSS feed or standard RSS feed
export default async function parseRssFeed(rssUrl: string): Promise<NormalizedItem[]> {
    try {
        // Fetch the RSS feed
        const response = await axios.get(rssUrl);
        const rssXml = response.data;

        // Parse the XML to JSON
        const result: ParsedResult = await parseStringPromise(rssXml, {
            explicitArray: false, // Avoid arrays for single elements
            explicitCharkey: true, // Preserve character data
            ignoreAttrs: false, // Include XML attributes
            mergeAttrs: true, // Merge attributes into the object
            tagNameProcessors: [trimNamespace], // Trim namespaces from tag names
            attrNameProcessors: [trimNamespace], // Trim namespaces from attribute names
            valueProcessors: [trimNamespace], // Trim namespaces from values
        });

        // Handle RDF structure or standard RSS: items are under `RDF.item` or `rss.channel.item`
        const items = result['RDF']?.item || result['rss']?.channel?.item || result.item;
        const normalizedItems: RssItem[] = Array.isArray(items) ? items : items ? [items] : [];

        // Convert items to a generic JSON structure
        const jsonOutput: NormalizedItem[] = normalizedItems.map(item => {
            const pubDateRaw = extractValue(item.pubDate);
            // console.log(`Raw pubDate for item "${extractValue(item.title)}": "${pubDateRaw}"`);
            return {
                title: extractValue(item.title),
                link: extractValue(item.link),
                description: extractValue(item.description),
                pubDate: parseDate(pubDateRaw),
                guid: extractValue(item.guid),
                dc: {
                    title: extractValue(item['title']),
                    date: parseDate(extractValue(item['date'])),
                    creator: extractValue(item['creator']),
                },
                cb: {
                    simpleTitle: extractValue(item.paper?.simpleTitle),
                    occurrenceDate: parseDate(extractValue(item.paper?.occurrenceDate)),
                    institutionAbbrev: extractValue(item.paper?.institutionAbbrev),
                    publicationDate: parseDate(extractValue(item.paper?.publicationDate)),
                    publication: extractValue(item.paper?.publication),
                    resource: {
                        title: extractValue(item.paper?.resource?.title),
                        link: extractValue(item.paper?.resource?.link),
                        description: extractValue(item.paper?.resource?.description),
                    },
                },
            };
        });

        // Log the JSON output
        console.log(JSON.stringify(jsonOutput, null, 2));

        // Return the JSON output
        return jsonOutput;
    } catch (error) {
        console.error(
            'Error parsing RSS feed:',
            error instanceof Error ? error.message : String(error)
        );
        console.error(
            'Stack trace:',
            error instanceof Error ? error.stack : 'No stack trace available'
        );
        throw error;
    }
}

// Helper function to trim namespaces from tag names
function trimNamespace(name: string): string {
    return name.replace(/^[^:]+:/, ''); // Remove namespace prefix (e.g., "dc:", "cb:")
}

// Helper function to extract values from parsed XML
function extractValue(obj: any): string | undefined {
    if (obj === null || obj === undefined) return undefined;
    if (typeof obj === 'string') return obj;
    if (obj && obj._) return obj._; // Extract text content
    if (Array.isArray(obj)) return obj.map(extractValue)[0]; // Take first item if array
    return obj; // Return object as-is if no text content
}

// Helper function to parse and standardize date strings
function parseDate(dateStr: any): string | undefined {
    if (!dateStr || typeof dateStr !== 'string') return undefined;

    const trimmedDateStr = dateStr.trim();

    // Try parsing as a full date first
    const fullDate = new Date(trimmedDateStr);
    if (!isNaN(fullDate.getTime())) {
        return fullDate.toISOString();
    }

    // Handle partial time strings (e.g., "26:47 -0400")
    const timeOffsetMatch = trimmedDateStr.match(/^(\d{2}):(\d{2})(?::(\d{2}))?\s*([+-]\d{4})$/);
    if (timeOffsetMatch) {
        const [, hours, minutes, seconds = '00', offset] = timeOffsetMatch;
        // Use current date (March 22, 2025) as base
        const baseDate = new Date('2025-03-22T00:00:00Z');
        baseDate.setUTCHours(parseInt(hours, 10));
        baseDate.setUTCMinutes(parseInt(minutes, 10));
        baseDate.setUTCSeconds(parseInt(seconds, 10));

        // Apply offset (e.g., "-0400" -> -4 hours)
        const offsetHours = parseInt(offset.slice(0, 3), 10);
        const offsetMinutes = parseInt(offset.slice(3), 10);
        const totalOffsetMinutes =
            offsetHours * 60 + (offsetHours < 0 ? -offsetMinutes : offsetMinutes);
        baseDate.setUTCMinutes(baseDate.getUTCMinutes() - totalOffsetMinutes);

        return baseDate.toISOString();
    }

    // Handle custom date format (e.g., "05 Feb 2025")
    const customDateMatch = trimmedDateStr.match(/(\d{2})\s+(\w{3})\s+(\d{4})/);
    if (customDateMatch) {
        const [, day, month, year] = customDateMatch;
        const monthMap: Record<string, string> = {
            Jan: '01',
            Feb: '02',
            Mar: '03',
            Apr: '04',
            May: '05',
            Jun: '06',
            Jul: '07',
            Aug: '08',
            Sep: '09',
            Oct: '10',
            Nov: '11',
            Dec: '12',
        };
        const monthNum = monthMap[month];
        if (monthNum) {
            return `${year}-${monthNum}-${day.padStart(2, '0')}T00:00:00Z`;
        }
    }

    // Fallback: return original string with warning
    console.warn(`Unable to parse date: "${trimmedDateStr}"`);
    return trimmedDateStr;
}

// Example usage
// const rssUrl = 'https://www.bis.org/doclist/bcbspubls.rss';
const rssUrl = 'https://www.sec.gov/news/pressreleases.rss';

parseRssFeed(rssUrl).catch(error => {
    console.error(
        'Failed to parse RSS feed:',
        error instanceof Error ? error.message : String(error)
    );
});

// Export the function for use in other files
export { parseRssFeed };
