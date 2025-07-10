-- Final corrected SQL script to seed sample renewal data in Neon DB
-- This script works with existing data and table structure

-- Step 1: Check and create tables if needed
-- Create renewal_cycles table if it doesn't exist
CREATE TABLE IF NOT EXISTS renewal_cycles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create policy_renewals table if it doesn't exist
CREATE TABLE IF NOT EXISTS policy_renewals (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER,
    renewal_date DATE NOT NULL,
    renewal_cycle_id INTEGER REFERENCES renewal_cycles(id),
    status VARCHAR(50) DEFAULT 'pending',
    renewal_premium DECIMAL(12,2),
    original_premium DECIMAL(12,2),
    assigned_to INTEGER,
    assigned_at TIMESTAMP,
    first_contact_date DATE,
    last_contact_date DATE,
    contact_count INTEGER DEFAULT 0,
    renewal_notes TEXT,
    conversion_status VARCHAR(50) DEFAULT 'pending',
    lost_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert default renewal cycles
INSERT INTO renewal_cycles (name, description, start_date, end_date) 
VALUES 
    ('Q1 2024', 'First quarter renewal cycle', '2024-01-01', '2024-03-31'),
    ('Q2 2024', 'Second quarter renewal cycle', '2024-04-01', '2024-06-30'),
    ('Q3 2024', 'Third quarter renewal cycle', '2024-07-01', '2024-09-30'),
    ('Q4 2024', 'Fourth quarter renewal cycle', '2024-10-01', '2024-12-31')
ON CONFLICT DO NOTHING;

-- Step 3: Check if policy_holders table has id_number column and add it if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'policy_holders' AND column_name = 'id_number') THEN
        ALTER TABLE policy_holders ADD COLUMN id_number TEXT;
    END IF;
END $$;

-- Step 4: Create sample policy holders only if they don't exist
INSERT INTO policy_holders (name, email, phone, address) 
SELECT * FROM (VALUES 
    ('John Smith', 'john@example.com', '9876543210', 'Mumbai, Maharashtra'),
    ('Sarah Johnson', 'sarah@example.com', '8765432109', 'Delhi, NCR'),
    ('Michael Brown', 'michael@example.com', '7654321098', 'Bangalore, Karnataka'),
    ('Emily Davis', 'emily@example.com', '6543210987', 'Chennai, Tamil Nadu'),
    ('David Wilson', 'david@example.com', '5432109876', 'Hyderabad, Telangana')
) AS v(name, email, phone, address)
WHERE NOT EXISTS (
    SELECT 1 FROM policy_holders ph 
    WHERE ph.email = v.email
);

-- Step 5: Update id_number for existing policy holders if column exists
UPDATE policy_holders 
SET id_number = 'ABCDE' || LPAD(id::text, 4, '0') || 'F'
WHERE id_number IS NULL;

-- Step 6: Create sample policies using existing vehicles
INSERT INTO policies (policy_number, policy_holder_id, vehicle_id, policy_type, start_date, end_date, premium_amount, coverage_amount, status)
SELECT 
    'POL-' || LPAD(ph.id::text, 4, '0') || '-' || EXTRACT(YEAR FROM CURRENT_DATE),
    ph.id,
    v.id,
    'Comprehensive',
    CURRENT_DATE - INTERVAL '11 months',
    CURRENT_DATE + INTERVAL '1 month',
    15000.00 + (ph.id * 1000), -- Varying premium amounts
    500000.00 + (ph.id * 50000), -- Varying coverage amounts
    'active'
FROM policy_holders ph
JOIN vehicles v ON v.policy_holder_id = ph.id
WHERE NOT EXISTS (
    SELECT 1 FROM policies p 
    WHERE p.policy_holder_id = ph.id 
    AND p.vehicle_id = v.id
)
LIMIT 10;

-- Step 7: Create sample renewals for existing policies
INSERT INTO policy_renewals (
    policy_id,
    renewal_date,
    renewal_cycle_id,
    status,
    renewal_premium,
    original_premium,
    assigned_to,
    assigned_at,
    first_contact_date,
    last_contact_date,
    contact_count,
    renewal_notes,
    conversion_status
)
SELECT 
    p.id,
    p.end_date + INTERVAL '30 days',
    rc.id,
    CASE 
        WHEN p.end_date < CURRENT_DATE THEN 'overdue'
        WHEN p.end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'urgent'
        ELSE 'pending'
    END,
    p.premium_amount * 1.1, -- 10% increase for renewal
    p.premium_amount,
    u.id,
    CURRENT_TIMESTAMP,
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE - INTERVAL '5 days',
    FLOOR(RANDOM() * 5) + 1, -- Random contact count 1-5
    CASE 
        WHEN p.end_date < CURRENT_DATE THEN 'Policy expired, urgent renewal needed'
        WHEN p.end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Renewal due soon, customer contacted'
        ELSE 'Standard renewal process initiated'
    END,
    CASE 
        WHEN p.end_date < CURRENT_DATE - INTERVAL '60 days' THEN 'lost'
        WHEN p.end_date < CURRENT_DATE THEN 'pending'
        ELSE 'pending'
    END
FROM policies p
CROSS JOIN renewal_cycles rc
CROSS JOIN users u
WHERE p.status = 'active'
  AND rc.is_active = true
  AND u.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM policy_renewals pr WHERE pr.policy_id = p.id
  )
LIMIT 10;

-- Step 8: Create some overdue renewals
INSERT INTO policy_renewals (
    policy_id,
    renewal_date,
    renewal_cycle_id,
    status,
    renewal_premium,
    original_premium,
    assigned_to,
    assigned_at,
    first_contact_date,
    last_contact_date,
    contact_count,
    renewal_notes,
    conversion_status
)
SELECT 
    p.id,
    p.end_date - INTERVAL '30 days', -- Overdue by 30 days
    rc.id,
    'overdue',
    p.premium_amount * 1.15, -- 15% increase for overdue renewal
    p.premium_amount,
    u.id,
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    p.end_date - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '10 days',
    8, -- High contact count for overdue
    'Policy expired, multiple contact attempts made. Customer considering other options.',
    'pending'
FROM policies p
CROSS JOIN renewal_cycles rc
CROSS JOIN users u
WHERE p.status = 'active'
  AND rc.is_active = true
  AND u.role = 'admin'
  AND p.end_date < CURRENT_DATE - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM policy_renewals pr WHERE pr.policy_id = p.id
  )
LIMIT 3;

-- Step 9: Create some converted renewals
INSERT INTO policy_renewals (
    policy_id,
    renewal_date,
    renewal_cycle_id,
    status,
    renewal_premium,
    original_premium,
    assigned_to,
    assigned_at,
    first_contact_date,
    last_contact_date,
    contact_count,
    renewal_notes,
    conversion_status
)
SELECT 
    p.id,
    p.end_date + INTERVAL '15 days',
    rc.id,
    'converted',
    p.premium_amount * 1.05, -- 5% increase for converted renewal
    p.premium_amount,
    u.id,
    CURRENT_TIMESTAMP - INTERVAL '60 days',
    p.end_date - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '20 days',
    3, -- Moderate contact count for converted
    'Customer renewed successfully. Happy with service and competitive pricing.',
    'converted'
FROM policies p
CROSS JOIN renewal_cycles rc
CROSS JOIN users u
WHERE p.status = 'active'
  AND rc.is_active = true
  AND u.role = 'admin'
  AND p.end_date > CURRENT_DATE - INTERVAL '30 days'
  AND p.end_date < CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM policy_renewals pr WHERE pr.policy_id = p.id
  )
LIMIT 2;

-- Step 10: Verify the data
SELECT 
    'Policy Holders' as table_name,
    COUNT(*) as count
FROM policy_holders
UNION ALL
SELECT 
    'Vehicles' as table_name,
    COUNT(*) as count
FROM vehicles
UNION ALL
SELECT 
    'Policies' as table_name,
    COUNT(*) as count
FROM policies
UNION ALL
SELECT 
    'Renewal Cycles' as table_name,
    COUNT(*) as count
FROM renewal_cycles
UNION ALL
SELECT 
    'Policy Renewals' as table_name,
    COUNT(*) as count
FROM policy_renewals;

-- Step 11: Show sample renewal data
SELECT 
    r.id,
    p.policy_number,
    ph.name as policy_holder_name,
    r.renewal_date,
    r.status,
    r.conversion_status,
    r.renewal_premium,
    r.original_premium,
    r.contact_count
FROM policy_renewals r
JOIN policies p ON r.policy_id = p.id
JOIN policy_holders ph ON p.policy_holder_id = ph.id
ORDER BY r.renewal_date ASC
LIMIT 10; 