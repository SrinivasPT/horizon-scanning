import axios from 'axios';
import * as cheerio from 'cheerio';
import BaseScanner from './base-scanner';
import Document from '../models/document';
import { chromium, Browser, Page } from 'playwright';
import ScanConfig, { HtmlTableSelector, ColumnDefinition } from 'src/models/scan-config';
import htmlToMarkdown from '../utils/html-to-md';

// Interface for table row data
export interface TableRow {
    [key: string]: string;
}

export class HtmlTableScanner extends BaseScanner {
    private browser: Browser | null = null;

    constructor(scanConfig: ScanConfig) {
        super(scanConfig);
    }

    public async scan(): Promise<Document[]> {
        const documents: Document[] = [];

        try {
            const url = this.scanConfig.url;
            const tableRows = await this.fetchTableData(url);
            const agencyDocuments = tableRows.map(row => this.parseToDocument(row));
            documents.push(...agencyDocuments);
        } catch (error: any) {
            console.error(`Error scanning HTML table for ${this.scanConfig.name} at ${this.scanConfig.url}:`, error.message);
            throw error;
        } finally {
            // Clean up Playwright browser if it was used
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
        }

        return documents;
    }

    public parseToDocument(row: TableRow): Document {
        // Define default mappings for HTML table fields to Document fields
        const defaultTableMappings = [
            'identifier->identifier',
            'title->title',
            'summary->summary',
            'publishedOn->publishedOn',
            'url->linkToRegChangeText',
            'category->category',
            'source->source',
        ];

        // Use the BaseScanner's createDocument method with the mapping format
        const documentResult = this.createDocument(row, defaultTableMappings);

        // Special case handling for HTML table-specific fields
        if (!documentResult.publishedOn && row.publishDate) {
            documentResult.publishedOn = row.publishDate;
        }

        if (row.content && !documentResult.summary) {
            documentResult.summary = htmlToMarkdown.convert(row.content);
        }

        return documentResult;
    }

    private async fetchTableData(url: string): Promise<TableRow[]> {
        try {
            const scannerType = this.scanConfig.scannerType || 'HTML_TABLE';
            let htmlContent: string;

            if (scannerType === 'PLAYWRIGHT') {
                // Use Playwright for dynamic content
                this.browser = await chromium.launch({ headless: false });
                const page = await this.browser.newPage();

                // await page.goto(url, { waitUntil: 'networkidle' });
                await page.goto(url, { waitUntil: 'domcontentloaded' });
                await page.waitForSelector(this.scanConfig?.selector?.tableSelector as string, { state: 'attached' });
                htmlContent = await page.content();
                await page.close();

                console.log(`HTML response received via Playwright from ${url}, content length: ${htmlContent.length}`);
            } else {
                // Default to Axios for static content
                const response = await axios.get(url);
                htmlContent = response.data;
                console.log(`HTML response received via Axios from ${url}, content length: ${htmlContent.length}`);
            }

            const $ = cheerio.load(htmlContent);
            const config = this.getTableConfig();
            const headers = this.extractTableHeaders($, config);
            const rows = this.processTableRows($, config, headers, url);

            this.logResults(rows);
            return rows;
        } catch (error: any) {
            console.error(`Error fetching HTML table data: ${error.message}`);
            throw error;
        }
    }

    private logResults(rows: TableRow[]): void {
        console.log(`Found ${rows.length} rows in the table for ${this.scanConfig.name}`);
        if (rows.length > 0) {
            console.debug(`First row sample: ${JSON.stringify(rows[0]).substring(0, 200)}...`);
        }
    }

    private getTableConfig(): HtmlTableSelector {
        return {
            tableSelector: this.scanConfig.selector?.tableSelector || 'table',
            rowSelector: this.scanConfig.selector?.rowSelector || '',
            headerRowIndex: this.scanConfig.selector?.headerRowIndex ?? 0,
            columns: this.scanConfig.selector?.columns || [],
            isDivTable: this.scanConfig.selector?.isDivTable || false,
        };
    }

    private extractTableHeaders($: any, config: HtmlTableSelector): string[] {
        // If columns config exists, use it
        if (config.columns && config.columns.length > 0) {
            return this.extractHeadersFromConfig(config.columns);
        }

        // Extract headers from HTML
        return config.isDivTable ? this.extractHeadersFromDivTable($, config) : this.extractHeadersFromHtmlTable($, config);
    }

    private extractHeadersFromConfig(columns: Array<string | ColumnDefinition>): string[] {
        return columns
            .map((col: any) => {
                if (typeof col === 'string') {
                    return col.replace(/\s+/g, '_');
                } else if (typeof col === 'object' && col.name) {
                    return col.name.replace(/\s+/g, '_');
                }
                return '';
            })
            .filter(Boolean);
    }

    private extractHeadersFromDivTable($: cheerio.CheerioAPI, config: HtmlTableSelector): string[] {
        const headers: string[] = [];
        console.warn('Div-based table without columns configuration detected. Attempting to infer headers.');

        $(config.tableSelector)
            .find(config.rowSelector || '')
            .eq(config.headerRowIndex || -1)
            .find('div, span')
            .each((_, cell) => {
                headers.push(this.extractHeaderText($, cell));
            });

        this.warnIfNoHeaders(headers);
        return headers;
    }

    private extractHeadersFromHtmlTable($: cheerio.CheerioAPI, config: HtmlTableSelector): string[] {
        const headers: string[] = [];

        $(config.tableSelector)
            .find(config.rowSelector || '')
            .eq(config.headerRowIndex || -1)
            .find('th, td')
            .each((_, cell) => {
                headers.push(this.extractHeaderText($, cell));
            });

        this.warnIfNoHeaders(headers);
        return headers;
    }

    private extractHeaderText($: cheerio.CheerioAPI, cell: cheerio.Element): string {
        let headerText = $(cell).text().trim();

        if (!headerText) {
            // Try to use class name as column header
            const classes = $(cell).attr('class')?.split(/\s+/) || [];
            if (classes.length > 0) {
                headerText = classes[0];
            }
        }

        return headerText.toLowerCase().replace(/\s+/g, '_');
    }

    private warnIfNoHeaders(headers: string[]): void {
        if (headers.length === 0) {
            console.warn('No headers found in table. Using column indexes as keys.');
        }
    }

    private processTableRows($: any, config: HtmlTableSelector, headers: string[], baseUrl: string): TableRow[] {
        const rows: TableRow[] = [];
        const selector = `${config.tableSelector} ${config.rowSelector} tr`; // Adding tr to get the rows

        $(selector).each((rowIndex: number, row: any) => {
            console.log(`Processing row ${rowIndex}...`);
            // Skip header rows
            let rowData: any = {};
            if (config.headerRowIndex !== rowIndex) rowData = this.extractRowData($, row, headers, baseUrl, config);

            // Only add non-empty rows
            if (Object.keys(rowData).length > 0) {
                // Add source information
                rowData.source = this.scanConfig.defaults?.source || this.scanConfig.name;
                rows.push(rowData);
            }
        });

        return rows;
    }

    private extractRowData(
        $: cheerio.CheerioAPI,
        row: cheerio.Element,
        headers: string[],
        baseUrl: string,
        config: HtmlTableSelector
    ): TableRow {
        const rowData: TableRow = {};

        // Check if we have column definitions with selectors
        if (this.hasColumnSelectors(config.columns)) {
            this.extractDataUsingColumnSelectors($, row, headers, baseUrl, config.columns, rowData);
        } else if (config.isDivTable) {
            this.extractDataFromDivRow($, row, headers, baseUrl, rowData);
        } else {
            this.extractDataFromTableRow($, row, headers, baseUrl, rowData);
        }

        return rowData;
    }

    private hasColumnSelectors(columns: Array<string | ColumnDefinition> = []): boolean {
        return columns.length > 0 && typeof columns[0] === 'object' && 'selector' in columns[0];
    }

    private extractDataUsingColumnSelectors(
        $: cheerio.CheerioAPI,
        row: cheerio.Element,
        headers: string[],
        baseUrl: string,
        columns: Array<string | ColumnDefinition> = [],
        rowData: TableRow
    ): void {
        columns.forEach((column: any, index: number) => {
            if (column.selector) {
                const cellElement = $(row).find(column.selector);
                if (cellElement.length > 0) {
                    const cellText = cellElement.text().trim();
                    const key = headers[index] || column.name || `column_${index}`;
                    this.processCellData($, cellElement[0], key, cellText, rowData, baseUrl);
                }
            }
        });
    }

    private extractDataFromDivRow(
        $: cheerio.CheerioAPI,
        row: cheerio.Element,
        headers: string[],
        baseUrl: string,
        rowData: TableRow
    ): void {
        $(row)
            .children()
            .each((colIndex, cell) => {
                const cellText = $(cell).text().trim();
                const key = this.getColumnKey($, cell, colIndex, headers);
                this.processCellData($, cell, key, cellText, rowData, baseUrl);
            });
    }

    private extractDataFromTableRow(
        $: cheerio.CheerioAPI,
        row: cheerio.Element,
        headers: string[],
        baseUrl: string,
        rowData: TableRow
    ): void {
        $(row)
            .find('td')
            .each((colIndex, cell) => {
                const cellText = $(cell).text().trim();
                const key = this.getColumnKey($, cell, colIndex, headers);
                this.processCellData($, cell, key, cellText, rowData, baseUrl);
            });
    }

    private getColumnKey($: cheerio.CheerioAPI, cell: cheerio.Element, colIndex: number, headers: string[]): string {
        // Use header if available
        let key = headers[colIndex] || `column_${colIndex}`;

        // If we're using a generic column name, try to get it from the class
        if (key === `column_${colIndex}`) {
            const classes = $(cell).attr('class')?.split(/\s+/) || [];
            if (classes.length > 0) {
                key = classes[0].toLowerCase().replace(/\s+/g, '_');
            }
        }

        return key;
    }

    private processCellData(
        $: cheerio.CheerioAPI,
        cell: cheerio.Element | undefined,
        key: string,
        cellText: string,
        rowData: TableRow,
        baseUrl: string
    ): void {
        if (!cell) return;

        // Process hyperlinks (for URL columns)
        const linkElement = $(cell).find('a');
        if (linkElement.length > 0) {
            const href = linkElement.attr('href') || '';

            // Check if it's a URL column based on key name
            if (key.includes('url') || key.includes('link')) {
                // Make sure we have an absolute URL
                rowData[key] = this.normalizeUrl(href, baseUrl);
            }
            // else {
            //     // Save both text and URL
            //     rowData[key] = cellText;
            //     rowData[`${key}_url`] = this.normalizeUrl(href, baseUrl);
            // }
        } else {
            rowData[key] = cellText;
        }
    }

    private normalizeUrl(href: string, baseUrl: string): string {
        if (!href) return '';
        return href.startsWith('/') ? new URL(href, baseUrl).toString() : href;
    }
}

export default HtmlTableScanner;
