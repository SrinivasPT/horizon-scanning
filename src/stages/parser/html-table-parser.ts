import { logger, joinUrl } from '../../common';
import { load } from 'cheerio';
import { HtmlTableParseConfig, JobConfig } from 'src/model/job-config';
import { State } from 'src/model/state';
import { Document } from 'src/model/document';

export const htmlTableParser = (state: State, jobConfig: JobConfig): State => {
    logger.info(`Starting HTML Table Parser`);

    const $ = load(state.rawData as string);
    const config = jobConfig.pipeline.find(stage => stage.stage === 'HTML-TABLE-PARSER');

    if (!config || !config.config) {
        logger.warn('No HTML-TABLE-PARSER config found');
        return state;
    }

    const tableConfig = config.config as HtmlTableParseConfig;

    // Process rows from the table
    const rows = processTableRows($, tableConfig, jobConfig);

    logger.info(`Extracted ${rows.length} rows from the table`);

    return { ...state, documents: rows };
};

function processTableRows($: any, config: HtmlTableParseConfig, jobConfig: JobConfig): Document[] {
    const rows: Document[] = [];

    $(config.tableSelector).each((rowIndex: number, row: any) => {
        logger.debug(`Processing row ${rowIndex}...`);

        // Extract data based on column configurations
        const rowData = extractRowData($, $(row), config, jobConfig);
        rows.push(rowData);
    });

    return rows;
}

function extractRowData($: any, rowElement: any, config: HtmlTableParseConfig, jobConfig: JobConfig): Document {
    const rowData: Document = {};

    for (const column of config.columns) {
        const element = rowElement.find(column.selector);

        if (!element.length) continue; // Skip if element not found

        if (column.attribute) {
            (rowData as any)[column.name] = element.attr(column.attribute)?.trim();
            continue;
        }

        if (!column.isLink) {
            (rowData as any)[column.name] = element.text().trim(); // Extract text content
            continue;
        }

        const linkAttr = column.linkAttribute || 'href';
        const href = element.attr(linkAttr) || element.find('a').attr(linkAttr);

        if (!href) continue;

        const baseUrl = jobConfig.url || '';
        // Use our utility function to correctly join the URL
        (rowData as any)[column.name] = joinUrl(baseUrl, href);
    }

    // Merge with default values
    return { ...jobConfig.defaults, ...rowData };
}
