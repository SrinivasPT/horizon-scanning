import { JobConfig, State } from '../../model';

export function textCleanUpEnricher(state: State, jobConfig: JobConfig) {
    if (!state.documents || state.documents.length === 0) return;

    state.documents = state.documents.map(doc => {
        const cleanedDoc = { ...doc };
        for (const [key, value] of Object.entries(doc)) {
            if (typeof value === 'string') {
                (cleanedDoc as any)[key] = value.trim();
            }
        }
        return cleanedDoc;
    });
}
