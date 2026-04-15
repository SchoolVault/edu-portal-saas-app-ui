-- Optional OLAP / ETL anchor table on primary DB until a separate warehouse is provisioned
CREATE TABLE IF NOT EXISTS analytics_etl_heartbeat (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ran_at DATETIME(6) NOT NULL,
    job_name VARCHAR(128) NOT NULL,
    note VARCHAR(512) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
