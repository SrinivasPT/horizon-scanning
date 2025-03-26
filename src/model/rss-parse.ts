export interface RssParseConfig {
    fieldMappings: string[]; // Format: "sourceField->targetField"
    convertHtmlToMarkdown?: boolean;
    customNamespaces?: { [prefix: string]: string };
}

// Type for RSS parsing
export interface RssItem {
    title?: string | any[];
    link?: string | any[];
    description?: string | any[];
    pubDate?: string | any[];
    'dc:date'?: string | any[];
    'cb:paper'?: any;
    [key: string]: any;
}
