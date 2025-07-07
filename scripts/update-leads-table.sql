-- Create leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  lead_number VARCHAR(50) UNIQUE NOT NULL,
  source_id INTEGER REFERENCES lead_sources(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  company_name VARCHAR(255),
  industry VARCHAR(100),
  lead_value DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP,
  expected_close_date DATE,
  notes TEXT,
  product_category VARCHAR(50),
  product_subtype VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add product columns to leads table if they don't exist
DO $$ 
BEGIN
    -- Add product_category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'product_category') THEN
        ALTER TABLE leads ADD COLUMN product_category VARCHAR(50);
    END IF;
    
    -- Add product_subtype column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'product_subtype') THEN
        ALTER TABLE leads ADD COLUMN product_subtype VARCHAR(50);
    END IF;
    
    -- Add check constraint for product_category
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'leads_product_category_check') THEN
        ALTER TABLE leads ADD CONSTRAINT leads_product_category_check 
        CHECK (product_category IN ('Motor', 'Health', 'Life', 'Travel', 'Pet', 'Cyber', 'Corporate', 'Marine'));
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_source_id ON leads(source_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_product_category ON leads(product_category);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Update existing leads with sample product data (only if they don't have product info)
UPDATE leads 
SET 
    product_category = 'Health',
    product_subtype = 'Individual'
WHERE product_category IS NULL AND id % 3 = 0;

UPDATE leads 
SET 
    product_category = 'Motor',
    product_subtype = '4w'
WHERE product_category IS NULL AND id % 3 = 1;

UPDATE leads 
SET 
    product_category = 'Life',
    product_subtype = 'Term'
WHERE product_category IS NULL AND id % 3 = 2;
