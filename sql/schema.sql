DROP TABLE scanner;

CREATE TABLE scanner (
    id BIGINT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    job_id INT NOT NULL,
    job_name VARCHAR(100) NOT NULL,
    SOURCE VARCHAR(100) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    STATUS ENUM('RUNNING', 'COMPLETED', 'FAILED') NOT NULL,
    error_message TEXT,
    result_data JSON,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DELIMITER //
-- DROP TRIGGER before_insert_scanner;
CREATE TRIGGER before_insert_scanner
BEFORE INSERT ON scanner
FOR EACH ROW
BEGIN
    IF NEW.status = 'RUNNING' THEN
        IF EXISTS (SELECT 1 FROM scanner WHERE job_name = NEW.job_name AND STATUS = 'RUNNING') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one running job per job_name is allowed';
        END IF;
    END IF;
END;//

DELIMITER ;