import ScannerService from '../services/scanner-service';

async function main() {
    try {
        const args = process.argv.slice(2);
        if (args.length === 0) {
            console.error('Please provide a job ID as an argument');
            process.exit(1);
        }

        const jobId = parseInt(args[0], 10);
        if (isNaN(jobId)) {
            console.error('Job ID must be a number');
            process.exit(1);
        }

        console.log(`Starting job with ID: ${jobId}`);
        const scannerService = new ScannerService();
        await scannerService.startJob(jobId);
        console.log('Job completed successfully');
    } catch (error) {
        console.error('Error running job:', error);
        process.exit(1);
    }
}

main();
