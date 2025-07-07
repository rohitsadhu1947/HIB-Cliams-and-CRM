-- Add product columns to leads table if they don't exist
DO $$ 
BEGIN
    -- Add product_category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'product_category') THEN
        ALTER TABLE leads ADD COLUMN product_category VARCHAR(50);
    END IF;
    
    -- Add product_subtype column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'product_subtype') THEN
        ALTER TABLE leads ADD COLUMN product_subtype VARCHAR(50);
    END IF;
END $$;

-- Add constraints for valid product categories and subtypes
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leads_product_category_check') THEN
        ALTER TABLE leads DROP CONSTRAINT leads_product_category_check;
    END IF;
    
    -- Add product category constraint
    ALTER TABLE leads ADD CONSTRAINT leads_product_category_check 
    CHECK (product_category IS NULL OR product_category IN (
        'Motor', 'Health', 'Life', 'Travel', 'Pet', 'Cyber', 'Corporate', 'Marine'
    ));
    
    -- Drop existing subtype constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leads_product_subtype_check') THEN
        ALTER TABLE leads DROP CONSTRAINT leads_product_subtype_check;
    END IF;
    
    -- Add product subtype constraint
    ALTER TABLE leads ADD CONSTRAINT leads_product_subtype_check 
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
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_product_category ON leads(product_category);
CREATE INDEX IF NOT EXISTS idx_leads_product_subtype ON leads(product_subtype);

-- Add comments to columns
COMMENT ON COLUMN leads.product_category IS 'Insurance product category (Motor, Health, Life, Travel, Pet, Cyber, Corporate, Marine)';
COMMENT ON COLUMN leads.product_subtype IS 'Insurance product subtype based on category';

-- Update existing leads with sample product data (optional)
UPDATE leads SET 
    product_category = CASE 
        WHEN id % 8 = 0 THEN 'Motor'
        WHEN id % 8 = 1 THEN 'Health'
        WHEN id % 8 = 2 THEN 'Life'
        WHEN id % 8 = 3 THEN 'Travel'
        WHEN id % 8 = 4 THEN 'Pet'
        WHEN id % 8 = 5 THEN 'Cyber'
        WHEN id % 8 = 6 THEN 'Corporate'
        WHEN id % 8 = 7 THEN 'Marine'
        ELSE 'Motor'
    END,
    product_subtype = CASE 
        WHEN id % 8 = 0 THEN '4w'
        WHEN id % 8 = 1 THEN 'Individual'
        WHEN id % 8 = 2 THEN 'Term'
        WHEN id % 8 = 3 THEN 'International'
        WHEN id % 8 = 4 THEN 'Dog'
        WHEN id % 8 = 5 THEN 'Corporate'
        WHEN id % 8 = 6 THEN 'Property'
        WHEN id % 8 = 7 THEN 'Cargo'
        ELSE '4w'
    END
WHERE product_category IS NULL AND product_subtype IS NULL;
