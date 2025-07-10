-- Script to assign vehicles to new policy holders and create policies/renewals
-- This will ensure all policy holders have vehicles and can have policies

-- Step 1: Create new vehicles for policy holders who don't have any
INSERT INTO vehicles (
    policy_holder_id,
    registration_number,
    make,
    model,
    year,
    engine_number,
    chassis_number,
    vehicle_type
)
SELECT 
    ph.id,
    CASE 
        WHEN ph.id = 11 THEN 'MH11AB1234'
        WHEN ph.id = 12 THEN 'DL12CD5678'
        WHEN ph.id = 13 THEN 'KA13EF9012'
        WHEN ph.id = 14 THEN 'TN14GH3456'
        WHEN ph.id = 15 THEN 'TS15IJ7890'
        WHEN ph.id = 16 THEN 'MH16KL1234'
        WHEN ph.id = 17 THEN 'DL17MN5678'
        WHEN ph.id = 18 THEN 'KA18OP9012'
        WHEN ph.id = 19 THEN 'TN19QR3456'
        WHEN ph.id = 20 THEN 'TS20ST7890'
    END,
    CASE 
        WHEN ph.id = 11 THEN 'Maruti Suzuki'
        WHEN ph.id = 12 THEN 'Hyundai'
        WHEN ph.id = 13 THEN 'Honda'
        WHEN ph.id = 14 THEN 'Tata'
        WHEN ph.id = 15 THEN 'Toyota'
        WHEN ph.id = 16 THEN 'Mahindra'
        WHEN ph.id = 17 THEN 'Kia'
        WHEN ph.id = 18 THEN 'Volkswagen'
        WHEN ph.id = 19 THEN 'MG'
        WHEN ph.id = 20 THEN 'Honda'
    END,
    CASE 
        WHEN ph.id = 11 THEN 'Swift'
        WHEN ph.id = 12 THEN 'i20'
        WHEN ph.id = 13 THEN 'City'
        WHEN ph.id = 14 THEN 'Nexon'
        WHEN ph.id = 15 THEN 'Innova'
        WHEN ph.id = 16 THEN 'XUV700'
        WHEN ph.id = 17 THEN 'Seltos'
        WHEN ph.id = 18 THEN 'Polo'
        WHEN ph.id = 19 THEN 'Hector'
        WHEN ph.id = 20 THEN 'Amaze'
    END,
    2022,
    'ENG' || LPAD(ph.id::text, 6, '0'),
    'CHS' || LPAD(ph.id::text, 6, '0'),
    CASE 
        WHEN ph.id IN (11, 16, 18) THEN 'Hatchback'
        WHEN ph.id IN (12, 15, 19) THEN 'SUV'
        WHEN ph.id IN (13, 20) THEN 'Sedan'
        WHEN ph.id = 14 THEN 'SUV'
        WHEN ph.id = 17 THEN 'SUV'
    END
FROM policy_holders ph
WHERE ph.id >= 11 
  AND ph.id <= 20
  AND NOT EXISTS (
    SELECT 1 FROM vehicles v WHERE v.policy_holder_id = ph.id
  );

-- Step 2: Create policies for all policy holders who have vehicles but no policies
INSERT INTO policies (
    policy_number,
    policy_holder_id,
    vehicle_id,
    policy_type,
    start_date,
    end_date,
    premium_amount,
    coverage_amount,
    status
)
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
);

-- Step 3: Create renewal cycles if they don't exist
INSERT INTO renewal_cycles (name, description, start_date, end_date) 
VALUES 
    ('Q1 2024', 'First quarter renewal cycle', '2024-01-01', '2024-03-31'),
    ('Q2 2024', 'Second quarter renewal cycle', '2024-04-01', '2024-06-30'),
    ('Q3 2024', 'Third quarter renewal cycle', '2024-07-01', '2024-09-30'),
    ('Q4 2024', 'Fourth quarter renewal cycle', '2024-10-01', '2024-12-31')
ON CONFLICT DO NOTHING;

-- Step 4: Create sample renewals for all policies
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
LIMIT 5;

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
LIMIT 3;

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

-- Step 8: Show sample renewal data
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
LIMIT 15; 