export function mapObjects<S extends Record<string, any>, D extends Record<string, any>>(source: S, destination: D, mappings: string[]): D {
    // Process each mapping string
    mappings.forEach(mapping => {
        // Split the mapping into source and destination parts
        const parts = mapping.split('->').map(part => part.trim());

        if (parts.length === 2) {
            const [sourcePath, destPath] = parts;

            // Get value from the source using path (handles nested properties with dot notation)
            const sourceValue = getNestedValue(source, sourcePath);

            // Only set if source value exists and is not undefined
            if (sourceValue !== undefined) {
                // Set the value in the destination using path
                setNestedValue(destination, destPath, sourceValue);
            }
        }
    });

    return destination;
}

export function getNestedValue(obj: Record<string, any>, path: string): any {
    // Handle non-nested case
    if (!path.includes('.')) {
        return obj[path];
    }

    // Handle nested case
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
        // If result is null/undefined or not an object, we can't go deeper
        if (result === null || result === undefined || typeof result !== 'object') {
            return undefined;
        }

        result = result[key];
    }

    return result;
}

export function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    // Handle non-nested case
    if (!path.includes('.')) {
        obj[path] = value;
        return;
    }

    // Handle nested case
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    // Traverse/create the path
    for (const key of keys) {
        // Create object if it doesn't exist
        if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }

    // Set the final value
    current[lastKey] = value;
}
