import { ScanConfig } from './scan-config';

export interface IPipelineStage<TInput, TOutput> {
    process(input: TInput): Promise<TOutput>;
}

export interface PipelineBuilder {
    use<TInput, TOutput>(stage: IPipelineStage<TInput, TOutput>): PipelineBuilder;
    build(): Pipeline;
}

export interface Pipeline {
    execute(input: any): Promise<any>;
}

export interface StageRegistry {
    register(key: string, stage: IPipelineStage<any, any>): void;
    get(key: string): IPipelineStage<any, any>;
    has(key: string): boolean;
}

export interface PipelineData {
    rawContent?: any; // Original downloaded content
    structuredData?: any; // Parsed/intermediate representation
    documents?: Document[]; // Final processed documents
    metadata: {
        // Contextual information
        config: ScanConfig;
        [key: string]: any;
    };
    errors: Error[]; // Accumulated errors
}
