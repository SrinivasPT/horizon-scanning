import { TableParserConfig, ColumnConfig } from '@/models/table-parser-config';
import { load } from 'cheerio';

export class HtmlTableParser implements IPipelineStage<PipelineData, PipelineData> {
    private config?: TableParserConfig;

    setConfig(config: TableParserConfig) {
        this.config = config;
    }

    async process(input: PipelineData): Promise<PipelineData> {
        if (!this.config) throw new Error('Parser config not set');
        const $ = load(input.rawContent);
        const results: any[] = [];

        $(this.config.tableSelector)
            .find(this.config.rowSelector)
            .each((_, row) => {
                const rowData: Record<string, string> = {};

                this.config?.columns.forEach(col => {
                    const cell = $(row).find(col.selector);
                    rowData[col.name] = this.extractValue($, cell, col);
                });

                results.push(rowData);
            });

        return {
            ...input,
            structuredData: results,
        };
    }

    private extractValue($: any, cell: any, col: ColumnConfig): string {
        if (col.attribute) return cell.attr(col.attribute)?.trim() || '';
        if (col.extract === 'html') return cell.html()?.trim() || '';
        return cell.text().trim();
    }
}
