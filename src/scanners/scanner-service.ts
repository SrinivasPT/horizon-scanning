import { Logger } from '@/common/logger.service';
import { Document, PipelineData, ScanConfig } from '@/models';
import { HtmlTableParser } from '@/stages/parse/html-table-parser';
import { HttpDownloader } from '@/stages/download/http-downloader';

export class ScannerService {
    private readonly logger = new Logger(ScannerService.name);
    private readonly httpDownloader = new HttpDownloader();
    private readonly htmlTableParser = new HtmlTableParser();

    /**
     * Initialize all scanners from configuration
     */
    public async initializeScanners(configs: ScanConfig[]): Promise<void> {
        for (const config of configs) {
            await this.runScan(config);
        }
    }

    /**
     * Execute a scanner directly
     */
    public async runScanner(configId: string, configs: ScanConfig[]): Promise<Document[]> {
        const config = configs.find(c => c.id === configId);
        if (!config) {
            throw new Error(`Scanner configuration not found for ID: ${configId}`);
        }
        return this.executeScanner(config);
    }

    /**
     * Helper method to run a scan with error handling
     */
    private async runScan(config: ScanConfig): Promise<void> {
        this.logger.log(`Running scanner: ${config.name}`);
        try {
            await this.executeScanner(config);
        } catch (err) {
            this.logger.error(`Scan failed for ${config.name}`, err);
        }
    }

    /**
     * Execute a scanner directly
     */
    public async executeScanner(config: ScanConfig): Promise<Document[]> {
        this.logger.log(`Starting scan: ${config.name}`);

        try {
            // Initialize the pipeline data
            let pipelineData: PipelineData = {
                metadata: {
                    scanId: this.generateScanId(),
                    config,
                    startedAt: new Date(),
                    sourceUrl: config.url,
                },
                errors: [],
            };

            // Execute each stage directly based on the configuration
            for (const stageConfig of config.pipeline) {
                this.logger.debug(`Executing stage: ${stageConfig.type}`);

                // Execute the appropriate stage based on type
                switch (stageConfig.type) {
                    case 'http-download':
                        pipelineData = await this.httpDownloader.execute(pipelineData, stageConfig.config);
                        break;
                    case 'html-table-parse':
                        pipelineData = await this.htmlTableParser.execute(pipelineData, stageConfig.config);
                        break;
                    default:
                        throw new Error(`Unsupported stage type: ${stageConfig.type}`);
                }
            }

            return this.handleScanResults(pipelineData, config);
        } catch (error: any) {
            this.logger.error(`Scan failed for ${config.name}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate a unique scan ID
     */
    private generateScanId(): string {
        return `scan-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Process scan results
     */
    private async handleScanResults(result: PipelineData, config: ScanConfig): Promise<Document[]> {
        const { documents = [] as Document[], errors = [] } = result;

        if (!documents.length) {
            this.logger.info(`No documents found for scan: ${config.name}`);
            return [] as Document[];
        }

        this.logger.info(`Scan completed for ${config.name}: ${documents.length} documents processed`);

        if (errors.length) {
            this.logger.warn(`Scan had ${errors.length} errors for ${config.name}`);
            errors.forEach(err => this.logger.debug(`Scan error: ${err}`));
        }

        return documents as Document[];
    }
}
