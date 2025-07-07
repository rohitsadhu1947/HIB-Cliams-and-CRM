-- Lead Management Tables
CREATE TABLE lead_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    lead_number VARCHAR(50) UNIQUE NOT NULL,
    source_id INTEGER REFERENCES lead_sources(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company_name VARCHAR(200),
    industry VARCHAR(100),
    lead_value DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'new',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to INTEGER, -- Will reference users table
    assigned_at TIMESTAMP,
    expected_close_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    product_category VARCHAR(50),
    product_subtype VARCHAR(50)
);

CREATE TABLE lead_activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_follow_up_date DATE,
    performed_by INTEGER, -- Will reference users table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lead_status_history (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER, -- Will reference users table
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Renewals Tables
CREATE TABLE renewal_cycles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE policy_renewals (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER, -- Will reference policies table
    renewal_date DATE NOT NULL,
    renewal_cycle_id INTEGER REFERENCES renewal_cycles(id),
    status VARCHAR(50) DEFAULT 'pending',
    renewal_premium DECIMAL(12,2),
    original_premium DECIMAL(12,2),
    assigned_to INTEGER, -- Will reference users table
    assigned_at TIMESTAMP,
    first_contact_date DATE,
    last_contact_date DATE,
    contact_count INTEGER DEFAULT 0,
    renewal_notes TEXT,
    conversion_status VARCHAR(50) DEFAULT 'pending', -- pending, converted, lost, cancelled
    lost_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE renewal_activities (
    id SERIAL PRIMARY KEY,
    renewal_id INTEGER REFERENCES policy_renewals(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    description TEXT,
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_follow_up_date DATE,
    performed_by INTEGER, -- Will reference users table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE renewal_status_history (
    id SERIAL PRIMARY KEY,
    renewal_id INTEGER REFERENCES policy_renewals(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    old_conversion_status VARCHAR(50),
    new_conversion_status VARCHAR(50),
    changed_by INTEGER, -- Will reference users table
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default lead sources
INSERT INTO lead_sources (name, description) VALUES
('Website', 'Leads from company website'),
('Referral', 'Referrals from existing customers'),
('Social Media', 'Leads from social media platforms'),
('Cold Call', 'Cold calling campaigns'),
('Email Campaign', 'Email marketing campaigns'),
('Trade Show', 'Trade show and exhibition leads'),
('Online Advertisement', 'Online advertising campaigns'),
('Partnership', 'Partner referrals'),
('Other', 'Other lead sources');

-- Insert default renewal cycle
INSERT INTO renewal_cycles (name, description, start_date, end_date) VALUES
('Q1 2024', 'First quarter renewal cycle', '2024-01-01', '2024-03-31'),
('Q2 2024', 'Second quarter renewal cycle', '2024-04-01', '2024-06-30'),
('Q3 2024', 'Third quarter renewal cycle', '2024-07-01', '2024-09-30'),
('Q4 2024', 'Fourth quarter renewal cycle', '2024-10-01', '2024-12-31');

-- Create indexes for better performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_expected_close_date ON leads(expected_close_date);
CREATE INDEX idx_policy_renewals_renewal_date ON policy_renewals(renewal_date);
CREATE INDEX idx_policy_renewals_status ON policy_renewals(status);
CREATE INDEX idx_policy_renewals_assigned_to ON policy_renewals(assigned_to); 