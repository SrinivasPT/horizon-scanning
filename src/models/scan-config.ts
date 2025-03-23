export interface ColumnDefinition {
    name: string;
    selector?: string;
}

export interface HtmlTableSelector {
    isDivTable?: boolean;
    columns?: Array<string | ColumnDefinition>;
    tableSelector?: string;
    rowSelector?: string;
    headerRowIndex?: number;
    skipHeaderRows?: number;
}

export default interface ScanConfig {
    id: number;
    name: string;
    url: string;
    scannerType: string;
    selector?: HtmlTableSelector; // For HTML & Playwright
    mapper?: string[];
    defaults: { [key: string]: string };
}
