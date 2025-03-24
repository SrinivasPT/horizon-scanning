export interface TableParserConfig {
    tableSelector: string;
    rowSelector: string;
    columns: ColumnConfig[];
    skipFirstRow?: boolean;
}

export interface ColumnConfig {
    name: string;
    selector: string;
    attribute?: string;
    extract?: 'text' | 'html' | 'attribute';
}
