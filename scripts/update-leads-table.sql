-- Add product_category and product_subtype columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS product_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS product_subtype VARCHAR(50);

-- Add check constraints for valid product categories
ALTER TABLE leads 
ADD CONSTRAINT check_product_category 
CHECK (product_category IS NULL OR product_category IN (
  'Motor', 'Health', 'Life', 'Travel', 'Pet', 'Cyber', 'Corporate', 'Marine'
));

-- Add check constraints for valid product subtypes based on category
ALTER TABLE leads 
ADD CONSTRAINT check_product_subtype_motor 
CHECK (
  product_category != 'Motor' OR 
  product_subtype IS NULL OR 
  product_subtype IN ('2w', '4w', 'CV')
);

ALTER TABLE leads 
ADD CONSTRAINT check_product_subtype_health 
CHECK (
  product_category != 'Health' OR 
  product_subtype IS NULL OR 
  product_subtype IN ('Individual', 'Family', 'Group', 'Critical Illness')
);

ALTER TABLE leads 
ADD CONSTRAINT check_product_subtype_life 
CHECK (
  product_category != 'Life' OR 
  product_subtype IS NULL OR 
  product_subtype IN ('Term', 'ULIP', 'Endowment', 'Others')
);

ALTER TABLE leads 
ADD CONSTRAINT check_product_subtype_travel 
CHECK (
  product_category != 'Travel' OR 
  product_subtype IS NULL OR 
  product_subtype IN ('Domestic', 'International', 'Student', 'Business')
);

ALTER TABLE leads 
ADD CONSTRAINT check_product_subtype_pet 
CHECK (
  product_category != 'Pet' OR 
  product_subtype IS NULL OR 
  product_subtype IN ('Dog', 'Cat', 'Exotic')
);

ALTER TABLE leads 
ADD CONSTRAINT check_product_subtype_cyber 
CHECK (
  product_category != 'Cyber' OR 
  product_subtype IS NULL OR 
  product_subtype IN ('Individual', 'SME', 'Corporate')
);

ALTER TABLE leads 
ADD CONSTRAINT check_product_subtype_corporate 
CHECK (
  product_category != 'Corporate' OR 
  product_subtype IS NULL OR 
  product_subtype IN ('Property', 'Liability', 'Marine', 'Engineering')
);

ALTER TABLE leads 
ADD CONSTRAINT check_product_subtype_marine 
CHECK (
  product_category != 'Marine' OR 
  product_subtype IS NULL OR 
  product_subtype IN ('Cargo', 'Hull', 'Liability')
);

-- Update some existing leads with sample product data
UPDATE leads 
SET product_category = 'Motor', product_subtype = '4w' 
WHERE id % 4 = 1 AND product_category IS NULL;

UPDATE leads 
SET product_category = 'Health', product_subtype = 'Individual' 
WHERE id % 4 = 2 AND product_category IS NULL;

UPDATE leads 
SET product_category = 'Life', product_subtype = 'Term' 
WHERE id % 4 = 3 AND product_category IS NULL;

UPDATE leads 
SET product_category = 'Travel', product_subtype = 'International' 
WHERE id % 4 = 0 AND product_category IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_product_category ON leads(product_category);
CREATE INDEX IF NOT EXISTS idx_leads_product_subtype ON leads(product_subtype);
CREATE INDEX IF NOT EXISTS idx_leads_product_combo ON leads(product_category, product_subtype);

-- Add comments for documentation
COMMENT ON COLUMN leads.product_category IS 'Insurance product category (Motor, Health, Life, Travel, Pet, Cyber, Corporate, Marine)';
COMMENT ON COLUMN leads.product_subtype IS 'Insurance product subtype based on the selected category';
