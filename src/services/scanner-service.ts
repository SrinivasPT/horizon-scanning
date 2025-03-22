import agencyConfigs from '../config/agencies.config';
import RssScanner from '../scanners/rss-scanner';
import Document from '../models/document';
import ScanConfig from 'src/models/scan-config';
import ApiService from './api-service';

class ScannerService {
    private runningScanners: Set<ScanConfig> = new Set();
    private apiService: ApiService;

    constructor() {
        this.apiService = new ApiService();
    }

    private scannerFactory: any = {
        // html: (agencyName: string) => new HtmlScanner(agencyName),
        RSS: (scanConfig: ScanConfig) => new RssScanner(scanConfig),
        // playwright: (agencyName: string) => new PlaywrightScanner(agencyName),
    };

    async startJob(id: number): Promise<void> {
        const scanConfig: ScanConfig = agencyConfigs.find(a => a.id === id) as ScanConfig;

        if (!scanConfig) {
            const errorMsg = `Agency with ID ${id} not found`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        console.log(`Starting job for agency: ${scanConfig.name || id}`);

        let jobId;
        try {
            // Save job entry to database and get the ID
            jobId = await this.apiService.startScan(scanConfig);
            console.log(`Created job entry with ID: ${jobId}`);

            const scannerCreator = this.scannerFactory[scanConfig.scannerType];
            if (!scannerCreator) {
                throw new Error(`Unknown scanner type: ${scanConfig.scannerType}`);
            }

            // Scan
            const scanner = scannerCreator(scanConfig);
            const documents = await scanner.scan(scanConfig);

            // Update job entry to completed status
            await this.apiService.completeScan(jobId, documents);

            console.log(`Completed job for agency: ${scanConfig.name || id}`);
        } catch (error) {
            if (jobId) await this.apiService.scanFailed(jobId);
            console.error(`Error processing job for agency ${scanConfig.name || id}:`, error);
            throw error; // Re-throw to allow caller to handle
        } finally {
            this.runningScanners.delete(scanConfig);
        }
    }

    async scanAll(): Promise<void> {
        await Promise.all(agencyConfigs.map(config => this.startJob(config.id)));
    }
}

export default ScannerService;
