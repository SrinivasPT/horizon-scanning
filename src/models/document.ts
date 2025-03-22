interface Document {
    source: string;
    issuingAuthority: string;
    typeOfChange: string;
    eventType: string;
    citationId: string;
    billType: string;
    regType: string;
    identifier: string;
    year: string;
    regulationStatus: string;
    billStatus: string;
    title: string;
    summary: string;
    linkToRegChangeText: string;
    introducedOn: string;
    publishedOn: string;
    firstEffectiveDate: string;
    comments: string;
    enactedDate: string;
    topic: string;
}

export default Document;
