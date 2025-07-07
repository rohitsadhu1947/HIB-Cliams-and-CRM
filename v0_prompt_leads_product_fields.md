# v0.dev Prompt: Add Insurance Product Selection to Leads

Update the leads management system to support insurance product selection:

- Add columns `product_category` and `product_subtype` to the leads table.
- Update the API (POST/PUT/GET) to handle these fields.
- Update the lead form to allow selecting product category (Motor, Health, Life, Travel, Pet, Cyber, Corporate, Marine, etc.) and, based on category, a subtype (e.g., for Motor: 2w, 4w, CV; for Life: Term, ULIP, Endowment, Others).
- Show these fields in the leads list and details.
- Use shadcn/ui Select components for dropdowns.
- Ensure the API and UI are fully type-safe and validated. 