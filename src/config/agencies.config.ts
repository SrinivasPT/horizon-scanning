import ScanConfig from 'src/models/scan-config';

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
];

export default agencyConfigs;
