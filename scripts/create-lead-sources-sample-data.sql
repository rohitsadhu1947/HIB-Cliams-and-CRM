-- Create lead_sources table if it doesn't exist
CREATE TABLE IF NOT EXISTS lead_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample lead sources
INSERT INTO lead_sources (name, description, is_active) VALUES
('Website', 'Leads from company website contact forms', true),
('Social Media', 'Leads from social media platforms', true),
('Referral', 'Leads from existing customer referrals', true),
('Cold Calling', 'Leads generated through cold calling campaigns', true),
('Email Marketing', 'Leads from email marketing campaigns', true),
('Trade Shows', 'Leads collected at trade shows and events', true),
('Online Advertising', 'Leads from Google Ads, Facebook Ads, etc.', true),
('Partner Network', 'Leads from business partners and affiliates', true),
('Direct Mail', 'Leads from direct mail campaigns', true),
('Walk-in', 'Customers who walked into the office', true)
ON CONFLICT (name) DO NOTHING;

-- Update timestamps
UPDATE lead_sources SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
