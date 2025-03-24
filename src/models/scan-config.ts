import { Document } from './document';

export interface PipelineStep {
    stage: string;
    params?: Record<string, any>;
    config?: any;
    disabled?: boolean;
}

export interface PipelineConfig {
    pipeline: PipelineStep[];
}

export interface ScanConfig {
    id: string;
    name: string;
    description?: string;
    url: string;
    schedule?: string;
    pipeline: PipelineConfig;
    defaults?: Partial<Document>;
    metadata?: Record<string, any>;
}
