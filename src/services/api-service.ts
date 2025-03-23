import axios from 'axios';
import Document from '../models/document';
import ScanConfig from '../models/scan-config';

class ApiService {
    private apiUrl = process.env.API_URL || 'http://localhost:3000/api';

    // Start a scan for a specific agency
    async startScan(scanConfig: ScanConfig): Promise<any> {
        try {
            const payload = { job_id: scanConfig.id, job_name: scanConfig.name, source: scanConfig.defaults.source };
            const response = await axios.post(`${this.apiUrl}/start-scan`, payload);
            return response.data.id;
        } catch (error) {
            console.error(`Error starting scan for agency ${scanConfig}:`, error);
            throw error;
        }
    }

    // success... Complete the scan.
    async completeScan(jobRunId: string, documents: Document[]): Promise<void> {
        try {
            const payload = { id: jobRunId, result_data: documents, status: 'COMPLETED' };
            const response = await axios.put(`${this.apiUrl}/complete-scan`, payload, { headers: { 'Content-Type': 'application/json' } });

            if (response.status !== 200) throw new Error(`API upsert failed with status: ${response.status}`);
        } catch (error) {
            console.error('Error in API - complete-scan. \nError:', error);
            throw error;
        }
    }

    async scanFailed(jobRunId: string): Promise<void> {
        try {
            const payload = { id: jobRunId, status: 'FAILED' };
            const response = await axios.put(`${this.apiUrl}/complete-scan`, payload, { headers: { 'Content-Type': 'application/json' } });

            if (response.status !== 200) throw new Error(`API issue 1 failed with status: ${response.status}`);
        } catch (error) {
            console.error('Error in API -> scan-failed. \nError:', error);
            throw error;
        }
    }

    // // Get scan results for a specific agency
    // async getScanResults(agencyId: number): Promise<Document[]> {
    //     try {
    //         const response = await axios.get(`${this.apiUrl}/results/${agencyId}`);
    //         return response.data as Document[];
    //     } catch (error) {
    //         console.error(`Error getting scan results for agency ${agencyId}:`, error);
    //         throw error;
    //     }
    // }

    // // Get all scan configurations
    // async getScanConfigs(): Promise<ScanConfig[]> {
    //     try {
    //         const response = await axios.get(`${this.apiUrl}/configs`);
    //         return response.data as ScanConfig[];
    //     } catch (error) {
    //         console.error('Error getting scan configurations:', error);
    //         throw error;
    //     }
    // }

    // // Update a scan configuration
    // async updateScanConfig(config: ScanConfig): Promise<ScanConfig> {
    //     try {
    //         const response = await axios.put(`${this.apiUrl}/configs/${config.id}`, config);
    //         return response.data as ScanConfig;
    //     } catch (error) {
    //         console.error(`Error updating scan config ${config.id}:`, error);
    //         throw error;
    //     }
    // }
}

export default ApiService;
