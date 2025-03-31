import { JobConfig } from './model/job-config';
import { pipeline } from './pipeline';
import crypto from 'crypto';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
    console.error('Error: Job ID argument is required');
    console.log('Usage: npm run job -- <job-id> [lastRunDate] or npm run job -- all [lastRunDate]');
    process.exit(1);
}

// Get the job ID from arguments
const jobId = args[0];
// Default lastRunDate to 5 days ago if not provided
let lastRunDate: Date;
if (args[1]) {
    // Parse YYYY-MM-DD format
    lastRunDate = new Date(args[1]);
    if (isNaN(lastRunDate.getTime())) {
        console.error('Error: Invalid date format. Use YYYY-MM-DD format.');
        process.exit(1);
    }
} else {
    // Default to 5 days prior to current date
    lastRunDate = new Date();
    lastRunDate.setDate(lastRunDate.getDate() - 5);
}
const correlationId = crypto.randomUUID();

if (jobId === 'all') {
    console.log('Starting execution for all jobs');

    const allJobIds = JobConfig.getAllJobIds();
    // Generate a single correlation ID for all jobs

    console.log(`Using correlation ID: ${correlationId} for all jobs`);
    console.log(`Using last run date: ${lastRunDate.toISOString().split('T')[0]}`);

    runAllJobs(allJobIds, correlationId, lastRunDate).catch((error: any) => {
        console.error('Error running jobs:', error);
        process.exit(1);
    });
} else {
    // Start the given job
    console.log(`Starting job execution for job ID: ${jobId}`);
    console.log(`Using last run date: ${lastRunDate.toISOString().split('T')[0]}`);
    pipeline(jobId, correlationId, lastRunDate).catch((error: any) => {
        console.error('Error running job:', error);
        process.exit(1);
    });
}

// Function to run all jobs sequentially
async function runAllJobs(jobIds: string[], correlationId: string, lastRunDate: Date): Promise<void> {
    for (const id of jobIds) {
        console.log(`Starting job execution for job ID: ${id}`);
        try {
            await pipeline(id, correlationId, lastRunDate);
            console.log(`Successfully completed job ID: ${id}`);
        } catch (error) {
            console.error(`Error running job ${id}:`, error);
            // Continue with the next job instead of terminating the process
        }
    }
    console.log('All jobs completed');
}
