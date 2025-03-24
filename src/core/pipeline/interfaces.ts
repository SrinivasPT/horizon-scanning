// src/core/pipeline/interfaces.ts
export interface IPipelineStage<TInput, TOutput> {
    process(input: TInput): Promise<TOutput>;
    setConfig?(config: any): void;
}

export interface IPipeline {
    execute(input: any): Promise<any>;
}
