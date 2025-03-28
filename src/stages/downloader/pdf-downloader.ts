import { logger } from '../../common';
import { JobConfig, State } from '../../model';

export const pdfDownloader = (state: State, jobConfig: JobConfig): State => {
    let rawData: string = 'Hello Web Page Downloader';
    logger.info(`Starting web page download for: ${jobConfig.url}`);
    return { ...state, rawData };
};
