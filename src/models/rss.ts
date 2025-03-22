/**
 * Interfaces for RSS feed data structures
 */

/**
 * Represents a resource in an RSS item, typically containing links
 */
export interface RssResource {
    'cb:link'?: string | string[] | { _: string };
    [key: string]: any;
}

/**
 * Represents a paper element in RSS feeds that follow the cb namespace
 */
export interface RssPaper {
    'cb:publicationDate'?: string | string[] | { _: string };
    'cb:publication'?: string | string[] | { _: string };
    'cb:resource'?: RssResource | RssResource[];
    [key: string]: any;
}

/**
 * Represents a raw item from an RSS feed
 */
export interface RssItem {
    title?: string | string[] | { _: string };
    link?: string | string[] | { _: string };
    description?: string | string[] | { _: string };
    'dc:date'?: string | string[] | { _: string };
    pubDate?: string | string[] | { _: string };
    'cb:paper'?: RssPaper | RssPaper[];
    [key: string]: any;
}

/**
 * Represents a simplified RSS item with standard properties
 */
export interface SimplifiedRssItem {
    id: string;
    title: string;
    link: string;
    description: string;
    date: string;
    publicationDate?: string;
    publication?: string;
    pdfLink?: string;
}
