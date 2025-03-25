import axios from 'axios';
import { logger } from '../../common';
import { JobConfig } from 'src/model/job-config';
import { State } from 'src/model/state';

export const webPageDownloader = async (state: State, jobConfig: JobConfig): Promise<State> => {
    logger.info(`Starting web page download for: ${jobConfig.url}`);
    try {
        const response = await axios.get(jobConfig.url);
        const rawData = response.data;
        logger.info(`Successfully downloaded content from ${jobConfig.url}`);
        return { ...state, rawData };
    } catch (error) {
        logger.error(`Failed to download from ${jobConfig.url}: ${error}`);
        throw error;
    }
};
