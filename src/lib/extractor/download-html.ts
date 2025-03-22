import axios from 'axios';

export default async function downloadHtml(url: string) {
    try {
        const response = await axios.get(url);
        const htmlContent = response.data;
        return htmlContent;
    } catch (error: any) {
        console.error(`Error downloading URL: ${url}. Error:`, error.message);
        throw error;
    }
}
