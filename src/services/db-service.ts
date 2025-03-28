import axios from 'axios';
import { JobConfig } from '../model/job-config';

const apiUrl = process.env.API_URL || 'http://localhost:3000/api';

// Start a scan for a specific agency
export const startScan = async (jobConfig: JobConfig, correlationId: string): Promise<any> => {
    try {
        const payload = {
            jobId: jobConfig.id,
            correlationId: correlationId,
        };
        const response = await axios.post(`${apiUrl}/start-scan`, payload);
        return response.data.id;
    } catch (error) {
        console.error(`Error starting scan for job ${jobConfig}:`, error);
        throw error;
    }
};

export const completeScan = async (jobRunId: number, documents: Document[]): Promise<void> => {
    try {
        const payload = { jobRunId, resultData: documents, jobStatus: 'COMPLETED' };
        const response = await axios.put(`${apiUrl}/complete-scan`, payload, { headers: { 'Content-Type': 'application/json' } });
        if (response.status !== 200) throw new Error(`API upsert failed with status: ${response.status}`);
    } catch (error) {
        console.error('Error in API - complete-scan. \nError:', error);
        throw error;
    }
};

export const scanFailed = async (jobRunId: string): Promise<void> => {
    try {
        const payload = { id: jobRunId, jobStatus: 'FAILED' };
        const response = await axios.put(`${apiUrl}/complete-scan`, payload, { headers: { 'Content-Type': 'application/json' } });

        if (response.status !== 200) throw new Error(`API issue 1 failed with status: ${response.status}`);
    } catch (error) {
        console.error('Error in API -> scan-failed. \nError:', error);
        throw error;
    }
};
