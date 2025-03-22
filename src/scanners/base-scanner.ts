import ScanConfig from 'src/models/scan-config';
import Document from '../models/document';
import { mapObjects } from '../utils/object-mapper';

abstract class BaseScanner {
    protected scanConfig!: ScanConfig;

    constructor(config: ScanConfig) {
        this.scanConfig = config;
    }

    public abstract scan(config: any): Promise<Document[]>;

    public abstract parseToDocument(raw: any): Document;

    /**
     * Creates a document from raw data using mapping configuration
     * @param rawData Raw data object with source fields
     * @param defaultMappings Optional default mappings to use if scanConfig doesn't provide mappings
     * @returns A Document object
     */
    protected createDocument(rawData: Record<string, any>, defaultMappings?: string[]): Document {
        // Create empty document with all fields initialized
        const document: Document = {
            source: '',
            issuingAuthority: '',
            typeOfChange: '',
            eventType: '',
            citationId: '',
            billType: '',
            regType: '',
            identifier: '',
            year: '',
            regulationStatus: '',
            billStatus: '',
            title: '',
            summary: '',
            linkToRegChangeText: '',
            introducedOn: '',
            publishedOn: '',
            firstEffectiveDate: '',
            comments: '',
            enactedDate: '',
            topic: '',
        };

        // Set default values from scanConfig if available
        if (this.scanConfig.defaults) {
            Object.keys(this.scanConfig.defaults).forEach(key => {
                if (key in document) {
                    (document as any)[key] = this.scanConfig.defaults[key];
                }
            });
        }

        // Apply mappings - use config mappings or default mappings
        const mappings = this.scanConfig.mapper && this.scanConfig.mapper.length > 0 ? this.scanConfig.mapper : defaultMappings || [];

        if (mappings.length > 0) {
            mapObjects(rawData, document, mappings);
        }

        // Set source to scanConfig name if not already set
        if (!document.source) {
            document.source = this.scanConfig.name;
        }

        return document;
    }
}

export default BaseScanner;
