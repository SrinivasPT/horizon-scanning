import axios from 'axios';
import { parseStringPromise, Parser } from 'xml2js';
import BaseScanner from './base-scanner';
import Document from '../models/document';
import ScanConfig from 'src/models/scan-config';
import { RssItem, SimplifiedRssItem } from '../models/rss';
import htmlToMarkdown from '../utils/html-to-md';

export class RssScanner extends BaseScanner {
    constructor(scanConfig: ScanConfig) {
        super(scanConfig);
    }

    public async scan(): Promise<Document[]> {
        const documents: Document[] = [];

        try {
            const rssUrl = `${this.scanConfig.url}`;
            const rawItems = await this.fetchRssFeed(rssUrl);
            const simplifiedItems = this.simplifyRssItems(rawItems);
            const agencyDocuments = simplifiedItems.map(item => this.parseToDocument(item));
            documents.push(...agencyDocuments);
        } catch (error: any) {
            console.error(`Error scanning RSS feed for ${this.scanConfig.name} at ${this.scanConfig.url}:`, error.message);
            throw error; // Let ScannerService handle the error
        }

        return documents;
    }

    public parseToDocument(raw: SimplifiedRssItem): Document {
        // Define default mappings for RSS fields to Document fields using the new format
        const defaultRssMappings = [
            'title->title',
            'description->summary',
            'date->publishedOn',
            'link->linkToRegChangeText',
            'publication->source',
        ];

        // Use the BaseScanner's createDocument method with the new mapping format
        const documentResult = this.createDocument(raw, defaultRssMappings);

        // Special case handling for RSS-specific fields
        if (!documentResult.linkToRegChangeText && raw.pdfLink) {
            documentResult.linkToRegChangeText = raw.pdfLink;
        }

        if (!documentResult.publishedOn && raw.publicationDate) {
            documentResult.publishedOn = raw.publicationDate;
        }

        return documentResult;
    }

    private async fetchRssFeed(rssUrl: string): Promise<RssItem[]> {
        const response = await axios.get(rssUrl);
        console.log(`RSS response received from ${rssUrl}, content length: ${response.data.length}`);

        try {
            // Modified parser options to ensure arrays are handled consistently
            const parser = new Parser({
                explicitArray: true, // Changed to true to ensure consistent behavior
                mergeAttrs: true,
                normalize: true,
                normalizeTags: false,
                xmlns: true,
            });

            const result = await parseStringPromise(response.data);

            // Debug output for troubleshooting
            console.debug(`RSS structure keys: ${JSON.stringify(Object.keys(result))}`);
            if (result.rss) {
                console.debug(`RSS channel keys: ${JSON.stringify(Object.keys(result.rss.channel?.[0] || {}))}`);
            }

            let items: RssItem[] = [];

            // Handle standard RSS 2.0 format - adjusted for explicitArray: true
            if (result.rss && result.rss.channel && result.rss.channel.length > 0) {
                const channel = result.rss.channel[0];
                if (channel.item && channel.item.length > 0) {
                    items = channel.item;
                    console.log(`Found items in standard RSS 2.0 format: ${items.length}`);
                }
            }
            // Handle RDF format
            else if (result['rdf:RDF'] && result['rdf:RDF'].item) {
                items = Array.isArray(result['rdf:RDF'].item) ? result['rdf:RDF'].item : [result['rdf:RDF'].item];
                console.log(`Found items in RDF format: ${items.length}`);
            }
            // Handle Atom format
            else if (result.feed && result.feed.entry) {
                items = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];
                console.log(`Found items in Atom format: ${items.length}`);
            }

            if (items.length === 0) {
                console.warn(
                    `No items found in RSS feed for ${this.scanConfig.name}. RSS structure: ${JSON.stringify(result, null, 2).substring(
                        0,
                        500
                    )}...`
                );

                // Enhanced fallback for explicitly-arrayed format
                if (result.rss && result.rss.channel && result.rss.channel.length > 0) {
                    const channel = result.rss.channel[0];
                    console.log('Attempting fallback item extraction from RSS structure');

                    // Log available keys in the channel
                    console.debug(`Available channel keys: ${JSON.stringify(Object.keys(channel))}`);

                    for (const key of Object.keys(channel)) {
                        if (Array.isArray(channel[key]) && channel[key].length > 0) {
                            console.log(`Found array in channel.${key} with ${channel[key].length} elements`);

                            // Check if this array contains item-like objects
                            if (
                                channel[key].length > 0 &&
                                typeof channel[key][0] === 'object' &&
                                (channel[key][0].title || channel[key][0].pubDate || channel[key][0].guid)
                            ) {
                                items = channel[key];
                                console.log(`Using ${key} as items array, found ${items.length} items`);
                                break;
                            }
                        }
                    }
                }
            }

            console.log(`Found ${items.length} items in the feed for ${this.scanConfig.name}`);

            // If items were found, log the first item to help with debugging
            if (items.length > 0) {
                console.debug(`First item sample: ${JSON.stringify(items[0]).substring(0, 200)}...`);
            }

            return items;
        } catch (error) {
            console.error(`Error parsing RSS feed: ${error}`);
            console.error(`RSS content sample: ${response.data.substring(0, 500)}...`);
            throw error;
        }
    }

    private simplifyRssItems(items: RssItem[]): SimplifiedRssItem[] {
        return items.map((item, index) => {
            let description = this.extractValue(item, 'description');

            // Convert HTML to Markdown using the new utility
            if (description) {
                try {
                    // console.log(`Converting HTML description to markdown for item ${index}`);
                    description = htmlToMarkdown.convert(description);
                } catch (error) {
                    console.error(`Error converting HTML to markdown: ${error}`);
                }
            }

            const simpleItem: SimplifiedRssItem = {
                id: `${this.scanConfig.defaults.source}-${index + 1}`, // Unique ID per agency
                title: this.extractValue(item, 'title'),
                link: this.extractValue(item, 'link'),
                description: description,
                date: this.extractValue(item, 'dc:date') || this.extractValue(item, 'pubDate'),
            };

            if (item['cb:paper']) {
                const paper = Array.isArray(item['cb:paper']) ? item['cb:paper'][0] : item['cb:paper'];
                simpleItem.publicationDate = this.extractValue(paper, 'cb:publicationDate');
                simpleItem.publication = this.extractValue(paper, 'cb:publication');

                if (paper['cb:resource']) {
                    const resource = Array.isArray(paper['cb:resource']) ? paper['cb:resource'][0] : paper['cb:resource'];
                    simpleItem.pdfLink = this.extractValue(resource, 'cb:link');
                }
            }

            return simpleItem;
        });
    }

    // Updated to handle the array structure in extracted values
    private extractValue(obj: any, key: string): string {
        if (!obj || !key || typeof obj !== 'object') return '';
        const value = obj[key];
        if (!value) return '';

        if (Array.isArray(value)) {
            if (value.length === 0) return '';
            // Handle arrays of arrays or objects
            if (typeof value[0] === 'object' && value[0] !== null) {
                return value[0]._ || String(value[0]).trim() || '';
            }
            return String(value[0]).trim();
        }

        if (typeof value === 'object') return value._ || '';
        return String(value).trim();
    }
}

export default RssScanner;
