import { logger, parseDate } from '../../common';
import { Document, JobConfig, State } from '../../model';
import axios from 'axios';
import { Parser } from 'xml2js';
import { parseStringPromise } from 'xml2js';

export const rssParser = async (state: State, jobConfig: JobConfig): Promise<State> => {
    logger.info(`Starting RSS Parser`);

    try {
        const documents: Document[] = await fetchRssFeed(jobConfig.url, jobConfig);

        logger.info(`Extracted ${documents.length} items from RSS feed`);
        return { ...state, documents };
    } catch (error: any) {
        logger.error(`Error parsing RSS feed: ${error.message}`);
        return state;
    }
};

async function fetchRssFeed(rssUrl: string, jobConfig: JobConfig): Promise<Document[]> {
    logger.debug(`Fetching RSS feed from ${rssUrl}`);
    const response = await axios.get(rssUrl, { timeout: 6000 });
    logger.debug(`RSS response received, content length: ${response.data.length}`);

    const parser = new Parser({
        explicitArray: true,
        mergeAttrs: true,
        xmlns: true,
        // Add this to preserve CDATA information
        explicitCharkey: true,
        preserveChildrenOrder: true, // Fixed property name
    });

    const result = await parseStringPromise(response.data);
    let rawItems: any[] = [];

    // Handle standard RSS 2.0 format
    if (result.rss?.channel?.[0]?.item) {
        rawItems = result.rss.channel[0].item;
    } else if (result['rdf:RDF']?.item) {
        rawItems = Array.isArray(result['rdf:RDF'].item) ? result['rdf:RDF'].item : [result['rdf:RDF'].item];
    } else if (result.feed?.entry) {
        rawItems = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];
    }

    // Normalize items
    const items: Document[] = rawItems.map(item => {
        const { description, htmlContent } = getDescriptionContent(item);

        return {
            ...jobConfig.defaults,
            title: item.title?.[0] || item.title || 'No title',
            summary: description,
            htmlContent,
            publishedOn: parseDate(item.pubDate?.[0] || item.published?.[0] || item['dc:date']?.[0]),
            linkToRegChangeText: item.link?.[0]?.href || item.link?.[0] || item.link || '',
        };
    });

    logger.info(`Found ${items.length} items in the RSS feed`);
    return items;
}

function getDescriptionContent(item: any): { description: string; htmlContent: string } {
    // Get the raw description content
    const descriptionContent = item.description?.[0] || item.description || item.summary?.[0] || '';

    // Check if description contains CDATA
    const hasCDATA = typeof descriptionContent === 'object' && (descriptionContent['_'] || descriptionContent['#']);

    // Extract HTML content if CDATA exists
    const htmlContent = hasCDATA ? descriptionContent['_'] || descriptionContent['#'] : '';

    // Set description to empty if CDATA exists, otherwise use the plain text
    const description = hasCDATA ? '' : descriptionContent;

    return { description, htmlContent };
}
