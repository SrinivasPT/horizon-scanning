import TurndownService from 'turndown';

/**
 * HtmlToMarkdown utility class for converting HTML content to clean Markdown
 */
export class HtmlToMarkdown {
    private turndownService: TurndownService;

    constructor() {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            emDelimiter: '*',
        });
    }

    /**
     * Converts HTML to clean Markdown with additional post-processing
     * @param html HTML content to convert
     * @returns Cleaned-up Markdown
     */
    public convert(html: string): string {
        // Check if content is actually HTML
        if (!this.looksLikeHtml(html)) {
            return html;
        }

        try {
            // First convert the HTML to markdown using turndown
            let markdown = this.turndownService.turndown(html);

            // Apply various cleanup functions
            markdown = this.removeImageReferences(markdown);
            markdown = this.removeSocialMediaLinks(markdown);
            markdown = this.removeUnsubscribeLinks(markdown);
            markdown = this.removeFooterContent(markdown);
            markdown = this.cleanupExcessWhitespace(markdown);

            return markdown;
        } catch (error) {
            console.error('Error converting HTML to markdown:', error);
            // Fallback: Strip HTML tags if conversion fails
            return this.stripHtmlTags(html);
        }
    }

    /**
     * Helper method to detect if content is HTML
     */
    private looksLikeHtml(text: string): boolean {
        return /<[a-z][\s\S]*>/i.test(text);
    }

    /**
     * Remove image references and markdown image tags
     */
    private removeImageReferences(markdown: string): string {
        // Remove markdown image tags: ![alt text](image_url)
        return markdown.replace(/!\[.*?\]\(.*?\)/g, '');
    }

    /**
     * Remove social media links and references
     */
    private removeSocialMediaLinks(markdown: string): string {
        const socialMediaPatterns = [
            // Social media section headers
            /## STAY CONNECTED.*?(?=##|$)/gs,
            // Links containing social media domains
            /\[.*?\]\(.*?(?:facebook|twitter|x\.com|instagram|linkedin|youtube|flickr).*?\)/g,
            // References to social platforms without links
            /(?:Follow us on|find us on|connect with us).*?(?:Facebook|Twitter|Instagram|LinkedIn|YouTube|Flickr).*?(?=\n|$)/gi,
        ];

        let result = markdown;
        socialMediaPatterns.forEach(pattern => {
            result = result.replace(pattern, '');
        });

        return result;
    }

    /**
     * Remove unsubscribe links and related text
     */
    private removeUnsubscribeLinks(markdown: string): string {
        return (
            markdown
                // Remove unsubscribe links and text around them
                .replace(/.*unsubscribe.*?\]\(.*?\).*?(?=\n|$)/gi, '')
                // Remove text containing "If you no longer wish to receive"
                .replace(/.*(?:if you no longer wish|to unsubscribe|to opt out).*?(?=\n|$)/gi, '')
        );
    }

    /**
     * Remove common footer content
     */
    private removeFooterContent(markdown: string): string {
        const footerPatterns = [
            // Media contact sections
            /(?:##|###)\s*MEDIA CONTACTS:.*?(?=##|###|$)/gs,
            // Footer separator lines
            /\*\s*\*\s*\*\s*/g,
            // Agency footer text often starts with the agency name
            /The (?:FDIC|FDA|EPA|FTC|SEC).*?does not send unsolicited.*?(?=\n|$)/gi,
        ];

        let result = markdown;
        footerPatterns.forEach(pattern => {
            result = result.replace(pattern, '');
        });

        return result;
    }

    /**
     * Clean up excessive whitespace, newlines and markdown artifacts
     */
    private cleanupExcessWhitespace(markdown: string): string {
        return (
            markdown
                // Replace 3+ newlines with 2 newlines
                .replace(/\n{3,}/g, '\n\n')
                // Remove lines that only contain whitespace or special characters
                .replace(/^\s*[-*_\s]+\s*$/gm, '')
                // Trim whitespace from each line
                .split('\n')
                .map(line => line.trim())
                .join('\n')
                // Final trim of the entire string
                .trim()
        );
    }

    /**
     * Fallback method to strip HTML tags if conversion fails
     */
    private stripHtmlTags(html: string): string {
        return html.replace(/<[^>]*>?/gm, '');
    }
}

// Create a singleton instance for easy import
const htmlToMarkdown = new HtmlToMarkdown();
export default htmlToMarkdown;
