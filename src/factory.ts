import { JobConfig } from './model/job-config';
import { State } from './model/state';
import { pdfDownloader } from './stages/downloader/pdf-downloader';
import { webPageDownloader } from './stages/downloader/web-page-downloader';
import { expressionEvalEnricher } from './stages/enricher/expression-evaluator';
import { textCleanUpEnricher } from './stages/enricher/text-cleanup';
import { fedRegisterParser } from './stages/parser/fed-register-parser';
import { htmlTableParser } from './stages/parser/html-table-parser';
import { rssParser } from './stages/parser/rss-parser';
import { summaryExtractorFromHtmlLink } from './stages/summary-extractor/summary-extractor-from-html-link';
import { summaryHtmlToTextExtractor } from './stages/summary-extractor/summary-html-to-text-extractor';

export const factory = {
    'WEB-PAGE-DOWNLOADER': (state: State, jobConfig: JobConfig) => webPageDownloader(state, jobConfig),
    'PDF-DOWNLOADER': (state: State, jobConfig: JobConfig) => pdfDownloader(state, jobConfig),
    'HTML-TABLE-PARSER': (state: State, jobConfig: JobConfig) => htmlTableParser(state, jobConfig),
    'RSS-PARSER': (state: State, jobConfig: JobConfig) => rssParser(state, jobConfig),
    'FED-REGISTER-PARSER': (state: State, jobConfig: JobConfig) => fedRegisterParser(state, jobConfig),
    'EXPRESSION-EVAL-ENRICHER': (state: State, jobConfig: JobConfig) => expressionEvalEnricher(state, jobConfig),
    'TEXT-CLEANUP-ENRICHER': (state: State, jobConfig: JobConfig) => textCleanUpEnricher(state, jobConfig),
    'SUMMARY-FROM-SITE-LINK-EXTRACTOR': (state: State, jobConfig: JobConfig) => summaryExtractorFromHtmlLink(state, jobConfig),
    'SUMMARY-HTML-TO-TEXT-EXTRACTOR': (state: State, jobConfig: JobConfig) => summaryHtmlToTextExtractor(state, jobConfig),
};
