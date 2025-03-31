import { Document } from './document';

export interface State {
    runId?: number;
    correlationId?: string;
    lastRunDate?: Date;
    rawData?: string;
    documents?: Document[];
}
