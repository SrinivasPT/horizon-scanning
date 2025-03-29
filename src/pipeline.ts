import { JobConfig } from './model/job-config';
import { logger } from './common';
import { factory } from './factory';
import { State } from './model/state';
import * as db from './services/db-service';

export async function pipeline(jobId: string, correlationId: string): Promise<void> {
    logger.info(`Loading job configuration for ID: ${jobId}`);

    try {
        const jobConfig = initialize(jobId);

        preValidate(correlationId);

        const runId = await db.startScan(jobConfig, correlationId);
        let state: State = { runId, correlationId: correlationId };

        // Execute each pipeline stage
        for (let i = 0; i < jobConfig.pipeline.length; i++) {
            const stage = jobConfig.pipeline[i];
            logger.info(`Executing pipeline stage ${i + 1}/${jobConfig.pipeline.length}: ${stage.stage}`);

            // Get the stage function from the factory
            const stageFunction = factory[stage.stage as keyof typeof factory];

            // Handle both async and sync functions. Promise.resolve will wrap sync returns in a Promise, and leave async returns as is
            const stateState = await Promise.resolve(stageFunction(state, jobConfig));
            state = { ...state, ...stateState };

            logger.info(`Completed pipeline stage: ${stage.stage}`);
        }

        // Post Process
        factory['EXPRESSION-EVAL-ENRICHER'](state, jobConfig);
        factory['TEXT-CLEANUP-ENRICHER'](state, jobConfig);

        persist(jobConfig, state);
    } catch (error) {
        logger.error('Error running pipeline:', error);
        db.scanFailed(jobId);
        process.exit(1);
    }
}

function preValidate(correlationId: string | undefined) {
    if (!correlationId) {
        logger.error('Correlation ID is required');
        process.exit(1);
    }
}

function initialize(jobId: string): JobConfig {
    const jobConfig = JobConfig.loadJobById(jobId);

    if (!jobConfig) {
        logger.error(`No job configuration found with ID "${jobId}"`);
        process.exit(1);
    }

    logger.info(`Successfully loaded job: ${jobConfig.name} (${jobConfig.id})`);
    logger.info(`Description: ${jobConfig.description}`);
    logger.info(`URL: ${jobConfig.url}`);
    logger.info(`Pipeline stages: ${jobConfig.pipeline.length}`);

    return jobConfig;
}

function persist(jobConfig: JobConfig, state: State) {
    db.completeScan(state.runId as number, state.documents as Document[]);

    // logger.info(state.documents);
    // logger.info('Job execution completed successfully.');
}
