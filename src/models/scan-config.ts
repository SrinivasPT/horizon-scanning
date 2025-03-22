export default interface ScanConfig {
    id: number;
    name: string;
    url: string;
    scannerType: string;
    selector?: string; // For HTML & Playwright
    mapper?: string[];
    defaults: { [key: string]: string };
}
