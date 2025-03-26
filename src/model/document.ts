export interface Document {
    source?: string;
    typeOfChange?: string;
    eventType?: string;
    issuingAuthority?: string;
    identifier?: string;
    title?: string;
    summary?: string;
    linkToRegChangeText?: string;
    publishedOn?: string;
    htmlContent?: string;
    pdfContent?: string;
    // Other
    introducedOn?: string;
    citationId?: string;
    billType?: string;
    regType?: string;
    year?: string;
    regulationStatus?: string;
    billStatus?: string;
    firstEffectiveDate?: string;
    comments?: string;
    enactedDate?: string;
    topic?: string;
}
