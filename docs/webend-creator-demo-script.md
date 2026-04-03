# Webend Creator — Demo Video Script
## "Build a CRM in 10 Minutes"

**Total runtime**: 10-12 minutes
**Format**: Screen recording with voiceover narration
**Resolution**: 1920x1080, dark theme (theme-ocean or theme-royal)

---

## PRE-RECORDING CHECKLIST

- [ ] Clean Webend Creator instance running
- [ ] Schema "contact" does not exist yet (fresh start)
- [ ] Browser at full screen, no bookmarks bar
- [ ] Microphone tested, quiet environment
- [ ] Close all other tabs and notifications

---

## SCENE 1: The Hook (0:00 - 0:20)

**Screen**: Blank browser, Webend Creator login page

**Narration**:
> "What if you could build a complete CRM — contacts, companies, deals, activity tracking, change history — and have it running in production in 10 minutes?"
>
> "I'm going to show you exactly how. No code generation that breaks. No AI hallucinations. Just a schema, a visual designer, and a working application."

**Action**: Log in. Show the app picker briefly (demonstrates multi-app capability).

---

## SCENE 2: Define the Schema (0:20 - 2:30)

**Screen**: Navigate to Schemas → Create New

**Narration**:
> "Everything starts with a schema. In Webend Creator, we use LiteSpec — a simple DSL that defines your data model, validation rules, and relationships in one place."

**Action**: Create the "contact" schema with these fields:

```
first_name    string    required
last_name     string    required
email         string    format:email    required
phone         string
company       string
title         string
status        enum[lead,prospect,customer,inactive]    required    default:lead
source        enum[website,referral,cold_call,conference,other]
deal_value    number    format:currency
notes         textarea
created_date  string    format:date-time    readonly
```

**Narration** (while typing):
> "First name, last name, email — standard fields with validation. Status is an enum — lead, prospect, customer, inactive. Deal value is currency. Notes is a textarea."
>
> "This schema drives everything that comes next — forms, lists, validation, the visual designer, even the AI assistant. Define it once, use it everywhere."

**Action**: Save the schema. Show the schema list briefly.

---

## SCENE 3: Create the Template (2:30 - 4:00)

**Screen**: Navigate to Templates → Create New

**Narration**:
> "Now we create a template. This is the page your users will actually see."

**Action**:
1. Create a new template named "Contact" with slug "contact"
2. Set the schema to "contact"
3. Go to the Template tab
4. Switch to Visual designer
5. Drop the **Standard Edit Page** preset

**Narration**:
> "The Standard Edit Page preset gives us the full page structure — skeleton loader, breadcrumb navigation, save button with dropdown, tabs for General and Change Log. This is production-ready boilerplate."

**Action**:
6. Switch to the Fields tab on the left
7. Select "Contact" schema from the dropdown
8. Show the fields listed: First Name, Last Name, Email, Phone, etc.

**Narration**:
> "The Fields tab automatically reads our schema and presents every field, ready to drag onto the canvas."

---

## SCENE 4: Visual Designer (4:00 - 7:00)

**Screen**: Visual designer with preset dropped

**Narration**:
> "Now watch — I'll drag fields from the left panel directly into the form."

**Action**:
1. Drag **First Name** into the General tab form area
2. Drag **Last Name** next to it (2-column layout)
3. Drag **Email** below
4. Drag **Phone** next to Email (2-column)
5. Drag **Company** below
6. Drag **Title** next to Company (2-column)
7. Drag **Status** below
8. Drag **Source** next to Status (2-column)
9. Drag **Deal Value** below
10. Drag **Notes** below (full width)

**Narration** (while dragging):
> "First name and last name side by side. Email and phone in a row. Company and title. Status and source — notice these are dropdowns, automatically generated from the enum values in our schema."
>
> "Deal value comes in as a currency field. Notes as a textarea."

**Action**:
11. Click on the Title field in the canvas — show the property panel on the right
12. Point out: Name, Label, Value binding, Required checkbox

**Narration**:
> "Click any element and the property panel shows all its attributes. The Value field shows the Pongo2 binding — this is the exact server-side expression that renders the data. What you see in the designer IS what runs in production."

**Action**:
13. Switch to the Source tab — show the full Pongo2 template

**Narration**:
> "Switch to Source and you see the complete template — extends base layout, block definitions, Pongo2 data bindings. This is real, deployable code. Not a proprietary format. Not AI-generated guesswork."

**Action**:
14. Switch back to Visual
15. Save

---

## SCENE 5: Create the List Template (7:00 - 8:30)

**Screen**: Templates → Create New

**Narration**:
> "Every CRM needs a list view. Let's create one."

**Action**:
1. Create template "Contact List" with slug "contact_list"
2. Set schema to "contact"
3. Drop the **List Page** preset
4. Configure the tabulator columns: First Name, Last Name, Email, Company, Status, Deal Value
5. Save

**Narration**:
> "The list preset gives us a data table with sorting, searching, and pagination — all connected to our MongoDB collection. Clicking a row opens the edit form we just built."

---

## SCENE 6: See It Work (8:30 - 10:00)

**Screen**: Navigate to the running Contact app

**Narration**:
> "Let's see it in action."

**Action**:
1. Navigate to the Contact list (should be empty)
2. Click "Create" or "Add New"
3. Fill in a contact: Jane Smith, jane@acme.com, (555) 123-4567, Acme Corp, VP Sales, Lead, Website, $25,000
4. Show validation (try submitting without required fields)
5. Save the contact
6. Show the Change Log tab — "Created by [user] at [timestamp]"

**Narration**:
> "There it is — a fully functional contact form. Validation is automatic from the schema. The change log tracks who created the record and when."

**Action**:
7. Go back to the list — show the contact in the table
8. Click the contact, change the status to "Prospect"
9. Save, show the Change Log — "Status changed from Lead to Prospect"

**Narration**:
> "Every change is tracked automatically. No extra code. No audit trail plugins. It's built into the platform."

---

## SCENE 7: Data Tools (10:00 - 11:00)

**Screen**: Query Manager

**Narration**:
> "Webend Creator includes data operations tools that most platforms charge extra for."

**Action**:
1. Open Query Manager
2. Write a simple query: find contacts where status = "lead"
3. Execute, show results
4. Briefly show Index Manager — "optimize your queries"
5. Briefly show Data Compare — "compare environments"

**Narration**:
> "Query Manager lets you explore your data visually. Index Manager helps you optimize performance. Data Compare lets you diff datasets across environments. These tools are built in — not add-ons."

---

## SCENE 8: The Close (11:00 - 11:30)

**Screen**: Split view — the Visual Designer on one side, the running app on the other

**Narration**:
> "In 10 minutes, we went from nothing to a production-ready CRM with:"

**Action**: Show bullet points on screen (overlay or quick cuts):

> - Schema-driven forms with validation
> - Visual designer that matches production
> - Data table with sort, search, pagination
> - Automatic change tracking
> - Query and data management tools
> - Role-based permissions
> - 40+ themes for custom branding

> "And this is just the beginning. Add Web Pilots for automated data entry across external portals. Add the AI assistant that understands your schema. Add more apps — projects, invoices, inventory — all under one branded platform."

**Final line**:
> "This is Webend Creator. Build faster. Automate more. Own your platform."

**Screen**: Show logo, URL, "Start your free trial" CTA

---

## SCENE 9 (OPTIONAL BONUS): Web Pilots Preview (11:30 - 12:30)

**Screen**: Web Pilots interface

**Narration**:
> "One more thing. See this contact — Jane Smith at Acme Corp? Watch what happens when I click 'Enrich Contact'."

**Action**:
1. Show a Web Pilot script that navigates to a business directory
2. Searches for the company
3. Extracts additional data (address, industry, employee count)
4. Saves it back to the contact record

**Narration**:
> "Web Pilots automate any website interaction. Log into portals, fill forms, extract data — all driven by your application data, with secure credential storage. Currently running in production at insurance agencies, automating quoting across 11 carriers."

---

## POST-PRODUCTION NOTES

### Editing
- Add subtle zoom-ins when showing important details (property panel, Source tab, Change Log)
- Add text overlays for key points ("Schema drives everything", "Real code, not proprietary")
- Background music: subtle, professional, not distracting
- Trim dead time (typing, loading) to keep pace tight

### Thumbnail
- Split screen: Visual Designer on left, Running App on right
- Text: "Build a CRM in 10 Minutes"
- Webend Creator logo

### Publishing
- YouTube (primary)
- Landing page embed
- LinkedIn native video (cut to 3 minutes for feed)
- Product Hunt launch assets

### Variations to Record
1. **Full demo** (12 min) — YouTube, landing page
2. **Highlight reel** (3 min) — LinkedIn, social media
3. **30-second teaser** — Ads, email campaigns
