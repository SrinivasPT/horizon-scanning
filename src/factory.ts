import { JobConfig } from './model/job-config';
import { State } from './model/state';
import { pdfDownloader } from './stages/downloader/pdf-downloader';
import { webPageDownloader } from './stages/downloader/web-page-downloader';
import { htmlTableParser } from './stages/parser/html-table-parser';

export const factory = {
    'WEB-PAGE-DOWNLOADER': (state: State, jobConfig: JobConfig) => webPageDownloader(state, jobConfig),
    'PDF-DOWNLOADER': (state: State, jobConfig: JobConfig) => pdfDownloader(state, jobConfig),
    'HTML-TABLE-PARSER': (state: State, jobConfig: JobConfig) => htmlTableParser(state, jobConfig),
};
