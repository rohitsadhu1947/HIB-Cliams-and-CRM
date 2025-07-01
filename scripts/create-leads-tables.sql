-- Create lead_sources table
CREATE TABLE IF NOT EXISTS lead_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    lead_number VARCHAR(50) UNIQUE NOT NULL,
    source_id INTEGER REFERENCES lead_sources(id),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company_name VARCHAR(255),
    industry VARCHAR(255),
    lead_value DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP,
    expected_close_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample lead sources
INSERT INTO lead_sources (name, description) VALUES
('Website', 'Leads from company website'),
('Social Media', 'Leads from social media platforms'),
('Referral', 'Leads from customer referrals'),
('Cold Call', 'Leads from cold calling'),
('Email Campaign', 'Leads from email marketing'),
('Trade Show', 'Leads from trade shows and events')
ON CONFLICT (name) DO NOTHING;

-- Insert sample leads
INSERT INTO leads (lead_number, source_id, first_name, last_name, email, phone, company_name, industry, lead_value, status, priority, expected_close_date, notes) VALUES
('LEAD-000001', 1, 'John', 'Doe', 'john.doe@example.com', '+91-9876543210', 'ABC Corp', 'Technology', 50000.00, 'new', 'high', '2024-02-15', 'Interested in comprehensive insurance package'),
('LEAD-000002', 2, 'Jane', 'Smith', 'jane.smith@example.com', '+91-9876543211', 'XYZ Ltd', 'Manufacturing', 75000.00, 'contacted', 'medium', '2024-02-20', 'Follow up scheduled for next week'),
('LEAD-000003', 3, 'Mike', 'Johnson', 'mike.johnson@example.com', '+91-9876543212', 'Tech Solutions', 'IT Services', 30000.00, 'qualified', 'urgent', '2024-02-10', 'Ready to proceed with proposal')
ON CONFLICT (lead_number) DO NOTHING;
