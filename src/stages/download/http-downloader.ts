// src/stages/download/http-downloader.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { IPipelineStage } from '@/core/pipeline/interfaces';
import { URL } from 'url';
import { Logger } from '@/common/logger.service';
import { PipelineData } from '@/models';

export class HttpDownloader implements IPipelineStage<string, PipelineData> {
    private readonly logger = new Logger(HttpDownloader.name);
    // private config: HttpDownloaderConfig = {
    //     timeout: 30000,
    //     retries: 3,
    //     retryDelay: 1000,
    //     maxRedirects: 5,
    //     validateStatus: status => status >= 200 && status < 400,
    // };

    // setConfig(config: Partial<HttpDownloaderConfig>) {
    //     this.config = { ...this.config, ...config };
    // }

    async process(url: string): Promise<PipelineData> {
        this.validateUrl(url);
        // const axiosConfig = this.createAxiosConfig();

        try {
            this.logger.debug(`Downloading ${url}`);
            const response = await this.downloadWithRetry(url);
            return this.createPipelineData(url, response);
        } catch (error: any) {
            this.logger.error(`Failed to download ${url}`, error);
            throw new DownloadError(url, error);
        }
    }

    private async downloadWithRetry(url: string): Promise<AxiosResponse> {
        let lastError: Error | null = null;
        const retries = 2;
        const retryDelay = 1000;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await axios.get(url);
                return response;
            } catch (error: any) {
                lastError = error;
                if (attempt < retries) {
                    const delay = retryDelay * attempt;
                    this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new Error('Download failed');
    }

    // private createAxiosConfig(): AxiosRequestConfig {
    //     return {
    //         timeout: this.config.timeout,
    //         maxRedirects: this.config.maxRedirects,
    //         headers: {
    //             // 'User-Agent': this.config.userAgent,
    //             Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    //             'Accept-Language': 'en-US,en;q=0.5',
    //         },
    //         validateStatus: this.config.validateStatus,
    //         responseType: 'text',
    //         transitional: {
    //             clarifyTimeoutError: true,
    //         },
    //     };
    // }

    private createPipelineData(url: string, response: AxiosResponse): PipelineData {
        return {
            rawContent: response.data,
            metadata: {
                url,
                statusCode: response.status,
                contentLength: parseInt(response.headers['content-length'] || '0'),
                responseHeaders: response.headers,
                downloadTime: new Date(),
            },
            errors: [],
        };
    }

    private validateUrl(url: string): void {
        try {
            new URL(url);
        } catch (error) {
            throw new Error(`Invalid URL: ${url}`);
        }

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            throw new Error(`Unsupported protocol: ${url}`);
        }
    }
}

// Configuration interface
export interface HttpDownloaderConfig {
    timeout: number;
    retries: number;
    retryDelay: number;
    maxRedirects: number;
    // userAgent: string;
    validateStatus: (status: number) => boolean;
    headers?: Record<string, string>;
}

// Custom error class
export class DownloadError extends Error {
    constructor(public readonly url: string, public readonly originalError: Error) {
        super(`Failed to download ${url}: ${originalError.message}`);
        this.name = 'DownloadError';
    }
}
