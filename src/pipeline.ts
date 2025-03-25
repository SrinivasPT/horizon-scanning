import { JobConfig } from './model/job-config';
import { logger } from './common';
import { factory } from './factory';
import { State } from './model/state';

async function pipeline(jobId: string): Promise<void> {
    logger.info(`Loading job configuration for ID: ${jobId}`);

    let state: State = {};

    // Load the job configuration for the specified ID
    const jobConfig = JobConfig.loadJobById(jobId);

    if (!jobConfig) {
        logger.error(`No job configuration found with ID "${jobId}"`);
        process.exit(1);
    }

    logger.info(`Successfully loaded job: ${jobConfig.name} (${jobConfig.id})`);
    logger.info(`Description: ${jobConfig.description}`);
    logger.info(`URL: ${jobConfig.url}`);
    logger.info(`Pipeline stages: ${jobConfig.pipeline.length}`);

    // Execute each pipeline stage
    for (let i = 0; i < jobConfig.pipeline.length; i++) {
        const stage = jobConfig.pipeline[i];
        logger.info(`Executing pipeline stage ${i + 1}/${jobConfig.pipeline.length}: ${stage.stage}`);

        // Get the stage function from the factory
        const stageFunction = factory[stage.stage as keyof typeof factory];

        // Handle both async and sync functions
        // Promise.resolve will wrap sync returns in a Promise, and leave async returns as is
        state = await Promise.resolve(stageFunction(state, jobConfig));

        logger.info(`Completed pipeline stage: ${stage.stage}`);
    }

    logger.info(state.documents);
    logger.info('Job execution completed successfully.');
}

// Parse command line arguments and run the main function
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        logger.error('Job ID argument is required');
        logger.info('Usage: npm start -- <job-id>');
        process.exit(1);
    }

    const jobId = args[0];
    pipeline(jobId).catch(error => {
        logger.error('Error running job:', error);
        process.exit(1);
    });
}

// Export for testing or programmatic usage
export { pipeline };
