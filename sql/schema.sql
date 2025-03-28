DROP TABLE jobRun;
DROP TABLE documentStaging;
DROP TABLE documents;

CREATE TABLE jobRun (
    id BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    correlationId VARCHAR(50) NOT NULL,
    jobId VARCHAR(100) NOT NULL,
    resultData JSON,
    jobStatus ENUM('RUNNING', 'COMPLETED', 'FAILED') NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME,
    errorMessage TEXT,
    processed BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE documentStaging (
    id SERIAL PRIMARY KEY,
    jobRunId BIGINT NOT NULL REFERENCES jobRun(id),
    `source` VARCHAR(255),
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
     `year` CHAR(4),
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
    jobRunId INT NOT NULL,
    `source` VARCHAR(255),
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
    `year` CHAR(4),
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
CREATE TRIGGER before_insert_jobRun
BEFORE INSERT ON jobRun
FOR EACH ROW
BEGIN
    IF NEW.jobStatus = 'RUNNING' THEN
        IF EXISTS (SELECT 1 FROM jobRun WHERE jobId = NEW.jobId AND jobStatus = 'RUNNING') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one running job per jobId is allowed';
        END IF;
    END IF;
END;//

DELIMITER ;
