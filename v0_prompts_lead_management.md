# Lead Management System - v0.dev Prompts

## Step 1: Create Lead Management API Routes

**Prompt for v0.dev:**
```
Create a Next.js API route for lead management with the following endpoints:

1. GET /api/leads - List all leads with filtering by status, assigned_to, source_id
2. POST /api/leads - Create a new lead
3. GET /api/leads/[id] - Get lead details by ID
4. PUT /api/leads/[id] - Update lead
5. DELETE /api/leads/[id] - Delete lead
6. GET /api/leads/[id]/activities - Get lead activities
7. POST /api/leads/[id]/activities - Add activity to lead
8. PUT /api/leads/[id]/assign - Assign lead to user
9. PUT /api/leads/[id]/status - Update lead status

Use PostgreSQL with Neon DB. Include proper error handling, validation, and TypeScript types.

Database tables: leads, lead_sources, lead_activities, lead_status_history
```

## Step 2: Lead Sources API

**Prompt for v0.dev:**
```
Create API routes for lead sources management:

1. GET /api/lead-sources - List all lead sources
2. POST /api/lead-sources - Create new lead source
3. PUT /api/lead-sources/[id] - Update lead source
4. DELETE /api/lead-sources/[id] - Delete lead source

Include proper validation and error handling.
```

## Step 3: Lead Management Dashboard Page

**Prompt for v0.dev:**
```
Create a comprehensive lead management dashboard page with:

1. Lead list table with columns: Lead Number, Name, Company, Source, Status, Priority, Assigned To, Expected Close Date, Actions
2. Filtering by: Status, Source, Assigned To, Date Range
3. Search functionality
4. Add new lead button
5. Bulk actions (assign, change status)
6. Lead status kanban board view toggle
7. Lead analytics cards showing: Total Leads, New Leads, In Progress, Converted, Lost
8. Recent activities sidebar

Use shadcn/ui components, Tailwind CSS, and make it responsive.
File: app/leads/page.tsx
```

## Step 4: Lead Detail Page

**Prompt for v0.dev:**
```
Create a detailed lead view page with:

1. Lead information section (personal details, company, source, value)
2. Status and assignment section with quick actions
3. Activities timeline showing all interactions
4. Add activity form
5. Status history
6. Related documents section
7. Quick actions: Edit, Assign, Change Status, Add Activity

Use tabs for organization, responsive design, and shadcn/ui components.
File: app/leads/[id]/page.tsx
```

## Step 5: Add/Edit Lead Form

**Prompt for v0.dev:**
```
Create a comprehensive lead form component with:

1. Personal information: First Name, Last Name, Email, Phone
2. Company information: Company Name, Industry
3. Lead details: Source, Value, Priority, Expected Close Date
4. Notes field
5. Form validation using react-hook-form and zod
6. Submit and cancel buttons
7. Loading states

Make it reusable for both create and edit modes.
File: components/lead-form.tsx
```

## Step 6: Lead Status Management

**Prompt for v0.dev:**
```
Create lead status management components:

1. Status change dialog with reason field
2. Status badge component with different colors
3. Status history component
4. Quick status change dropdown

Lead statuses: new, contacted, qualified, proposal, negotiation, won, lost
Use shadcn/ui dialog, badge, and dropdown components.
```

## Step 7: Lead Analytics Dashboard

**Prompt for v0.dev:**
```
Create a lead analytics dashboard with:

1. Lead conversion funnel chart
2. Lead source distribution pie chart
3. Monthly lead trends line chart
4. Performance metrics cards
5. Top performing agents table
6. Lead velocity metrics

Use recharts or similar charting library with shadcn/ui components.
File: app/leads/analytics/page.tsx
```

## Step 8: Lead Assignment Component

**Prompt for v0.dev:**
```
Create a lead assignment component with:

1. User selection dropdown
2. Assignment reason field
3. Assignment history
4. Bulk assignment functionality
5. Assignment notifications

Include proper validation and user feedback.
File: components/lead-assignment.tsx
```

## Step 9: Lead Activities Component

**Prompt for v0.dev:**
```
Create a lead activities component with:

1. Activity timeline view
2. Add activity form with types: call, email, meeting, note
3. Activity details modal
4. Follow-up scheduling
5. Activity templates

Use shadcn/ui timeline, form, and modal components.
File: components/lead-activities.tsx
```

## Step 10: Navigation and Sidebar Updates

**Prompt for v0.dev:**
```
Update the sidebar navigation to include:

1. Leads menu item with sub-items: All Leads, New Lead, Analytics
2. Lead count badge
3. Quick access to recent leads
4. Lead status filters

Update the existing sidebar component to include these new items.
File: components/sidebar.tsx
``` 