-- Create sample renewal data
-- This script will create sample renewals for existing policies

-- First, let's check if we have any policies to create renewals for
-- If no policies exist, we'll create some sample policies first

-- Insert sample policies if they don't exist
INSERT INTO policies (policy_number, policy_holder_id, vehicle_id, policy_type, start_date, end_date, premium_amount, coverage_amount, status)
SELECT 
  'POL-' || LPAD(ph.id::text, 4, '0') || '-2024',
  ph.id,
  v.id,
  'Comprehensive',
  CURRENT_DATE - INTERVAL '11 months',
  CURRENT_DATE + INTERVAL '1 month',
  15000.00,
  500000.00,
  'active'
FROM policy_holders ph
JOIN vehicles v ON v.policy_holder_id = ph.id
WHERE NOT EXISTS (
  SELECT 1 FROM policies p 
  WHERE p.policy_holder_id = ph.id 
  AND p.vehicle_id = v.id
)
LIMIT 5;

-- Now create sample renewals for existing policies
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

-- Create some overdue renewals
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

-- Create some converted renewals
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