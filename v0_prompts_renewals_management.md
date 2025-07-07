# Renewals Management System - v0.dev Prompts

## Step 1: Create Renewals API Routes

**Prompt for v0.dev:**
```
Create a Next.js API route for renewals management with the following endpoints:

1. GET /api/renewals - List all renewals with filtering by status, assigned_to, renewal_date
2. POST /api/renewals - Create a new renewal
3. GET /api/renewals/[id] - Get renewal details by ID
4. PUT /api/renewals/[id] - Update renewal
5. DELETE /api/renewals/[id] - Delete renewal
6. GET /api/renewals/[id]/activities - Get renewal activities
7. POST /api/renewals/[id]/activities - Add activity to renewal
8. PUT /api/renewals/[id]/assign - Assign renewal to user
9. PUT /api/renewals/[id]/status - Update renewal status
10. GET /api/renewals/upcoming - Get upcoming renewals
11. GET /api/renewals/analytics - Get renewal analytics data

Use PostgreSQL with Neon DB. Include proper error handling, validation, and TypeScript types.

Database tables: policy_renewals, renewal_cycles, renewal_activities, renewal_status_history
```

## Step 2: Renewal Cycles API

**Prompt for v0.dev:**
```
Create API routes for renewal cycles management:

1. GET /api/renewal-cycles - List all renewal cycles
2. POST /api/renewal-cycles - Create new renewal cycle
3. PUT /api/renewal-cycles/[id] - Update renewal cycle
4. DELETE /api/renewal-cycles/[id] - Delete renewal cycle
5. GET /api/renewal-cycles/active - Get active renewal cycles

Include proper validation and error handling.
```

## Step 3: Renewals Dashboard Page

**Prompt for v0.dev:**
```
Create a comprehensive renewals dashboard page with:

1. Renewals list table with columns: Policy ID, Renewal Date, Status, Conversion Status, Assigned To, Premium, Actions
2. Filtering by: Status, Conversion Status, Renewal Date Range, Assigned To
3. Search functionality
4. Add new renewal button
5. Bulk actions (assign, change status)
6. Renewal status kanban board view toggle
7. Renewal analytics cards showing: Total Renewals, Pending, Converted, Lost, Conversion Rate
8. Upcoming renewals widget
9. Renewal cycle selector

Use shadcn/ui components, Tailwind CSS, and make it responsive.
File: app/renewals/page.tsx
```

## Step 4: Renewal Detail Page

**Prompt for v0.dev:**
```
Create a detailed renewal view page with:

1. Renewal information section (policy details, renewal date, premium amounts)
2. Status and assignment section with quick actions
3. Activities timeline showing all interactions
4. Add activity form
5. Status history
6. Conversion tracking section
7. Quick actions: Edit, Assign, Change Status, Add Activity, Mark as Converted/Lost

Use tabs for organization, responsive design, and shadcn/ui components.
File: app/renewals/[id]/page.tsx
```

## Step 5: Add/Edit Renewal Form

**Prompt for v0.dev:**
```
Create a comprehensive renewal form component with:

1. Policy selection (dropdown or search)
2. Renewal date picker
3. Renewal cycle selection
4. Premium amounts (original and renewal)
5. Assignment section
6. Notes field
7. Form validation using react-hook-form and zod
8. Submit and cancel buttons
9. Loading states

Make it reusable for both create and edit modes.
File: components/renewal-form.tsx
```

## Step 6: Renewal Status Management

**Prompt for v0.dev:**
```
Create renewal status management components:

1. Status change dialog with reason field
2. Conversion status management (pending, converted, lost, cancelled)
3. Status badge component with different colors
4. Status history component
5. Quick status change dropdown

Renewal statuses: pending, in_progress, contacted, proposal_sent, negotiation, converted, lost
Conversion statuses: pending, converted, lost, cancelled
Use shadcn/ui dialog, badge, and dropdown components.
```

## Step 7: Renewal Analytics Dashboard

**Prompt for v0.dev:**
```
Create a comprehensive renewal analytics dashboard with:

1. Renewal conversion funnel chart
2. Monthly renewal trends line chart
3. Conversion rate by agent bar chart
4. Renewal cycle performance comparison
5. Performance metrics cards: Total Renewals, Conversion Rate, Average Premium, Lost Revenue
6. Top performing agents table
7. Renewal velocity metrics
8. Lost deals analysis with reasons
9. Upcoming renewals calendar view

Use recharts or similar charting library with shadcn/ui components.
File: app/renewals/analytics/page.tsx
```

## Step 8: Upcoming Renewals Page

**Prompt for v0.dev:**
```
Create an upcoming renewals page with:

1. Calendar view showing renewals by date
2. List view with upcoming renewals sorted by date
3. Filtering by date range, status, assigned agent
4. Quick actions for each renewal
5. Bulk assignment functionality
6. Renewal reminders section
7. Export functionality for renewal lists

Use calendar component, responsive design, and shadcn/ui components.
File: app/renewals/upcoming/page.tsx
```

## Step 9: Renewal Assignment Component

**Prompt for v0.dev:**
```
Create a renewal assignment component with:

1. User selection dropdown
2. Assignment reason field
3. Assignment history
4. Bulk assignment functionality
5. Assignment notifications
6. Workload balancing suggestions

Include proper validation and user feedback.
File: components/renewal-assignment.tsx
```

## Step 10: Renewal Activities Component

**Prompt for v0.dev:**
```
Create a renewal activities component with:

1. Activity timeline view
2. Add activity form with types: call, email, meeting, proposal_sent, follow_up
3. Activity details modal
4. Follow-up scheduling
5. Activity templates for common renewal activities
6. Contact tracking

Use shadcn/ui timeline, form, and modal components.
File: components/renewal-activities.tsx
```

## Step 11: Renewal Conversion Tracking

**Prompt for v0.dev:**
```
Create renewal conversion tracking components:

1. Conversion status change dialog
2. Lost deal reason tracking
3. Conversion metrics display
4. Conversion timeline
5. Revenue impact calculation

Include proper validation and analytics tracking.
File: components/renewal-conversion.tsx
```

## Step 12: Renewal Reports and Export

**Prompt for v0.dev:**
```
Create renewal reporting and export functionality:

1. Renewal performance report
2. Conversion analysis report
3. Agent performance report
4. Export to Excel/CSV functionality
5. Scheduled report generation
6. Report templates

Include proper data formatting and export options.
File: components/renewal-reports.tsx
```

## Step 13: Navigation and Sidebar Updates

**Prompt for v0.dev:**
```
Update the sidebar navigation to include:

1. Renewals menu item with sub-items: All Renewals, Upcoming, Analytics, Reports
2. Renewal count badge
3. Quick access to upcoming renewals
4. Renewal status filters

Update the existing sidebar component to include these new items.
File: components/sidebar.tsx
```

## Step 14: Dashboard Integration

**Prompt for v0.dev:**
```
Update the main dashboard to include:

1. Renewal metrics cards
2. Upcoming renewals widget
3. Renewal conversion rate chart
4. Quick access to renewal management

Integrate with the existing dashboard components.
File: app/page.tsx
``` 