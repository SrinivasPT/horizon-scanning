CREATE TABLE IF NOT EXISTS scanner (
    id BINARY(16) NOT NULL PRIMARY KEY,
    job_id INT NOT NULL,
    job_name VARCHAR(100) NOT NULL,
    SOURCE VARCHAR(100) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    STATUS ENUM('RUNNING', 'COMPLETED', 'FAILED') NOT NULL,
    error_message TEXT,
    parameters JSON,
    result_data JSON,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DELIMITER //

CREATE TRIGGER before_insert_scanner
BEFORE INSERT ON scanner
FOR EACH ROW
BEGIN
    IF NEW.status = 'running' THEN
        IF EXISTS (SELECT 1 FROM scanner WHERE job_name = NEW.job_name AND STATUS = 'running') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one running job per job_name is allowed';
        END IF;
    END IF;
END;//

DELIMITER ;