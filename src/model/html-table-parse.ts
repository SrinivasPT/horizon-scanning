export interface HtmlTableParseConfig {
    tableSelector: string;
    columns: ColumnConfig[];
    rowSelector: string;
}

export interface ColumnConfig {
    name: string;
    selector: string;
    isLink?: boolean;
    linkAttribute?: string;
    attribute?: string;
    extract?: 'text' | 'href' | 'html';
    transform?: 'resolveUrl' | string; // Add this back as it's in your config.json
}
