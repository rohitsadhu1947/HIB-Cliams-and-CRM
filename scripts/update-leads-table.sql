-- Add product_category and product_subtype columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS product_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS product_subtype VARCHAR(50);

-- Add check constraints for valid product categories and subtypes
ALTER TABLE leads 
ADD CONSTRAINT IF NOT EXISTS check_product_category 
CHECK (product_category IS NULL OR product_category IN (
  'Motor', 'Health', 'Life', 'Travel', 'Pet', 'Cyber', 'Corporate', 'Marine'
));

-- Add check constraint for valid product subtypes based on category
ALTER TABLE leads 
ADD CONSTRAINT IF NOT EXISTS check_product_subtype 
CHECK (
  product_subtype IS NULL OR
  (product_category = 'Motor' AND product_subtype IN ('2w', '4w', 'CV')) OR
  (product_category = 'Health' AND product_subtype IN ('Individual', 'Family', 'Group', 'Critical Illness')) OR
  (product_category = 'Life' AND product_subtype IN ('Term', 'ULIP', 'Endowment', 'Others')) OR
  (product_category = 'Travel' AND product_subtype IN ('Domestic', 'International', 'Student', 'Business')) OR
  (product_category = 'Pet' AND product_subtype IN ('Dog', 'Cat', 'Exotic')) OR
  (product_category = 'Cyber' AND product_subtype IN ('Individual', 'SME', 'Corporate')) OR
  (product_category = 'Corporate' AND product_subtype IN ('Property', 'Liability', 'Marine', 'Engineering')) OR
  (product_category = 'Marine' AND product_subtype IN ('Cargo', 'Hull', 'Liability'))
);

-- Add comments to the new columns
COMMENT ON COLUMN leads.product_category IS 'Insurance product category (Motor, Health, Life, etc.)';
COMMENT ON COLUMN leads.product_subtype IS 'Insurance product subtype based on category';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_product_category ON leads(product_category);
CREATE INDEX IF NOT EXISTS idx_leads_product_subtype ON leads(product_subtype);

-- Insert some sample lead sources if they don't exist
INSERT INTO lead_sources (name, description, is_active, created_at, updated_at)
SELECT * FROM (VALUES 
  ('Website', 'Leads from company website', true, NOW(), NOW()),
  ('Social Media', 'Leads from social media platforms', true, NOW(), NOW()),
  ('Referral', 'Leads from customer referrals', true, NOW(), NOW()),
  ('Cold Call', 'Leads from cold calling campaigns', true, NOW(), NOW()),
  ('Email Campaign', 'Leads from email marketing', true, NOW(), NOW()),
  ('Trade Show', 'Leads from trade shows and events', true, NOW(), NOW()),
  ('Partner', 'Leads from business partners', true, NOW(), NOW()),
  ('Advertisement', 'Leads from paid advertisements', true, NOW(), NOW())
) AS v(name, description, is_active, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM lead_sources WHERE lead_sources.name = v.name);

-- Update existing leads with sample product information
UPDATE leads 
SET 
  product_category = CASE 
    WHEN id % 8 = 0 THEN 'Motor'
    WHEN id % 8 = 1 THEN 'Health'
    WHEN id % 8 = 2 THEN 'Life'
    WHEN id % 8 = 3 THEN 'Travel'
    WHEN id % 8 = 4 THEN 'Pet'
    WHEN id % 8 = 5 THEN 'Cyber'
    WHEN id % 8 = 6 THEN 'Corporate'
    ELSE 'Marine'
  END,
  product_subtype = CASE 
    WHEN id % 8 = 0 THEN '4w'
    WHEN id % 8 = 1 THEN 'Individual'
    WHEN id % 8 = 2 THEN 'Term'
    WHEN id % 8 = 3 THEN 'International'
    WHEN id % 8 = 4 THEN 'Dog'
    WHEN id % 8 = 5 THEN 'Individual'
    WHEN id % 8 = 6 THEN 'Property'
    ELSE 'Cargo'
  END
WHERE product_category IS NULL;
