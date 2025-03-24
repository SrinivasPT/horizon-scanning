import { PipelineConfig, ScanConfig } from '@/models';

const SECRuleMakingConfig: PipelineConfig = {
    pipeline: [
        {
            stage: 'playwright-download',
            params: { headless: true, waitForSelector: '.usa-table', timeout: 3000 },
        },
        {
            stage: 'html-table-parse',
            config: {
                tableSelector: '.usa-table.views-table',
                columns: [
                    { name: 'publishedOn', selector: '.views-field-field-publish-date time', attribute: 'datetime' },
                    { name: 'identifier', selector: '.views-field-field-release-file-number' },
                    { name: 'title', selector: '.view-field-custom--rulemaking a', extract: 'text' },
                    { name: 'url', selector: '.view-field-custom--rulemaking a', extract: 'href', transform: 'resolveUrl' },
                    { name: 'status', selector: '.view-field-custom--status' },
                ],
                rowSelector: 'tbody tr',
            },
        },
    ],
};

const SECPressReleasesConfig: PipelineConfig = {
    pipeline: [
        { stage: 'rss-download', params: { url: 'https://www.sec.gov/news/pressreleases.rss' } },
        {
            stage: 'rss-parser',
            config: {
                fieldMappings: { title: 'title', summary: 'description', publishedOn: 'pubDate', url: 'link' },
            },
        },
    ],
};

export const SECConfigs: ScanConfig[] = [
    {
        id: 'sec-rule-making',
        name: 'SEC Rulemaking Activity',
        description: 'Tracks proposed and final rules from the SEC',
        url: 'https://www.sec.gov/rules-regulations/rulemaking-activity',
        schedule: '0 9 * * 1-5', // Weekdays at 9 AM
        pipeline: SECRuleMakingConfig,
        defaults: {
            source: 'SEC',
            issuingAuthority: 'SEC',
            eventType: 'RULEMAKING',
            topic: 'Financial Regulation',
        },
    },
    {
        id: 'sec-press-releases',
        name: 'SEC Press Releases',
        description: 'Official press releases from the SEC',
        url: 'https://www.sec.gov/news/pressreleases.rss',
        schedule: '0 */2 * * *', // Every 2 hours
        pipeline: SECPressReleasesConfig,
        defaults: {
            source: 'SEC',
            issuingAuthority: 'SEC Office of Public Affairs',
            eventType: 'PRESS_RELEASE',
            topic: 'Announcements',
        },
    },
];
