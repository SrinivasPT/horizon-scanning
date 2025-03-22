import axios from 'axios';
import { parseStringPromise, Parser } from 'xml2js';
import BaseScanner from './base-scanner';
import Document from '../models/document';
import ScanConfig from 'src/models/scan-config';
import { RssItem, SimplifiedRssItem } from '../models/rss';

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
            'id->identifier',
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

        const parser = new Parser({
            explicitArray: false,
            mergeAttrs: true,
            normalize: true,
            normalizeTags: false,
            xmlns: true,
        });

        const result = await parseStringPromise(response.data);
        let items: RssItem[] = [];

        if (result.rss && result.rss.channel && result.rss.channel.item) {
            items = Array.isArray(result.rss.channel.item) ? result.rss.channel.item : [result.rss.channel.item];
        } else if (result['rdf:RDF'] && result['rdf:RDF'].item) {
            items = Array.isArray(result['rdf:RDF'].item) ? result['rdf:RDF'].item : [result['rdf:RDF'].item];
        }

        console.log(`Found ${items.length} items in the feed for ${this.scanConfig}`);
        return items;
    }

    private simplifyRssItems(items: RssItem[]): SimplifiedRssItem[] {
        return items.map((item, index) => {
            const simpleItem: SimplifiedRssItem = {
                id: `${this.scanConfig}-${index + 1}`, // Unique ID per agency
                title: this.extractValue(item, 'title'),
                link: this.extractValue(item, 'link'),
                description: this.extractValue(item, 'description'),
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

    private extractValue(obj: any, key: string): string {
        if (!obj || !key || typeof obj !== 'object') return '';
        const value = obj[key];
        if (!value) return '';
        if (Array.isArray(value)) return value.length > 0 ? value[0] || '' : '';
        if (typeof value === 'object') return value._ || '';
        return String(value).trim();
    }
}

export default RssScanner;
