import { Document } from './document';

export interface State {
    runId?: number;
    correlationId?: string;
    rawData?: string;
    documents?: Document[];
}
