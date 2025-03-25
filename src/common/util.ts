export function evaluateExpression(expression: string, document: any): string {
    if (!expression) return '';

    try {
        // Replace ${...} expressions with their evaluated values
        return expression.replace(/\${([^}]+)}/g, (match, expr) => {
            // Create a context with document fields as variables
            const context = { ...document };

            // Create function arguments string from context object
            const contextArgs = Object.keys(context).join(',');
            // Create function argument values array
            const contextValues = Object.values(context);

            // Create a function that will execute in the context of our variables
            const evalFunc = new Function(contextArgs, `return ${expr};`);

            // Execute the function with our context values
            const result = evalFunc.apply(null, contextValues);
            return result !== undefined && result !== null ? String(result) : '';
        });
    } catch (error) {
        console.error(`Error evaluating expression '${expression}':`, error);
        return expression; // Return original expression in case of error
    }
}

export function joinUrl(baseUrl: string, path: string): string {
    if (!baseUrl) return path;
    if (!path) return baseUrl;

    // If path is already a complete URL, return it as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    // Ensure path starts with slash
    const cleanPath = path.startsWith('/') ? path : '/' + path;

    try {
        // Try to use the URL constructor for proper joining
        const url = new URL(cleanPath, cleanBaseUrl);
        return url.toString();
    } catch (e) {
        // Fallback to manual joining if URL constructor fails
        return cleanBaseUrl + cleanPath;
    }
}
