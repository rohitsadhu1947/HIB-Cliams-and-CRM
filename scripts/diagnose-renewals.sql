-- Diagnostic script to check why policy_renewals table is empty

-- Step 1: Check if we have any policies
SELECT 'Policies Count' as check_type, COUNT(*) as count FROM policies;

-- Step 2: Check if we have any renewal_cycles
SELECT 'Renewal Cycles Count' as check_type, COUNT(*) as count FROM renewal_cycles;

-- Step 3: Check if we have any users with admin role
SELECT 'Admin Users Count' as check_type, COUNT(*) as count FROM users WHERE role = 'admin';

-- Step 4: Check policy expiry dates
SELECT 
    p.id,
    p.policy_number,
    ph.name as policy_holder_name,
    p.end_date,
    p.end_date - CURRENT_DATE as days_until_expiry,
    CASE 
        WHEN p.end_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN p.end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        WHEN p.end_date < CURRENT_DATE + INTERVAL '60 days' THEN 'EXPIRING_IN_60_DAYS'
        ELSE 'ACTIVE'
    END as expiry_status
FROM policies p
JOIN policy_holders ph ON p.policy_holder_id = ph.id
ORDER BY p.end_date ASC
LIMIT 10;

-- Step 5: Check if there are any existing renewals
SELECT 'Existing Renewals Count' as check_type, COUNT(*) as count FROM policy_renewals;

-- Step 6: Try to create a simple test renewal
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
    'pending',
    p.premium_amount * 1.1,
    p.premium_amount,
    u.id,
    CURRENT_TIMESTAMP,
    CURRENT_DATE,
    CURRENT_DATE,
    1,
    'Test renewal created',
    'pending'
FROM policies p
CROSS JOIN renewal_cycles rc
CROSS JOIN users u
WHERE p.status = 'active'
  AND rc.is_active = true
  AND u.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM policy_renewals pr WHERE pr.policy_id = p.id
  )
LIMIT 1;

-- Step 7: Check if the test renewal was created
SELECT 'Renewals After Test' as check_type, COUNT(*) as count FROM policy_renewals;

-- Step 8: Show any renewals that were created
SELECT 
    r.id,
    p.policy_number,
    ph.name as policy_holder_name,
    r.renewal_date,
    r.status,
    r.conversion_status,
    r.renewal_premium,
    r.original_premium
FROM policy_renewals r
JOIN policies p ON r.policy_id = p.id
JOIN policy_holders ph ON p.policy_holder_id = ph.id
ORDER BY r.id DESC
LIMIT 10; 