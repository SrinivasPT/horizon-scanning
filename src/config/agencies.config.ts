import ScanConfig from 'src/models/scan-config';

/**
 * HTML Selector:
 * - URL - Ensure that key is 'url' and value is the selector for element containing the URL
 * - PublishedOn - Ensure that key is 'publishedOn' and value is the selector for element containing the published date
 */

const agencyConfigs: ScanConfig[] = [
    {
        id: 1,
        name: 'BIS-BCBS-PUBLICATION',
        url: 'https://www.bis.org/doclist/bcbspubls.rss',
        scannerType: 'RSS',
        defaults: { source: 'BIS', issuingAuthority: 'BCBS', eventType: 'PUBLICATION' },
    },
    {
        id: 2,
        name: 'SEC-NEWS-PRESS-RELEASES',
        url: 'https://www.sec.gov/news/pressreleases.rss',
        scannerType: 'RSS',
        defaults: { source: 'SEC', issuingAuthority: 'NEWS', eventType: 'PRESS-RELEASES' },
    },
    {
        id: 3,
        name: 'FDIC-NEWS-PRESS-RELEASES',
        url: 'https://public.govdelivery.com/topics/USFDIC_26/feed.rss',
        scannerType: 'RSS',
        defaults: { source: 'FDIC', issuingAuthority: 'NEWS', eventType: 'PRESS-RELEASES' },
    },
    {
        id: 4,
        name: 'FRB-NEWS-PRESS-RELEASES',
        url: 'https://www.federalreserve.gov/feeds/press_all.xml',
        scannerType: 'RSS',
        defaults: { source: 'FRB', issuingAuthority: 'NEWS', eventType: 'PRESS-RELEASES' },
    },
    {
        id: 5,
        name: 'FDIC-NEWS-FIN-INST-LETTERS',
        url: 'https://fdic.gov/news/financial-institution-letters/index.html',
        scannerType: 'HTML_TABLE',
        selector: {
            isDivTable: true,
            tableSelector: '.views-element-container',
            rowSelector: '.views-row',
            headerRowIndex: -1,
            columns: [
                { name: 'publishedOn', selector: '.news-date' },
                { name: 'title', selector: '.news-title' },
                { name: 'summary', selector: '.news-content' },
                { name: 'url', selector: '.news-title' },
            ],
        },
        defaults: { source: 'FDIC', issuingAuthority: 'NEWS', eventType: 'FIN-INST-LETTERS' },
    },
    {
        id: 6,
        name: 'FINCEN-RESOURCES-ALERTS',
        url: 'https://fincen.gov/resources/advisoriesbulletinsfact-sheets',
        scannerType: 'HTML_TABLE',
        selector: {
            isDivTable: false,
            tableSelector: '#block-alerts table tr',
            headerRowIndex: 0,
            columns: [
                { name: 'identifier', selector: 'td:first-child' },
                { name: 'publishedOn', selector: 'td:nth-child(2)' },
                { name: 'title', selector: 'td:nth-child(3)' },
                { name: 'url', selector: 'td:first-child' },
            ],
        },
        defaults: { source: 'FINCEN', issuingAuthority: 'RESOURCES', eventType: 'ALERTS' },
    },
    {
        id: 7,
        name: 'FINCEN-RESOURCES-ADVISORIES',
        url: 'https://fincen.gov/resources/advisoriesbulletinsfact-sheets',
        scannerType: 'HTML_TABLE',
        selector: {
            isDivTable: false,
            tableSelector: '#block-views-block-advisories-block-1-2',
            headerRowIndex: 0,
            columns: [
                { name: 'identifier', selector: 'td:first-child' },
                { name: 'publishedOn', selector: 'td:nth-child(2)' },
                { name: 'title', selector: 'td:nth-child(3)' },
                { name: 'url', selector: 'td:first-child' },
            ],
        },
        defaults: { source: 'FINCEN', issuingAuthority: 'RESOURCES', eventType: 'ADVISORIES' },
    },
    {
        id: 8,
        name: 'SEC-RULE-MAKING',
        url: 'https://www.sec.gov/rules-regulations/rulemaking-activity',
        scannerType: 'PLAYWRIGHT',
        selector: {
            isDivTable: false,
            tableSelector: '.usa-table.views-table.views-view-table',
            headerRowIndex: 0,
            columns: [
                { name: 'publishedOn', selector: '.views-field-field-publish-date time.datetime' },
                { name: 'identifier', selector: '.views-field-field-release-file-number' },
                { name: 'title', selector: '.view-field-custom--rulemaking' },
                { name: 'url', selector: '.view-field-custom--status' },
            ],
        },
        defaults: { source: 'SEC', issuingAuthority: 'RESOURCES', eventType: 'RULE' },
    },
];

export default agencyConfigs;
