-- Work Order Management System Database Initialization
-- This script sets up the basic database structure

-- Create the main database (will be created by Docker automatically)
-- Database: woms

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create basic tables that TypeORM will manage through migrations
-- Note: Detailed schemas will be managed by TypeORM migrations

-- Basic health check table
CREATE TABLE IF NOT EXISTS health_check (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(20) NOT NULL DEFAULT 'healthy',
    last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial health check record
INSERT INTO health_check (status) VALUES ('healthy') ON CONFLICT DO NOTHING;

-- Log initialization
INSERT INTO health_check (status) VALUES ('initialized') ON CONFLICT DO NOTHING; 