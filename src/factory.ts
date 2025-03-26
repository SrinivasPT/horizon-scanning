import { JobConfig } from './model/job-config';
import { State } from './model/state';
import { pdfDownloader } from './stages/downloader/pdf-downloader';
import { webPageDownloader } from './stages/downloader/web-page-downloader';
import { fedRegisterParser } from './stages/parser/fed-register-parser';
import { htmlTableParser } from './stages/parser/html-table-parser';
import { rssParser } from './stages/parser/rss-parser';

export const factory = {
    'WEB-PAGE-DOWNLOADER': (state: State, jobConfig: JobConfig) => webPageDownloader(state, jobConfig),
    'PDF-DOWNLOADER': (state: State, jobConfig: JobConfig) => pdfDownloader(state, jobConfig),
    'HTML-TABLE-PARSER': (state: State, jobConfig: JobConfig) => htmlTableParser(state, jobConfig),
    'RSS-PARSER': (state: State, jobConfig: JobConfig) => rssParser(state, jobConfig),
    'FED-REGISTER-PARSER': (state: State, jobConfig: JobConfig) => fedRegisterParser(state, jobConfig),
};
