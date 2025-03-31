import { JobConfig, State } from '../../model';
import { parse, isValid, format } from 'date-fns';

export function textCleanUpEnricher(state: State, jobConfig: JobConfig) {
    if (!state.documents || state.documents.length === 0) return;

    state.documents = state.documents.map(doc => {
        const cleanedDoc = { ...doc };
        for (const [key, value] of Object.entries(doc)) {
            if (typeof value === 'string') {
                (cleanedDoc as any)[key] = processFieldValue(key, value);
            }
        }
        return cleanedDoc;
    });
}

function convertDateToISOString(dateStr: string): string {
    try {
        const parsedDate = parse(dateStr, 'MM/dd/yyyy', new Date());
        if (isValid(parsedDate)) {
            // Format as just YYYY-MM-DD without time component
            return format(parsedDate, 'yyyy-MM-dd');
        }
        return dateStr;
    } catch (error) {
        console.warn(`Failed to convert date: ${dateStr}`, error);
        return dateStr;
    }
}

function processFieldValue(key: string, value: string): string {
    let processedValue = value.trim();

    // Special handling for publishedOn dates
    if (key === 'publishedOn' && processedValue.includes('/')) {
        processedValue = convertDateToISOString(processedValue);
    }

    return processedValue;
}
