import axios from 'axios';

/**
 * Downloads content from a specified URL
 * @param url The URL to download content from
 * @returns Object containing the download results
 */
export async function downloadUrlContent(url: string = 'https://example.com') {
    try {
        console.log(`Downloading content from: ${url}`);
        const response = await axios.get(url);
        console.log(`Status code: ${response.status}`);
        console.log(`Content length: ${response.data.length} bytes`);
        console.log(`First 200 characters of content:\n${response.data.substring(0, 200)}...`);
        return {
            url,
            statusCode: response.status,
            contentLength: response.data.length,
            content: response.data,
        };
    } catch (error: any) {
        console.error(`Error downloading from ${url}:`, error.message);
        throw error;
    }
}
