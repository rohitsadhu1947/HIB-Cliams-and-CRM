-- Script to create renewals based on policy expiry dates
-- This simulates a real insurance system where renewals are generated automatically

-- Step 1: First, let's see what policies we have and their expiry dates
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
ORDER BY p.end_date ASC;

-- Step 2: Create renewals for policies expiring within 60 days (including expired ones)
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
    p.end_date + INTERVAL '30 days', -- Renewal date is 30 days after policy end
    rc.id,
    CASE 
        WHEN p.end_date < CURRENT_DATE THEN 'overdue'
        WHEN p.end_date < CURRENT_DATE + INTERVAL '7 days' THEN 'urgent'
        WHEN p.end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'pending'
        ELSE 'pending'
    END,
    p.premium_amount * (1 + (CASE 
        WHEN p.end_date < CURRENT_DATE THEN 0.15 -- 15% increase for expired
        WHEN p.end_date < CURRENT_DATE + INTERVAL '7 days' THEN 0.12 -- 12% increase for urgent
        ELSE 0.10 -- 10% increase for normal
    END)),
    p.premium_amount,
    u.id,
    CURRENT_TIMESTAMP,
    CASE 
        WHEN p.end_date < CURRENT_DATE THEN p.end_date - INTERVAL '45 days'
        WHEN p.end_date < CURRENT_DATE + INTERVAL '7 days' THEN p.end_date - INTERVAL '30 days'
        ELSE p.end_date - INTERVAL '60 days'
    END,
    CURRENT_DATE - INTERVAL '5 days',
    CASE 
        WHEN p.end_date < CURRENT_DATE THEN 10 -- High contact count for expired
        WHEN p.end_date < CURRENT_DATE + INTERVAL '7 days' THEN 7 -- Medium contact count for urgent
        ELSE FLOOR(RANDOM() * 3) + 1 -- Low contact count for normal
    END,
    CASE 
        WHEN p.end_date < CURRENT_DATE THEN 'Policy expired, urgent renewal needed. Multiple contact attempts made.'
        WHEN p.end_date < CURRENT_DATE + INTERVAL '7 days' THEN 'Policy expiring soon, customer contacted multiple times.'
        WHEN p.end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Policy expiring within 30 days, renewal process initiated.'
        ELSE 'Standard renewal process initiated for policy expiring in 60+ days.'
    END,
    CASE 
        WHEN p.end_date < CURRENT_DATE - INTERVAL '90 days' THEN 'lost'
        WHEN p.end_date < CURRENT_DATE THEN 'pending'
        ELSE 'pending'
    END
FROM policies p
CROSS JOIN renewal_cycles rc
CROSS JOIN users u
WHERE p.status = 'active'
  AND rc.is_active = true
  AND u.role = 'admin'
  AND p.end_date < CURRENT_DATE + INTERVAL '60 days' -- Only policies expiring within 60 days
  AND NOT EXISTS (
    SELECT 1 FROM policy_renewals pr WHERE pr.policy_id = p.id
  );

-- Step 3: Create some converted renewals for recently expired policies
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

-- Step 4: Create a function to automatically generate renewals
CREATE OR REPLACE FUNCTION generate_renewals_for_expiring_policies()
RETURNS void AS $$
BEGIN
    -- Insert renewals for policies expiring within 30 days that don't have renewals yet
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
            WHEN p.end_date < CURRENT_DATE + INTERVAL '7 days' THEN 'urgent'
            ELSE 'pending'
        END,
        p.premium_amount * 1.10, -- 10% increase
        p.premium_amount,
        u.id,
        CURRENT_TIMESTAMP,
        CURRENT_DATE,
        CURRENT_DATE,
        1, -- Initial contact
        'Auto-generated renewal for policy expiring within 30 days.',
        'pending'
    FROM policies p
    CROSS JOIN renewal_cycles rc
    CROSS JOIN users u
    WHERE p.status = 'active'
      AND rc.is_active = true
      AND u.role = 'admin'
      AND p.end_date < CURRENT_DATE + INTERVAL '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM policy_renewals pr WHERE pr.policy_id = p.id
      );
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a trigger function to automatically update renewal status
CREATE OR REPLACE FUNCTION update_renewal_status()
RETURNS trigger AS $$
BEGIN
    -- Update status to 'overdue' for renewals where policy has expired
    UPDATE policy_renewals 
    SET status = 'overdue'
    WHERE policy_id IN (
        SELECT id FROM policies 
        WHERE end_date < CURRENT_DATE 
        AND status = 'active'
    )
    AND status = 'pending';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to run daily (you can schedule this with a cron job)
-- For now, let's manually run the function
SELECT generate_renewals_for_expiring_policies();

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

-- Step 8: Show renewal data with expiry information
SELECT 
    r.id,
    p.policy_number,
    ph.name as policy_holder_name,
    p.end_date as policy_expiry,
    r.renewal_date,
    r.status,
    r.conversion_status,
    r.renewal_premium,
    r.original_premium,
    r.contact_count,
    CASE 
        WHEN p.end_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN p.end_date < CURRENT_DATE + INTERVAL '7 days' THEN 'EXPIRING_SOON'
        WHEN p.end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_IN_30_DAYS'
        ELSE 'ACTIVE'
    END as expiry_status
FROM policy_renewals r
JOIN policies p ON r.policy_id = p.id
JOIN policy_holders ph ON p.policy_holder_id = ph.id
ORDER BY p.end_date ASC, r.status ASC
LIMIT 20;

-- Step 9: Show summary by status
SELECT 
    r.status,
    COUNT(*) as count,
    AVG(r.renewal_premium) as avg_renewal_premium,
    AVG(r.contact_count) as avg_contact_count
FROM policy_renewals r
GROUP BY r.status
ORDER BY count DESC; 