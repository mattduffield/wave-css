# Webend Creator — Go-to-Market Strategy

## Executive Summary

Webend Creator is a full-stack business application platform that combines application building, cloud automation, data operations, and AI — in a single, brandable, multi-app suite. Currently deployed in production at independent insurance agencies for automated carrier quoting.

The platform enables IT consultancies, agencies, and internal teams to:
- **Build** production-grade business applications 5-10x faster (schema-driven, visual designer)
- **Automate** repetitive website interactions across any portal (Web Pilots with credential vault and composition)
- **Manage** data with built-in query, comparison, indexing, and change tracking tools
- **Brand** the entire platform as their own (white labeling, 40+ themes, custom apps and navigation)
- **Secure** access with role-based permissions at the app, menu, and record level

**Core value proposition**: Define your data schema once. Get forms, lists, validation, field rules, visual designer, change tracking, web automations, data tools, and AI assistance — all from a single platform that looks and feels like YOUR platform.

---

## Platform Capabilities

### Application Builder
| Feature | Description |
|---------|-------------|
| **Schema-Driven Development** | LiteSpec DSL defines data models with validation, conditional rules, and relationships. One schema drives everything. |
| **Template System** | Pongo2 server-side templates with Go backend. Templates are real, deployable code — not proprietary runtime. |
| **Visual Designer** | Server-rendered WYSIWYG builder. What you design IS what runs in production. Drag-and-drop presets, fields, layouts. |
| **Web Components (Wave CSS)** | 60+ custom elements — forms, tabs, tables, accordions, modals, icons, skeletons. No Shadow DOM for maximum compatibility. |
| **Field Rules Engine** | Declarative show/hide/require/disable rules that respond to form state changes in real-time. |
| **HTMX Integration** | Server-centric architecture. Minimal JavaScript. Fast, accessible, SEO-friendly. |
| **40+ Themes** | oklch-based color system with automatic light/dark mode support. Theme selector component for runtime switching. |

### Data & Operations Tools
| Feature | Description |
|---------|-------------|
| **Query Manager** | Visual query builder for MongoDB. Save, share, and reuse queries across the team. |
| **Data Compare** | Compare datasets across collections or environments. Identify differences, sync data. |
| **Data Graph** | Visualize relationships between collections and documents. |
| **Index Manager** | View, create, and optimize MongoDB indexes directly from the UI. |
| **Index Profiler** | Analyze query performance and identify missing or underused indexes. |
| **Index Compare** | Compare index configurations across environments. |
| **Change Log** | Automatic change history for every record. Who changed what, when, with diff view. |

### Automation & AI
| Feature | Description |
|---------|-------------|
| **Web Pilots (Cloud Automation)** | Cloud-based Playwright automation service. Scripts run on the server, interact with any website. Composition pattern chains multiple scripts. Lookup-driven field mapping. Email notifications on success/failure. Credential vault for secure login storage. Elapsed time tracking. Active/inactive control. Query parameters for dynamic data injection. |
| **Web Pilot Composition** | Chain multiple automation scripts together. Parent scripts call child scripts with context passing. Build complex multi-step workflows (e.g., insurance quoting across 11 carriers from a single prospect record). |
| **Credential Vault** | Securely store login credentials for automated scripts. Scripts reference credentials by name, never hardcode passwords. |
| **AI Bot (WebLLM)** | Local LLM running in-browser. No data leaves the client. Knowledge base injection for schema-aware assistance. |
| **TemplateCraft** | Deterministic template generation from JSON Schema. Consistent, repeatable output — not AI hallucinations. |

### Platform Infrastructure
| Feature | Description |
|---------|-------------|
| **MongoDB Backend** | Document database — flexible schemas, easy scaling. |
| **Go Server** | Fast, compiled backend. Single binary deployment. Low resource usage. |
| **Role-Based Access** | User profiles, permissions, app-level access control. |
| **Multi-App Support** | Multiple applications (modules) within one instance. App picker, per-app navigation. |
| **White Labeling** | Custom branding, themes, logos. Deploy as your own product for your clients. |

---

## Market Analysis

### Industry Context

The low-code/no-code market is projected to reach $187 billion by 2030 (Gartner). Key drivers:
- Developer shortage (global shortfall of 4M+ developers)
- Rising demand for internal business applications
- Pressure to deliver faster with smaller teams
- AI creating both opportunity and noise

### Competitive Landscape

#### Enterprise Low-Code (Too expensive for our target)
| Product | Pricing | Gap |
|---------|---------|-----|
| OutSystems | $1,500+/mo | Priced for enterprise. Complex deployment. |
| Mendix | $2,000+/mo | SAP ecosystem. Heavy vendor lock-in. |
| Power Apps | $20/user/mo (adds up fast) | Microsoft ecosystem dependency. Limited customization. |

#### Mid-Market Internal Tools
| Product | Pricing | Gap |
|---------|---------|-----|
| Retool | $10-50/user/mo | No template system. Heavy JavaScript required. Cloud-dependent. |
| Appsmith | $40/user/mo | Docker-heavy setup. Limited component library. |
| Budibase | $5/user/mo | Limited data tools. No schema-driven generation. |
| Tooljet | $25/user/mo | Basic components. No visual designer. |

#### No-Code Builders
| Product | Pricing | Gap |
|---------|---------|-----|
| Bubble | $29-349/mo | Vendor lock-in. Can't export code. Performance issues at scale. |
| Webflow | $14-39/mo | Websites only, not business apps. |
| Glide | $25-250/mo | Mobile-first. Limited business logic. |

#### Where Webend Creator Fits

**Webend Creator occupies a unique position**: more powerful than no-code tools, more affordable than enterprise platforms, and more complete than mid-market internal tool builders.

Key differentiators no competitor offers:
1. **Schema → everything pipeline** — define once, generate forms, lists, validation, field rules
2. **Server-rendered visual designer** — designs render identically to production
3. **Data operations suite** — Query Manager, Data Compare, Index tools built in
4. **Web Pilots** — browser automation integrated into the platform
5. **Local AI** — WebLLM with knowledge base injection, no data leaves the client
6. **White labeling** — resell to your own clients under your brand
7. **Real code output** — templates produce standard HTML/Pongo2, not proprietary runtime

---

## Target Markets

### Primary: IT Consulting Firms (5-50 people)

**Profile**: Small to mid-size firms building custom business applications for clients. They do CRM, inventory, HR, ticketing, document management — the same patterns over and over.

**Pain points**:
- Rebuilding the same CRUD patterns for every client
- Can't afford enterprise tools like OutSystems
- Junior developers struggle with consistency
- Clients want changes fast, margins are thin
- AI-generated code is inconsistent and hard to maintain

**Value proposition**: "Build client applications 5x faster. Schema-driven development means your junior developers produce senior-quality output. White-label it as your own platform."

**Estimated market size**: 50,000+ firms in the US alone

### Secondary: Internal IT Departments (Mid-size companies, 100-1000 employees)

**Profile**: Companies with 2-5 internal developers managing business applications. Building HR tools, inventory systems, approval workflows, reporting dashboards.

**Pain points**:
- Spreadsheet hell — critical business data in Excel
- Can't justify enterprise platform costs
- Small team, big backlog
- Shadow IT — departments building their own solutions

**Value proposition**: "Replace spreadsheets with real applications. Your IT team can deliver 10 apps in the time it used to take to build 2."

### Tertiary: Automation-Heavy Industries

**Profile**: Insurance agencies, real estate firms, recruitment agencies, financial services — any business where staff manually logs into multiple websites daily to enter or retrieve data.

**Pain points**:
- Staff spend hours per day on repetitive website interactions
- Data entry errors across multiple portals
- No visibility into what was submitted where
- Can't scale without hiring more people

**Value proposition**: "Automate your portal interactions. Web Pilots log into carrier/MLS/job board websites, enter your data correctly every time, and report back. Turn hours of manual work into minutes of automated execution."

**This is potentially the HIGHEST-VALUE market** — automation ROI is immediate and measurable. An insurance agency spending 20 hours/week on manual quoting saves $50,000+/year.

### Quaternary: Digital Agencies

**Profile**: Agencies building web applications for clients. Need to deliver fast and maintain long-term.

**Pain points**:
- Project timelines are always tight
- Maintenance contracts need to be profitable
- Client changes are unpredictable
- Need consistent quality across projects

**Value proposition**: "Standardize your delivery platform. Every project uses the same architecture, components, and patterns. Maintenance becomes predictable."

---

## Pricing Strategy

### Subscription Tiers

| Tier | Monthly | Annual (save 17%) | Developers | Users | Features |
|------|---------|-------------------|------------|-------|----------|
| **Starter** | $250/mo | $2,500/yr | 2 | 25 | Core platform, 10 templates, community support |
| **Professional** | $500/mo | $5,000/yr | 5 | 100 | Unlimited templates, AI bot, web pilots, email support |
| **Business** | $1,000/mo | $10,000/yr | 10 | 500 | White labeling, custom themes, SSO, priority support |
| **Enterprise** | Custom | Custom | Unlimited | Unlimited | On-premise, dedicated support, training, SLA |

### Add-Ons
| Add-On | Price |
|--------|-------|
| Additional developer seat | $75/mo |
| Additional 100 users | $100/mo |
| White-label setup | $2,500 one-time |
| Custom theme design | $1,500 one-time |
| Training (remote, per day) | $1,500/day |
| Book: "Building with Webend Creator" | $49 (or included with Professional+) |

### Free Tier (Lead Generation)
- 1 developer, 5 users, 3 templates
- Enough to evaluate and build a proof-of-concept
- 30-day trial of Professional features
- Converts to paid when they need more capacity

### Why This Pricing Works
- **$250/mo** is less than 2 hours of a developer's time. If the platform saves even 1 day per month, it's 20x ROI.
- **Per-developer, not per-user** means clients of IT consultancies don't add cost.
- **Annual discount** encourages commitment and reduces churn.

---

## Go-to-Market Plan

### Phase 1: Foundation (Weeks 1-4)

**Goal**: Create the assets needed to sell.

1. **Landing page** (webendcreator.com)
   - Hero: "Build business applications 5x faster"
   - 90-second demo video
   - Feature grid with screenshots
   - Pricing table
   - "Start Free Trial" CTA

2. **Demo video** (5-10 minutes)
   - Start with a blank schema
   - Define a "Project Tracker" in LiteSpec (2 minutes)
   - Generate templates with TemplateCraft (1 minute)
   - Customize in the visual designer (3 minutes)
   - Show the working app with data (2 minutes)
   - Show Query Manager, Data Compare, Change Log (2 minutes)
   - End: "That was 10 minutes. How long does this take you today?"

3. **Documentation site**
   - Getting started guide
   - Schema reference (LiteSpec)
   - Component catalog (Wave CSS)
   - Template patterns
   - API reference

4. **Book**
   - Position as the comprehensive guide
   - Include with Professional tier and above
   - Sell separately at $49
   - Use as lead magnet (free chapter download)

### Phase 2: Launch (Weeks 5-8)

**Goal**: Get first 10 paying customers.

1. **Product Hunt launch**
   - Prepare screenshots, video, description
   - Coordinate upvotes from your network
   - Respond to every comment

2. **Hacker News** (Show HN)
   - Post: "Show HN: Webend Creator — Schema-driven app builder with visual designer"
   - Technical audience will appreciate the architecture (Go, HTMX, web components, MongoDB)

3. **LinkedIn campaign**
   - 3 posts per week for 4 weeks
   - Topics: "Why we chose HTMX over React", "Schema-driven development", "AI + deterministic code generation", "Building a CRM in 15 minutes"
   - Target: IT consultants, CTOs of small firms, freelance developers

4. **Direct outreach** (50 prospects)
   - Find IT consulting firms on Clutch.co, GoodFirms, LinkedIn
   - Email: "We help IT shops deliver client applications 5x faster. Free 30-day trial."
   - Follow up with a personalized demo
   - Offer white-glove onboarding for first 3 clients

5. **Dev community**
   - Dev.to articles: "How we built a visual designer with server rendering", "HTMX + Web Components: A love story"
   - Reddit: r/webdev, r/lowcode, r/golang, r/mongodb
   - HTMX Discord community
   - Web Components community

### Phase 3: Growth (Months 3-6)

**Goal**: Reach $5,000 MRR (20 Starter customers or equivalent).

1. **Content engine**
   - Weekly YouTube tutorials: "Build a [specific app] with Webend Creator"
   - Comparison articles: "Webend Creator vs Retool", "vs Budibase", "vs building from scratch"
   - Case studies from first customers

2. **Template marketplace**
   - Pre-built templates for common apps: CRM, inventory, ticketing, HR, project management
   - Customers can buy/download and customize
   - Community contributions

3. **Referral program**
   - Existing customers get 1 month free for each referral
   - IT consultancies can resell (white-label) with margin

4. **Webinars**
   - Monthly live demo + Q&A
   - "Build along" sessions
   - Guest speakers (customers sharing their experience)

5. **SEO**
   - Target keywords: "low code app builder", "internal tool builder", "CRUD app generator", "schema driven development", "MongoDB admin tool"
   - Long-tail: "how to build a CRM without coding", "alternative to Retool"

### Phase 4: Scale (Months 6-12)

**Goal**: Reach $20,000 MRR.

1. **Partnerships**
   - MongoDB partner program (you're built on MongoDB — this is a natural fit)
   - HTMX ecosystem (alignment with server-centric philosophy)
   - Go community (built with Go)
   - Cloud providers (deployment templates for AWS, GCP, DigitalOcean)

2. **Agency program**
   - Certified partner agencies get discounted licensing
   - Co-marketing opportunities
   - Access to enterprise features
   - Listed on Webend Creator partner directory

3. **Conference presence**
   - MongoDB.local events
   - Regional tech conferences
   - Small business technology expos

4. **Enterprise features**
   - Audit logging
   - Advanced RBAC
   - API gateway
   - Multi-tenant deployment
   - SOC 2 compliance documentation

---

## Web Pilots — Cloud Automation Platform

### What It Is

Web Pilots is a cloud-based browser automation service built into Webend Creator. Unlike simple scripting tools, Web Pilots integrate directly with your application data, credential vault, and notification system.

### How It Works

1. **Define a script** — Playwright-based JavaScript that navigates websites, fills forms, extracts data
2. **Connect your data** — Scripts load records from your MongoDB collections. Field mapping uses lookups to translate your data to the target site's format.
3. **Chain scripts** — Composition pattern lets parent scripts call child scripts with context. Build multi-step workflows.
4. **Run on schedule or demand** — Execute from the UI, via API, or on a cron schedule
5. **Get notified** — Email notifications on success or failure using your email templates

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Data-Driven** | Scripts load records from your collections. Use `load()`, `loadMany()`, `save()` to read/write application data. |
| **Lookup Mapping** | Map your field values to target site values. E.g., your "NC" → carrier's "North Carolina". Per-carrier, per-state lookup tables. |
| **Credential Vault** | `getCredentials("carrier_name")` — secure storage for usernames/passwords. Scripts never hardcode credentials. |
| **Composition** | Scripts call other scripts: `runScript(childScriptId, context)`. Pass data between steps. Build chains of 5, 10, 15+ automated steps. |
| **Error Handling** | Try/catch with automatic failure emails. Include error details, screenshots, elapsed time. |
| **Email Notifications** | Success/failure emails using your Pongo2 email templates. Customizable per script. |
| **Elapsed Time Tracking** | Know exactly how long each automation takes. Identify bottlenecks. |
| **Active/Inactive Control** | Enable or disable scripts without deleting them. Dev/staging/production status. |
| **Query Parameters** | Pass dynamic data to scripts: `?data_id=123&carrier=natgen`. Scripts access via `params`. |

### Real-World Use Case: Insurance Quoting

A single prospect record triggers automated quoting across 11 insurance carriers:

1. **Parent script** loads the prospect data (name, address, coverage needs)
2. For each carrier, it calls a **child script** (e.g., "Nat Gen", "Progressive", "Safeco")
3. Each child script:
   - Retrieves carrier-specific credentials from the vault
   - Loads carrier-specific field mappings from lookups
   - Navigates to the carrier's quoting portal
   - Logs in, fills the application form using mapped data
   - Extracts the quote (premium, coverage details)
   - Saves the quote back to the prospect record
   - Sends email notification with results
4. Total elapsed time: ~15 minutes for 11 carriers (vs. hours manually)

### Competitive Advantage

| Competitor | Pricing | Gap |
|------------|---------|-----|
| Zapier | $20-100/mo | Trigger-based only. No browser automation. No data integration. |
| Make (Integromat) | $9-34/mo | API-based. Can't interact with websites that don't have APIs. |
| Browserflow | $49-199/mo | Browser automation but no data integration, no composition. |
| Playwright (raw) | Free | Requires developers. No UI, no credentials vault, no email notifications. |
| UiPath | $420/mo | Enterprise RPA. Massive overhead for simple automations. |

**Webend Creator's Web Pilots are unique because they combine**:
- Browser automation (like Browserflow/UiPath)
- Data integration (like Zapier/Make)
- Credential management (like a password manager)
- Composition/chaining (like workflow engines)
- Email notifications (like monitoring tools)
- All inside the same platform where you build your applications

### Who Needs This

1. **Insurance agencies** — automated quoting across carriers
2. **Real estate firms** — automated listing submissions across MLS systems
3. **Recruitment agencies** — automated job posting across boards
4. **E-commerce** — automated price monitoring, inventory sync
5. **Finance** — automated report generation from banking portals
6. **Any business** that manually logs into websites to enter data or extract information

### Production Use Case: Insurance Agency Automation

Webend Creator is **currently deployed** at independent insurance agencies for automated carrier quoting and data entry. This is not theoretical — it's running in production today.

**The problem agencies face**:
- An agent receives a prospect inquiry (home, auto, commercial)
- They must manually log into 8-15 carrier portals (Progressive, Safeco, Nat Gen, etc.)
- Enter the same prospect data into each portal's unique form layout
- Wait for each quote, copy results back into their management system
- This takes 2-4 hours PER PROSPECT

**What Webend Creator does**:
- Agent enters prospect data ONCE into their Webend Creator app
- Clicks "Run Quotes"
- Web Pilots automatically:
  - Log into each carrier portal using stored credentials
  - Map prospect fields to each carrier's unique form layout (using lookup tables)
  - Fill and submit applications
  - Extract quotes (premium, coverage, deductible)
  - Save results back to the prospect record
  - Send email notifications with quote summaries
- **2-4 hours of manual work → 15 minutes of automated execution**

**Revenue impact for the agency**:
- Process 3-5x more prospects per day
- Reduce data entry errors (wrong coverage amounts, typos in addresses)
- Agents focus on selling, not typing
- New agents productive immediately (no carrier portal training needed)

### Standalone Product Opportunity: "Webend Automate"

The Web Pilots capability is compelling enough to be its own product for industries that don't need the full application builder:

| Product | Price | Target |
|---------|-------|--------|
| **Webend Automate — Starter** | $300/mo | 5 active scripts, 1 credential vault, email notifications |
| **Webend Automate — Professional** | $600/mo | 25 active scripts, unlimited credentials, composition chains, scheduled runs |
| **Webend Automate — Agency** | $1,000/mo | Unlimited scripts, multi-agent support, priority execution, custom email templates |
| **Webend Automate — Insurance Bundle** | $1,500/mo | Pre-built carrier scripts, prospect management app, quote comparison, agency dashboard |

The Insurance Bundle is particularly compelling — agencies get a turnkey solution, not a development platform. They don't need developers. They need quotes.

### Pricing Consideration

Within the Webend Creator platform:
- **Included with Professional tier** — basic automation (5 active scripts)
- **Automation add-on** — $200/mo for unlimited scripts, priority execution, scheduled runs

---

## Multi-App Platform — Compose Your Own Business Suite

### What It Is

Webend Creator isn't a single application — it's a platform for building and composing multiple applications under one roof. Each client gets their own business suite with custom apps, navigation, permissions, and visual identity.

### App Composition

| Capability | Description |
|------------|-------------|
| **App Picker** | Grid-style launcher (like Google Workspace) lets users switch between apps — Agents, Back Office, Security, Web Automations, etc. |
| **Per-App Navigation** | Each app defines its own menu items, routes, and landing page. Users only see apps and menu items they have permission to access. |
| **Custom Apps** | Clients create their own apps. An insurance agency might have: Prospects, Policies, Claims, Carriers, Reports, Automations. A construction company: Projects, Estimates, Invoices, Crew, Equipment. |
| **Cross-App References** | Templates can reference data from any collection. A prospect record links to quotes, policies, and change history across apps. |

### Permissions System

| Capability | Description |
|------------|-------------|
| **Role-Based Access** | Define roles (admin, agent, manager, viewer) with specific permissions per app and per action. |
| **App-Level Permissions** | Users see only the apps they're authorized for. The app picker filters automatically. |
| **Menu-Level Permissions** | Individual menu items can be restricted. An agent sees "Prospects" but not "System Settings." |
| **User Profiles** | Multiple profile types (developer, admin, agent) with different default permissions and UI layouts. |
| **Record-Level Control** | Templates can conditionally show/hide fields and actions based on user role. A viewer sees data but can't edit. |

### Theming & Visual Identity

| Capability | Description |
|------------|-------------|
| **40+ Built-In Themes** | oklch color system with automatic light/dark mode. Ocean, Royal, Forest, Sunset, Crimson, and more. |
| **Per-Client Branding** | Each deployment gets its own theme, logo, and color scheme. An insurance agency gets their brand colors; a construction company gets theirs. |
| **Runtime Theme Switching** | Users can switch themes on the fly via the theme selector. Preferences persist per user. |
| **CSS Variables** | Themes modify `--hue` and related variables. All components automatically adapt. Custom themes can be created by adjusting a single hue value. |
| **White-Label Ready** | Remove all Webend Creator branding. Deploy as "AgencyPro" or "BuildTrack" — whatever the client's brand demands. |

### Why This Matters

Most low-code platforms give you ONE application. Webend Creator gives you a **platform** — your clients get their own suite of interconnected business applications with their own branding, their own permissions, and their own navigation. This is what enterprise platforms like Salesforce charge thousands per month for.

**For IT consultancies**: Deploy one Webend Creator instance per client. Each client gets a branded, multi-app business suite. Charge $500-$2,000/mo per client for managed services. Your cost: one Business tier subscription ($1,000/mo) covers multiple client deployments.

**For agencies buying directly**: "This isn't a tool. It's YOUR platform. Your brand, your apps, your rules. We just provide the engine."

---

## The AI Strategy

### Current: "AI That Understands Your Application"

Most AI coding tools generate code in a vacuum. Webend Creator's AI is different:

1. **Knowledge Base Injection** — The AI bot loads your specific schemas, templates, and patterns. It doesn't guess — it knows your data model.

2. **Local LLM (WebLLM)** — Runs entirely in the browser. No data sent to external servers. HIPAA/SOC2-friendly by design.

3. **Deterministic + AI Hybrid** — TemplateCraft generates consistent, correct templates from schemas. AI assists with customization, not generation. You get reliability AND intelligence.

### Messaging

> "AI alone produces code that works today and breaks tomorrow. Webend Creator produces code that works today, tomorrow, and next year — and AI helps you customize it."

> "Your data never leaves your machine. Our AI runs locally, understands your schemas, and suggests — never overwrites."

### Future AI Features
- AI-powered schema suggestions ("You're building a CRM — here are the fields you probably need")
- Natural language to field rules ("When status is 'closed', disable the edit form")
- AI-assisted web pilot creation ("Automate the monthly report export")
- Schema migration suggestions ("You added a field — here's how to backfill existing records")

---

## White Label Program

### What It Includes
- Custom branding (logo, colors, app name)
- Custom theme
- Custom domain support
- Removal of Webend Creator branding
- Partner's branding on all user-facing pages

### Who It's For
- IT consultancies who want to offer a branded platform to their clients
- SaaS companies building vertical solutions (e.g., "RealEstate Manager" built on Webend Creator)
- Agencies offering ongoing managed services

### Pricing
- $2,500 one-time setup
- Business tier subscription ($1,000/mo) required
- Volume discounts for multi-instance deployments

---

## Sales Playbook

### Discovery Questions
1. "How many CRUD applications does your team build per year?"
2. "How long does a typical business application take from requirements to deployment?"
3. "What tools do you currently use? What's the monthly cost?"
4. "How do you handle field validation and business rules?"
5. "Do you have a standard architecture, or does each project start from scratch?"
6. "How much time do you spend on data operations — queries, comparisons, index tuning?"

### Objection Handling

**"We can just use AI to generate our apps."**
> "AI is great for suggestions, but it produces inconsistent code that needs constant fixing. Our schema-driven approach generates the same correct output every time. And our AI assistant understands YOUR specific schemas — it doesn't hallucinate."

**"We already have Retool/Budibase/etc."**
> "Those tools build one screen at a time. Webend Creator generates entire applications from a schema definition — forms, lists, validation, field rules, change tracking. Plus you get data operations tools, web automation, and AI — all in one platform."

**"It's too expensive."**
> "$250/month is less than 2 hours of a developer's time. If the platform saves your team even 1 day per month, that's 20x ROI. And unlike per-user pricing, your clients don't add cost."

**"We need to own the code."**
> "You do. Templates produce standard HTML with Pongo2. There's no proprietary runtime. Export your templates, and they work with any Go server that supports Pongo2."

**"What if you go out of business?"**
> "Your templates are standard HTML. Your data is in MongoDB. Your schemas are JSON. Nothing is locked in a proprietary format. But we're not going anywhere — we're growing."

### Ideal First Meeting Flow
1. Ask discovery questions (5 min)
2. Show the 10-minute demo video (10 min)
3. Build something live based on their domain (15 min)
4. Discuss pricing and trial (5 min)
5. Set up their trial instance (5 min)

---

## Key Metrics to Track

| Metric | Target (6 months) |
|--------|-------------------|
| Website visitors | 5,000/mo |
| Free trial signups | 100 |
| Trial → Paid conversion | 20% |
| Paying customers | 20 |
| MRR | $5,000-$10,000 |
| Churn rate | <5%/mo |
| NPS score | >50 |

---

## Immediate Next Steps

1. **This week**: Record the demo video. This is your #1 sales asset.
2. **Next week**: Launch landing page with pricing, features, and trial signup.
3. **Week 3**: Product Hunt + Hacker News launch.
4. **Week 4**: Start LinkedIn content and direct outreach to 50 prospects.
5. **Ongoing**: Publish the book, create template marketplace, build case studies.

---

## Resources

### The Book
- Comprehensive guide to building with Webend Creator
- Covers: schemas, templates, visual designer, field rules, data tools, web pilots, AI
- Position as the definitive reference
- Include with Professional tier, sell separately at $49
- Use free chapters as lead magnets

### Community
- Discord or Slack for customers and prospects
- GitHub discussions for technical questions
- Monthly office hours / webinars
- Template sharing and community contributions
