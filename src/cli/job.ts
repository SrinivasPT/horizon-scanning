import { main } from '../index';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
    console.error('Error: Job ID argument is required');
    console.log('Usage: npm run job -- <job-id>');
    process.exit(1);
}

// Get the job ID from arguments
const jobId = args[0];
console.log(`Starting job execution for job ID: ${jobId}`);

// Execute the main function with the specified job ID
main(jobId).catch(error => {
    console.error('Error running job:', error);
    process.exit(1);
});
