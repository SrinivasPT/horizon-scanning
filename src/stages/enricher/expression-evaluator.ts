import { evaluateExpression } from '../../common/util';
import { JobConfig, State } from '../../model';

export function expressionEvalEnricher(state: State, jobConfig: JobConfig) {
    if (!state.documents || state.documents.length === 0) return;

    let documents = state.documents as any[];
    documents = documents.map(doc => {
        const evaluatedDoc = { ...doc };
        for (const [key, value] of Object.entries(doc)) {
            if (typeof value === 'string' && value.includes('${')) {
                evaluatedDoc[key] = evaluateExpression(value, doc);
            }
        }
        return evaluatedDoc;
    });

    // Update state with processed documents
    state.documents = documents;
}
