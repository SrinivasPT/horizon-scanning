import { logger } from '../../common';
import { JobConfig } from 'src/model/job-config';
import { State } from 'src/model/state';

export const pdfDownloader = (state: State, jobConfig: JobConfig): State => {
    let rawData: string = 'Hello Web Page Downloader';
    logger.info(`Starting web page download for: ${jobConfig.url}`);
    return { ...state, rawData };
};
