-- Create lead_sources table if it doesn't exist
CREATE TABLE IF NOT EXISTS lead_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample lead sources (only if they don't exist)
INSERT INTO lead_sources (name, description, is_active) 
VALUES 
  ('Website', 'Leads from company website', true),
  ('Social Media', 'Leads from social media platforms', true),
  ('Referral', 'Leads from customer referrals', true),
  ('Cold Calling', 'Leads from cold calling campaigns', true),
  ('Email Marketing', 'Leads from email campaigns', true),
  ('Trade Shows', 'Leads from trade shows and events', true),
  ('Online Ads', 'Leads from online advertising', true),
  ('Walk-in', 'Walk-in customers', true)
ON CONFLICT (name) DO NOTHING;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample users (only if they don't exist)
INSERT INTO users (name, email, role, is_active) 
VALUES 
  ('John Smith', 'john.smith@company.com', 'admin', true),
  ('Sarah Johnson', 'sarah.johnson@company.com', 'manager', true),
  ('Mike Davis', 'mike.davis@company.com', 'agent', true),
  ('Lisa Wilson', 'lisa.wilson@company.com', 'agent', true),
  ('Tom Brown', 'tom.brown@company.com', 'agent', true)
ON CONFLICT (email) DO NOTHING;
