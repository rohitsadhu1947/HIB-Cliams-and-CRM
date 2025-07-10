-- Simple script to create renewals in policy_renewals table
-- This will definitely work and create data

-- Step 1: First, let's make sure we have the policy_renewals table
CREATE TABLE IF NOT EXISTS policy_renewals (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER,
    renewal_date DATE NOT NULL,
    renewal_cycle_id INTEGER,
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

-- Step 2: Create renewal_cycles if they don't exist
CREATE TABLE IF NOT EXISTS renewal_cycles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Insert renewal cycles
INSERT INTO renewal_cycles (name, description, start_date, end_date) 
VALUES 
    ('Q1 2024', 'First quarter renewal cycle', '2024-01-01', '2024-03-31'),
    ('Q2 2024', 'Second quarter renewal cycle', '2024-04-01', '2024-06-30'),
    ('Q3 2024', 'Third quarter renewal cycle', '2024-07-01', '2024-09-30'),
    ('Q4 2024', 'Fourth quarter renewal cycle', '2024-10-01', '2024-12-31')
ON CONFLICT DO NOTHING;

-- Step 4: Create simple renewals for all policies
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
    1, -- Use first renewal cycle
    'pending',
    p.premium_amount * 1.1,
    p.premium_amount,
    1, -- Use first user
    CURRENT_TIMESTAMP,
    CURRENT_DATE,
    CURRENT_DATE,
    1,
    'Renewal created for policy ' || p.policy_number,
    'pending'
FROM policies p
WHERE NOT EXISTS (
    SELECT 1 FROM policy_renewals pr WHERE pr.policy_id = p.id
);

-- Step 5: Create some overdue renewals
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
    p.end_date - INTERVAL '10 days',
    1,
    'overdue',
    p.premium_amount * 1.15,
    p.premium_amount,
    1,
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    p.end_date - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '10 days',
    8,
    'Policy expired, urgent renewal needed',
    'pending'
FROM policies p
WHERE p.end_date < CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM policy_renewals pr WHERE pr.policy_id = p.id AND pr.status = 'overdue'
  )
LIMIT 3;

-- Step 6: Create some converted renewals
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
    1,
    'converted',
    p.premium_amount * 1.05,
    p.premium_amount,
    1,
    CURRENT_TIMESTAMP - INTERVAL '60 days',
    p.end_date - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '20 days',
    3,
    'Customer renewed successfully',
    'converted'
FROM policies p
WHERE p.end_date > CURRENT_DATE - INTERVAL '30 days'
  AND p.end_date < CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM policy_renewals pr WHERE pr.policy_id = p.id AND pr.status = 'converted'
  )
LIMIT 2;

-- Step 7: Verify the data
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

-- Step 8: Show the renewals we created
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
ORDER BY r.id DESC
LIMIT 15; 