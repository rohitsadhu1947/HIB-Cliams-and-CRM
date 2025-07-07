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
INSERT INTO lead_sources (name, description) VALUES
  ('Website', 'Leads from company website'),
  ('Social Media', 'Leads from social media platforms'),
  ('Referral', 'Leads from customer referrals'),
  ('Cold Calling', 'Leads from cold calling campaigns'),
  ('Email Marketing', 'Leads from email campaigns'),
  ('Trade Shows', 'Leads from trade shows and events'),
  ('Online Ads', 'Leads from online advertising'),
  ('Partner', 'Leads from business partners')
ON CONFLICT (name) DO NOTHING;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample users
INSERT INTO users (name, email, role) VALUES
  ('John Smith', 'john.smith@company.com', 'admin'),
  ('Sarah Johnson', 'sarah.johnson@company.com', 'manager'),
  ('Mike Davis', 'mike.davis@company.com', 'agent'),
  ('Lisa Wilson', 'lisa.wilson@company.com', 'agent'),
  ('Tom Brown', 'tom.brown@company.com', 'agent')
ON CONFLICT (email) DO NOTHING;
