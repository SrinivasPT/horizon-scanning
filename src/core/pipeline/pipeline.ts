// src/core/pipeline/pipeline.ts
import { Logger } from '@/common/logger.service';
import { IPipeline, IPipelineStage } from './interfaces';

export class Pipeline implements IPipeline {
    private readonly logger = new Logger(Pipeline.name);

    constructor(private readonly stages: IPipelineStage<any, any>[]) {}

    async execute(input: any): Promise<any> {
        if (this.stages.length === 0) {
            this.logger.warn('Executing empty pipeline');
            return input;
        }

        let result = input;

        for (let i = 0; i < this.stages.length; i++) {
            const stage = this.stages[i];
            try {
                this.logger.debug(`Executing stage ${i + 1}/${this.stages.length}: ${stage.constructor.name}`);
                result = await stage.process(result);
            } catch (error: any) {
                this.logger.error(`Pipeline failed at stage ${i + 1}: ${error.message}`);
                throw new PipelineError(i, stage, error);
            }
        }

        return result;
    }
}

export class PipelineError extends Error {
    constructor(public readonly stageIndex: number, public readonly stage: IPipelineStage<any, any>, public readonly originalError: Error) {
        super(`Pipeline failed at stage ${stageIndex + 1} (${stage.constructor.name}): ${originalError.message}`);
    }
}
