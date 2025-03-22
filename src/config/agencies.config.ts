import ScanConfig from 'src/models/scan-config';

const agencyConfigs: ScanConfig[] = [
    {
        id: 1,
        name: 'BIS-BCBS-PUBLICATION',
        url: 'https://www.bis.org/doclist/bcbspubls.rss',
        scannerType: 'RSS',
        defaults: { source: 'BIS', issuingAuthority: 'BCBS', eventType: 'PUBLICATION' },
    },
];

export default agencyConfigs;
