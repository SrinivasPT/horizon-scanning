export interface ExtractionOptions {
    selector: string;
    extractionMode?: 'auto' | 'nextParagraph' | 'betweenSections' | 'withinContainer';
    endSelector?: string;
    containerSelector?: string;
}
