-- Create lead_sources table if it doesn't exist
CREATE TABLE IF NOT EXISTS lead_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample lead sources
INSERT INTO lead_sources (name, description, is_active) VALUES
    ('Website', 'Leads from company website contact forms', true),
    ('Social Media', 'Leads from Facebook, LinkedIn, Twitter campaigns', true),
    ('Referral', 'Customer referrals and word-of-mouth', true),
    ('Cold Calling', 'Outbound cold calling campaigns', true),
    ('Email Marketing', 'Email campaign responses', true),
    ('Trade Shows', 'Leads from industry trade shows and events', true),
    ('Google Ads', 'Pay-per-click advertising campaigns', true),
    ('Direct Mail', 'Traditional direct mail campaigns', true),
    ('Partner Network', 'Leads from business partners', true),
    ('Walk-in', 'Walk-in customers at physical locations', true)
ON CONFLICT (name) DO NOTHING;

-- Ensure users table exists with sample data
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'user',
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample users
INSERT INTO users (name, email, role, password_hash, is_active) VALUES
    ('John Smith', 'john.smith@company.com', 'admin', 'temp_password', true),
    ('Sarah Johnson', 'sarah.johnson@company.com', 'manager', 'temp_password', true),
    ('Mike Davis', 'mike.davis@company.com', 'agent', 'temp_password', true),
    ('Lisa Wilson', 'lisa.wilson@company.com', 'agent', 'temp_password', true),
    ('David Brown', 'david.brown@company.com', 'agent', 'temp_password', true)
ON CONFLICT (email) DO NOTHING;

-- Verify the data was inserted
SELECT 'Lead Sources:' as table_name, COUNT(*) as count FROM lead_sources WHERE is_active = true
UNION ALL
SELECT 'Users:' as table_name, COUNT(*) as count FROM users WHERE is_active = true;
