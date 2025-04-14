-- Create the database
CREATE DATABASE IF NOT EXISTS smart_traffic;

-- Use the database
USE smart_traffic;

-- Table 1: Traffic Violations
CREATE TABLE IF NOT EXISTS violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id VARCHAR(10) NOT NULL,
    violation_type VARCHAR(50) NOT NULL,
    signal_id VARCHAR(50) NOT NULL,
    violation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Traffic Predictions Log
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    time_frame VARCHAR(50) NOT NULL,         -- e.g., 'Next 30 mins', 'Next 1 hour'
    prediction TEXT NOT NULL,                -- e.g., 'Heavy Traffic Expected'
    confidence_level DECIMAL(5,2) DEFAULT 0, -- Optional confidence score
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Manual Signal Change Logs
CREATE TABLE IF NOT EXISTS manual_signal_changes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    signal_id VARCHAR(50) NOT NULL,
    changed_to ENUM('green', 'yellow', 'red') NOT NULL,
    changed_by VARCHAR(50) DEFAULT 'admin',  -- could be 'admin' or system id
    change_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
