import { Logger } from '@/common/logger.service';
import { SECConfigs } from '@/config/agencies/sec.config';
import { ScannerService } from '@/scanners/scanner-service';

// Initialize core components
const logger = new Logger('Main');

// Main application flow
async function main() {
    try {
        logger.info('Starting horizon scanning application');

        // 1. Create scanner service
        const scannerService = new ScannerService();

        // 2. Load configurations
        const agencyConfigs = [
            ...SECConfigs,
            // Add other agency configs here
        ];

        // 3. Run all scanners
        await scannerService.initializeScanners(agencyConfigs);
        logger.info(`Processed ${agencyConfigs.length} scanner configurations`);

        logger.info('Application completed successfully');
    } catch (error: any) {
        logger.error('Failed to start application', error);
        process.exit(1);
    }
}

// Start the application
main().catch(error => {
    logger.error('Application error', error);
    process.exit(1);
});
