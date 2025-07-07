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
END $$;

-- Add constraints for product categories and subtypes
DO $$
BEGIN
    -- Add check constraint for product_category
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'leads' AND constraint_name = 'leads_product_category_check') THEN
        ALTER TABLE leads ADD CONSTRAINT leads_product_category_check 
        CHECK (product_category IN ('Motor', 'Health', 'Life', 'Travel', 'Pet', 'Cyber', 'Corporate', 'Marine'));
    END IF;
    
    -- Add check constraint for product_subtype based on category
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'leads' AND constraint_name = 'leads_product_subtype_check') THEN
        ALTER TABLE leads ADD CONSTRAINT leads_product_subtype_check 
        CHECK (
            (product_category = 'Motor' AND product_subtype IN ('2w', '4w', 'CV')) OR
            (product_category = 'Health' AND product_subtype IN ('Individual', 'Family', 'Group', 'Critical Illness')) OR
            (product_category = 'Life' AND product_subtype IN ('Term', 'ULIP', 'Endowment', 'Others')) OR
            (product_category = 'Travel' AND product_subtype IN ('Domestic', 'International', 'Student', 'Business')) OR
            (product_category = 'Pet' AND product_subtype IN ('Dog', 'Cat', 'Exotic')) OR
            (product_category = 'Cyber' AND product_subtype IN ('Individual', 'SME', 'Corporate')) OR
            (product_category = 'Corporate' AND product_subtype IN ('Property', 'Liability', 'Marine', 'Engineering')) OR
            (product_category = 'Marine' AND product_subtype IN ('Cargo', 'Hull', 'Liability')) OR
            (product_category IS NULL AND product_subtype IS NULL)
        );
    END IF;
END $$;

-- Update existing leads with sample product data
UPDATE leads SET 
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
        WHEN id % 8 = 3 THEN 'Domestic'
        WHEN id % 8 = 4 THEN 'Dog'
        WHEN id % 8 = 5 THEN 'Individual'
        WHEN id % 8 = 6 THEN 'Property'
        ELSE 'Cargo'
    END
WHERE product_category IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_product_category ON leads(product_category);
CREATE INDEX IF NOT EXISTS idx_leads_source_id ON leads(source_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Verify the updates
SELECT 
    'Total leads' as description, 
    COUNT(*) as count 
FROM leads
UNION ALL
SELECT 
    'Leads with product category' as description, 
    COUNT(*) as count 
FROM leads 
WHERE product_category IS NOT NULL
UNION ALL
SELECT 
    'Leads with product subtype' as description, 
    COUNT(*) as count 
FROM leads 
WHERE product_subtype IS NOT NULL;
