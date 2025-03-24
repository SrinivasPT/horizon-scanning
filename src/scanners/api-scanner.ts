import axios from 'axios';
import BaseScanner from './base-scanner';
import ScanConfig from '../models/scan-config';
import Document from '../models/document';

export class ApiScanner extends BaseScanner {
    constructor(scanConfig: ScanConfig) {
        super(scanConfig);
    }

    public async scan(): Promise<Document[]> {
        return await this.fetchData();
    }

    public parseToDocument(raw: any): Document {
        return this.createDocument(raw);
    }

    protected async fetchData(): Promise<Document[]> {
        try {
            console.log(`Starting scan for ${this.scanConfig.name}`);

            const response = await this.fetchFromApi();

            if (!response || !response.data) {
                console.warn(`No data returned from API ${this.scanConfig.url}`);
                return [];
            }

            const items = Array.isArray(response.data)
                ? response.data
                : response.data.items || response.data.results || response.data.data || [];

            const documents = this.mapToDocuments(items);

            console.log(`Scan completed for ${this.scanConfig.name}, found ${documents.length} items`);

            return documents;
        } catch (error) {
            console.error(`Error scanning API ${this.scanConfig.url}: ${error}`);
            return [];
        }
    }

    private async fetchFromApi() {
        const { url } = this.scanConfig;

        console.log(`Fetching from API: ${url}`);

        return await axios({ method, url });
    }

    private mapToDocuments(items: any[]): Document[] {
        if (!items || !Array.isArray(items)) {
            console.warn('Received invalid items data structure');
            return [];
        }

        return items
            .filter(item => item)
            .map(item => {
                try {
                    return this.parseToDocument(item);
                } catch (error) {
                    console.error(`Error mapping item: ${error}`);
                    return null;
                }
            })
            .filter(Boolean) as Document[];
    }
}
