import { logger, parseDate } from '../../common';
import { State } from 'src/model/state';
import { Document } from 'src/model/document';
import { JobConfig } from 'src/model/job-config';
import axios from 'axios';

export const fedRegisterParser = async (state: State, jobConfig: JobConfig): Promise<State> => {
    logger.info(`Starting Federal Register Parser`);

    try {
        const url = buildFedRegisterUrl();
        console.log(url);

        const documents: Document[] = await fetchFedRegisterDocuments(url, jobConfig);

        logger.info(`Extracted ${documents.length} items from Federal Register API`);
        return { ...state, documents };
    } catch (error: any) {
        logger.error(`Error parsing Federal Register API: ${error.message}`);
        return state;
    }
};

async function fetchFedRegisterDocuments(url: string, jobConfig: JobConfig): Promise<Document[]> {
    logger.debug(`Fetching Federal Register documents from ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    logger.debug(`Federal Register API response received, found ${response.data.count} documents`);

    // Check if we have results
    if (!response.data.results || !Array.isArray(response.data.results)) {
        logger.warn('No results found in Federal Register API response');
        return [];
    }

    // Map API results to Document objects
    const documents = response.data.results.map((item: any) => mapFedRegisterItemToDocument(item, jobConfig));

    logger.info(`Mapped ${documents.length} Federal Register documents`);
    return documents;
}

function mapFedRegisterItemToDocument(item: any, jobConfig: JobConfig): Document {
    let document: Document = {
        ...jobConfig.defaults,
        title: item.title || 'No title',
        summary: item.abstract || '',
        publishedOn: parseDate(item.publication_date || item.filed_at),
        linkToRegChangeText: item.pdf_url || '',
        // Additional Federal Register specific fields
        introducedOn: item.effective_on,
        firstEffectiveDate: item.effective_on,
        enactedDate: item.enacted_on,
        identifier: item.document_number,
        regType: item.type,
        citationId: item.citationId,
        issuingAuthority: item.agencies[0].name,
    };
    return document;
}

function buildFedRegisterUrl(): string {
    const baseUrl = 'https://www.federalregister.gov/api/v1/documents.json';
    const urlParams = new URLSearchParams();

    urlParams.append('per_page', '20');
    urlParams.append('conditions[publication_date][is]', '2024-03-26');

    // Add agency conditions
    interestedAgencies.forEach(agency => urlParams.append('conditions[agencies][]', agency));

    // Add term conditions
    interestedTerms.forEach(term => urlParams.append('conditions[type][]', term));

    return `${baseUrl}?${urlParams.toString()}`;
}

const interestedAgencies = [
    'agriculture-department',
    'alcohol-and-tobacco-tax-and-trade-bureau',
    'census-bureau',
    'commerce-department',
    'commodity-credit-corporation',
    'commodity-futures-trading-commission',
    'community-development-financial-institutions-fund',
    'comptroller-of-the-currency',
    'consumer-financial-protection-bureau',
    'defense-department',
    'economic-analysis-bureau',
    'education-department',
    'employee-benefits-security-administration',
    'employment-and-training-administration',
    'employment-standards-administration',
    'equal-employment-opportunity-commission',
    'executive-office-of-the-president',
    'farm-credit-administration',
    'farm-credit-system-insurance-corporation',
    'farm-service-agency',
    'federal-accounting-standards-advisory-board',
    'federal-aviation-administration',
    'federal-communications-commission',
    'federal-contract-compliance-programs-office',
    'federal-crop-insurance-corporation',
    'federal-deposit-insurance-corporation',
    'federal-election-commission',
    'federal-emergency-management-agency',
    'federal-energy-regulatory-commission',
    'federal-financial-institutions-examination-council',
    'federal-housing-finance-agency',
    'federal-housing-finance-board',
    'federal-labor-relations-authority',
    'federal-reserve-system',
    'federal-trade-commission',
    'financial-crimes-enforcement-network',
    'financial-stability-oversight-council',
    'foreign-assets-control-office',
    'health-and-human-services-department',
    'homeland-security-department',
    'housing-and-urban-development-department',
    'industry-and-security-bureau',
    'internal-revenue-service',
    'judicial-conference-of-the-united-states',
    'justice-department',
    'labor-department',
    'national-archives-and-records-administration',
    'national-credit-union-administration',
    'national-labor-relations-board',
    'occupational-safety-and-health-administration',
    'patent-and-trademark-office',
    'pension-benefit-guaranty-corporation',
    'personnel-management-office',
    'postal-regulatory-commission',
    'postal-service',
    'rural-business-cooperative-service',
    'rural-housing-service',
    'rural-utilities-service',
    'securities-and-exchange-commission',
    'small-business-administration',
    'social-security-administration',
    'state-department',
    'treasury-department',
    'united-states-sentencing-commission',
    'wage-and-hour-division',
];
const interestedTerms: string[] = [];
