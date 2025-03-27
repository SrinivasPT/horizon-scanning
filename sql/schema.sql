DROP TABLE scanner;
DROP TABLE documentsStaging;
DROP TABLE documents;

CREATE TABLE scanner (
    id BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    correlationId VARCHAR(50) NOT NULL,
    jobId INT NOT NULL,
    jobName VARCHAR(100) NOT NULL,
    SOURCE VARCHAR(100) NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME,
    STATUS ENUM('RUNNING', 'COMPLETED', 'FAILED') NOT NULL,
    errorMessage TEXT,
    resultData JSON,
    processed BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE documentsStaging (
    id SERIAL PRIMARY KEY,
    correlationId VARCHAR(50) NOT NULL,
    jobRunId INT NOT NULL,
    SOURCE VARCHAR(255),
    typeOfChange VARCHAR(100),
    eventType VARCHAR(100),
    issuingAuthority VARCHAR(255),
    identifier VARCHAR(100),
    title TEXT,
    summary TEXT,
    linkToRegChangeText TEXT,
    publishedOn TIMESTAMP,
    htmlContent TEXT,
    pdfContent TEXT,
    introducedOn TIMESTAMP,
    citationId VARCHAR(100),
    billType VARCHAR(50),
    regType VARCHAR(50),
    YEAR CHAR(4),
    regulationStatus VARCHAR(100),
    billStatus VARCHAR(100),
    firstEffectiveDate TIMESTAMP,
    enactedDate TIMESTAMP,
    topic VARCHAR(255),
    comments TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    correlationId VARCHAR(50) NOT NULL,
    jobRunId INT NOT NULL,
    SOURCE VARCHAR(255),
    typeOfChange VARCHAR(100),
    eventType VARCHAR(100),
    issuingAuthority VARCHAR(255),
    identifier VARCHAR(100),
    title TEXT,
    summary TEXT,
    linkToRegChangeText TEXT,
    publishedOn TIMESTAMP,
    htmlContent TEXT,
    pdfContent TEXT,
    introducedOn TIMESTAMP,
    citationId VARCHAR(100),
    billType VARCHAR(50),
    regType VARCHAR(50),
    YEAR CHAR(4),
    regulationStatus VARCHAR(100),
    billStatus VARCHAR(100),
    firstEffectiveDate TIMESTAMP,
    enactedDate TIMESTAMP,
    topic VARCHAR(255),
    comments TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


DELIMITER //
-- DROP TRIGGER before_insert_scanner;
CREATE TRIGGER before_insert_scanner
BEFORE INSERT ON scanner
FOR EACH ROW
BEGIN
    IF NEW.status = 'RUNNING' THEN
        IF EXISTS (SELECT 1 FROM scanner WHERE jobName = NEW.jobName AND STATUS = 'RUNNING') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one running job per jobName is allowed';
        END IF;
    END IF;
END;//

DELIMITER ;
