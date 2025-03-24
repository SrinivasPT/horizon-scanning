// src/core/pipeline/builder.ts
import { IPipelineStage, IPipeline } from './interfaces';
import { StageRegistry } from '../registry/stage-registry';
import { Logger } from '@/common/logger.service';
import { Pipeline } from './pipeline';

export class PipelineBuilder {
    private readonly logger = new Logger(PipelineBuilder.name);
    private stages: IPipelineStage<any, any>[] = [];

    constructor(private readonly stageRegistry?: StageRegistry) {}

    /**
     * Add a stage to the pipeline
     * @param stage Stage instance or registered stage key
     */
    use<TInput, TOutput>(stage: IPipelineStage<TInput, TOutput> | string): this {
        if (typeof stage === 'string') {
            if (!this.stageRegistry) {
                throw new Error('Cannot use string stage reference without a StageRegistry');
            }
            const resolvedStage = this.stageRegistry.get(stage);
            this.stages.push(resolvedStage);
            this.logger.debug(`Added registered stage: ${stage}`);
        } else {
            this.stages.push(stage);
            this.logger.debug(`Added direct stage instance: ${stage.constructor.name}`);
        }
        return this;
    }

    /**
     * Build a pipeline from configuration object
     * @param config Pipeline configuration
     */
    buildFromConfig(config: { pipeline: Array<{ stage: string; params?: Record<string, any>; config?: any }> }): IPipeline {
        if (!this.stageRegistry) {
            throw new Error('Cannot build from config without a StageRegistry');
        }

        this.stages = []; // Reset any existing stages

        for (const step of config.pipeline) {
            try {
                const stage = this.stageRegistry.get(step.stage);

                // Apply parameters if provided
                if (step.params) {
                    Object.assign(stage, step.params);
                }

                // Apply configuration if stage supports it
                if (step.config && typeof (stage as any).setConfig === 'function') {
                    (stage as any).setConfig(step.config);
                }

                this.stages.push(stage);
                this.logger.debug(`Configured stage: ${step.stage}`);
            } catch (error: any) {
                throw new Error(`Failed to configure stage '${step.stage}': ${error.message}`);
            }
        }

        return this.build();
    }

    /**
     * Finalize pipeline construction
     */
    build(): IPipeline {
        if (this.stages.length === 0) {
            this.logger.warn('Building empty pipeline');
        }

        // Validate stage compatibility
        for (let i = 0; i < this.stages.length - 1; i++) {
            const current = this.stages[i];
            const next = this.stages[i + 1];

            // Simple type checking - in real implementation you'd want more robust checks
            if (typeof current.process !== 'function' || typeof next.process !== 'function') {
                throw new Error(`Stage ${i + 1} is not compatible with stage ${i}`);
            }
        }

        return new Pipeline([...this.stages]);
    }

    /**
     * Clear all configured stages
     */
    clear(): void {
        this.stages = [];
    }
}
