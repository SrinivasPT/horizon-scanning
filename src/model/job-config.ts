import * as fs from 'fs';
import * as path from 'path';
import { RssParseConfig } from './rss-parse';
import { HtmlTableParseConfig } from './html-table-parse';

export interface JobDefaults {
    source: string;
    issuingAuthority: string;
    eventType: string;
    topic: string;
}

export interface PipelineStageParams {
    [key: string]: any;
}

export interface PipelineStage {
    stage: string;
    params?: PipelineStageParams;
    config?: HtmlTableParseConfig | RssParseConfig | any;
}

export class JobConfig {
    id: string;
    name: string;
    description: string;
    url: string;
    pipeline: PipelineStage[];
    defaults: JobDefaults;

    constructor(config: Partial<JobConfig>) {
        this.id = config.id || '';
        this.name = config.name || '';
        this.description = config.description || '';
        this.url = config.url || '';
        this.pipeline = config.pipeline || [];
        this.defaults = config.defaults || {
            source: '',
            issuingAuthority: '',
            eventType: '',
            topic: '',
        };
    }

    static fromJson(json: any): JobConfig {
        return new JobConfig(json);
    }

    static fromJsonArray(jsonArray: any[]): JobConfig[] {
        return jsonArray.map(json => JobConfig.fromJson(json));
    }

    static loadFromDefaultConfig(): JobConfig[] {
        const configPath = path.resolve(__dirname, '..', 'config.json');
        return JobConfig.loadFromFile(configPath);
    }

    static loadFromFile(filePath: string): JobConfig[] {
        try {
            const configData = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(configData);

            if (!Array.isArray(jsonData)) {
                throw new Error('Config file does not contain a valid array of job configurations');
            }

            return JobConfig.fromJsonArray(jsonData);
        } catch (error) {
            console.error(`Error loading job configurations: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }

    /**
     * Loads a specific job configuration by ID
     * @param jobId The ID of the job to load
     * @returns The JobConfig with the specified ID or undefined if not found
     */
    static loadJobById(jobId: string): JobConfig | undefined {
        const configs = JobConfig.loadFromDefaultConfig();
        return configs.find(config => config.id === jobId);
    }
}

export enum StageType {
    'HTML-TABLE-PARSER' = 'HTML-TABLE-PARSER',
    'RSS-PARSER' = 'RSS-PARSER',
}
