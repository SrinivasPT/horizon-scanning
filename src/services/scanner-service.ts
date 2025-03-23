import agencyConfigs from '../config/agencies.config';
import RssScanner from '../scanners/rss-scanner';
import HtmlTableScanner from '../scanners/html-table-scanner';
import ScanConfig from 'src/models/scan-config';
import ApiService from './api-service';

class ScannerService {
    private runningScanners: Set<ScanConfig> = new Set();
    private apiService: ApiService;

    constructor() {
        this.apiService = new ApiService();
    }

    private scannerFactory: any = {
        HTML_TABLE: (scanConfig: ScanConfig) => new HtmlTableScanner(scanConfig),
        PLAYWRIGHT: (scanConfig: ScanConfig) => new HtmlTableScanner(scanConfig),
        RSS: (scanConfig: ScanConfig) => new RssScanner(scanConfig),
        // playwright: (agencyName: string) => new PlaywrightScanner(agencyName),
    };

    async startJob(jobConfigId: number): Promise<void> {
        const scanConfig: ScanConfig = agencyConfigs.find(a => a.id === jobConfigId) as ScanConfig;

        if (!scanConfig) {
            const errorMsg = `Agency with ID ${jobConfigId} not found`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        console.log(`Starting job for agency: ${scanConfig.name || jobConfigId}`);

        let jobRunId;
        try {
            // Save job entry to database and get the ID
            jobRunId = await this.apiService.startScan(scanConfig);
            console.log(`Created job entry with ID: ${jobRunId}`);

            const scannerCreator = this.scannerFactory[scanConfig.scannerType];
            if (!scannerCreator) {
                throw new Error(`Unknown scanner type: ${scanConfig.scannerType}`);
            }

            // Scan
            const scanner = scannerCreator(scanConfig);
            const documents = await scanner.scan(scanConfig);

            // Update job entry to completed status
            await this.apiService.completeScan(jobRunId, documents);

            console.log(`Completed job for agency: ${scanConfig.name || jobConfigId}`);
        } catch (error) {
            if (jobRunId) await this.apiService.scanFailed(jobRunId);
            console.error(`Error processing job for agency ${scanConfig.name || jobConfigId}:`, error);
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
