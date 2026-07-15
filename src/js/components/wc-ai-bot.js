/**
 *
 * References:
 * https://webllm.mlc.ai/
 * https://chat.webllm.ai/
 *
 */

import { WcBaseComponent } from './wc-base-component.js';
import { waveImport } from './helper-function.js';

if (!customElements.get('wc-ai-bot')) {
  // Global WebLLM management
  let webllmModule = null;
  let markedModule = null;
  let turnstileScriptPromise = null; // Shared Cloudflare Turnstile script loader (server mode)
  const loadedModels = new Map(); // Share models between bot instances
  const modelLoadingPromises = new Map(); // Prevent duplicate model loads
  
  class WcAiBot extends WcBaseComponent {
    static get observedAttributes() {
      return [
        'bot-id',
        'mode',
        'model',
        'provider',
        'endpoint',
        'turnstile-site-key',
        'hide-if-unavailable',
        'system-prompt',
        'title',
        'placeholder',
        'theme',
        'position',
        'auto-open',
        'max-height',
        'panel-width',
        'panel-height',
        'temperature',
        'max-tokens',
        'debug',
        'check-gpu-compatibility',
        'force-enable',
        'context-urls',
        'context-window-size',
        'query-context'
      ];
    }

    // Command definitions for assistant mode
    // Each command maps to the knowledge base sections it needs
    static ASSISTANT_COMMANDS = {
      '/create-schema': {
        description: 'Generate a LiteSpec schema definition',
        sections: {},
        systemPrompt: `You are a LiteSpec schema expert. Generate LiteSpec DSL schema definitions and explain your design choices.

CRITICAL SYNTAX RULES — follow EXACTLY:
- Block format: model Name object { ... } or def Name object { ... }
- NO "fields:" keyword — fields go directly inside braces
- Date fields are: string @format(date-time) @default("") — NOT "date-time" as a type
- ALL string fields must have @default("")
- Closing brace } on its own line
- @can, @if, @sort, @breadcrumb go on their own lines inside the block (no field name prefix)
- Do NOT include @ui annotations — layout is handled separately in views

CORRECT EXAMPLE — follow this structure exactly:

def Address object {
  street: string @required @minLength(1) @maxLength(25) @default("")
  city: string @required @minLength(1) @maxLength(25) @default("")
  state: string @required @default("")
  postal_code: string @required @minLength(1) @maxLength(12) @default("")
  @can(view: "@self", add: "admin editor", edit: "admin editor", delete: "@self agent")
}

def Member object {
  first_name: string @required @minLength(2) @maxLength(10) @default("")
  middle_initial: string @minLength(1) @maxLength(3) @default("")
  last_name: string @minLength(2) @maxLength(10) @default("")
  @can(view: "@self", add: "admin editor", edit: "admin editor", delete: "@self agent")
}

model Client object {
  first_name: string @required @minLength(2) @maxLength(10) @default("")
  last_name: string @required @minLength(2) @maxLength(10) @default("")
  email: string @email @default("")
  phone_number: string @default("")
  gender: string @required @enum(male,female) @default("")
  age: integer @minimum(14) @exclusiveMaximum(130)
  license_date: string @format(date-time) @default("")
  address: object @ref(Address) @required
  household_members: array(@ref(Member)) @minItems(0) @uniqueItems
  household_income: number @required @minimum(30000) @maximum(999999) @can(view: "finance", edit: "finance")
  tags: array(string) @uniqueItems @can(view: "admin", add: "admin", edit: "admin", delete: "admin")
  created_by: string @default("")
  created_date: string @format(date-time) @default("")
  modified_by: string @default("")
  modified_date: string @format(date-time) @default("")
  is_active: boolean @required @default(true)

  @if(age: @minimum(16), @required(license_date))
  @if(gender: @enum("male", "female"), @required(tags))
  @if(modified_by: @minLength(1) @maxLength(99), @required(modified_date))
  @can(view: "@self admin", add: "admin", edit: "admin editor", delete: "admin")
}

KEY PATTERNS:
- Nested objects: address: object @ref(Address) @required
- Arrays of objects: items: array(@ref(TypeName)) @minItems(0) @uniqueItems
- Arrays of primitives: tags: array(string) @uniqueItems
- Field-level permissions inline: salary: number @can(view: "finance", edit: "finance")
- Collection-level permissions on own line: @can(view: "@self admin", add: "admin", edit: "admin editor", delete: "admin")
- Conditional rules: @if(field: @condition, @required(other_field))
- Always include audit fields: created_by, created_date, modified_by, modified_date, is_active
- Always include: @if(modified_by: @minLength(1) @maxLength(99), @required(modified_date))
- Integers and numbers do NOT get @default("")
- @sort(created_date, desc) and @breadcrumb(display_field, - EntityName) are optional but recommended

After generating the schema, briefly explain your design choices.`
      },
      '/create-template': {
        description: 'Generate a Go Kart template — say "list" or "edit" or both',
        sections: {},
        systemPrompt: `You are a Go Kart template expert. The user will ask for a "list" template, an "edit/form" template, or both. Generate Content tab (HTML) and Code tab (JavaScript). Use /create-list or /create-edit for faster, focused generation.
The model name = collection name = schema slug (e.g., model Article → collection "article").

RULES:
- List slug: COLLECTION_list. Edit slug: COLLECTION.
- List: wc-table-skeleton + wc-tabulator with ajax-url, linkFormatter columns, header-filter on all columns
- Edit: wc-article-skeleton + wc-form with hx-{{FormMethod}}, meta_fields, wc-save-split-button, wc-hotkey
- Code: rdx.ConnName/rdx.DBName, SaveAndValidate, CreateNew for "create"
- depends: ["base", "loader", "partial-base"]
- After generating, list the template properties needed (slug, schema, route_prefix, depends, template_type, route_prev/next_template_slug)`
      },
      '/create-list': {
        description: 'Generate a Go Kart list template',
        sections: {},
        systemPrompt: `You are a Go Kart template expert. Generate a LIST template with Content tab (HTML) and Code tab (JavaScript).
The model name = collection name = schema slug (e.g., model Article → collection "article").
List slug convention: COLLECTION_list (e.g., article_list).

=== EXAMPLE (Content Tab) ===
{% extends "__template_name__" %}
{% block pageContent %}
<wc-table-skeleton _="on 'wctabulatorready' from body
                      WaveHelpers.waitForThenHideAndShow('#table-skeleton', '.page-content', 3000, 500)
                   end">
</wc-table-skeleton>
<div class="page-content flex flex-col flex-1 py-2 px-3 gap-1 hidden">
  <wc-breadcrumb>
    <wc-breadcrumb-item label="" link="/{{ Template.RoutePrefix }}/home"></wc-breadcrumb-item>
    <wc-breadcrumb-item label="Article" link=""></wc-breadcrumb-item>
  </wc-breadcrumb>
  <div class="card">
    <div class="flex flex-col flex-1" hx-boost="true" hx-target="#viewport" hx-swap="innerHTML transition:true" hx-push-url="true" hx-indicator="#content-loader">
      <div class="row justify-end items-center mb-2">
        <a class="underline cursor-pointer" href="/{{ Template.RoutePrefix }}/{{ Template.RouteNextTemplateSlug }}/create">Add New</a>
      </div>
      <div class="row gap-4">
        <wc-tabulator class="w-full rounded" id="article-table"
          ajax-url="/api/article?schema_slug={{Template.Schema}}"
          initial-sort='[{"column":"modified_date","dir":"desc"}]'
          placeholder="No Data Available" movable-columns="true"
          row-height="40" pagination pagination-size="16" pagination-counter="rows"
          header-visible="true" layout="fitColumns">
          <wc-tabulator-func name="onDelete">
            (result) => { wc.Prompt.toast({title: 'Delete successful!', type: 'success'}); }
          </wc-tabulator-func>
          <wc-tabulator-column field="title" title="Title"
            header-filter="input" header-filter-func="starts" header-menu="headerMenu"
            formatter="linkFormatter"
            formatter-params='{ "routePrefix": "{{ Template.RoutePrefix }}", "template": "{{ Template.RouteNextTemplateSlug }}", "url": "urlFormatter" }'
            visible="true"></wc-tabulator-column>
          <wc-tabulator-column field="category" title="Category"
            header-filter="input" header-filter-func="starts" header-menu="headerMenu"
            formatter="linkFormatter"
            formatter-params='{ "routePrefix": "{{ Template.RoutePrefix }}", "template": "{{ Template.RouteNextTemplateSlug }}", "url": "urlFormatter" }'
            visible="true"></wc-tabulator-column>
          <wc-tabulator-column field="modified_date" title="Modified Date"
            header-filter="input" header-filter-func="starts" header-menu="headerMenu"
            formatter="linkDateTimeFormatter"
            formatter-params='{ "routePrefix": "{{ Template.RoutePrefix }}", "template": "{{ Template.RouteNextTemplateSlug }}", "url": "urlFormatter" }'
            visible="true"></wc-tabulator-column>
          <wc-tabulator-column field="is_active" title="Is Active?"
            formatter="tickCross" header-filter="tickCross"
            header-filter-params='{"tristate":true}' header-menu="headerMenu"
            visible="false"></wc-tabulator-column>
        </wc-tabulator>
      </div>
    </div>
  </div>
</div>
{% endblock %}

=== EXAMPLE (Code Tab) ===
function runList() {
  let records = [];
  return {records};
}

=== RULES ===
- Replace "article" with the actual collection name from the user's request
- Replace "Article" with the display name
- ajax-url="/api/COLLECTION?schema_slug={{Template.Schema}}"
- Every column needs: header-filter="input", header-filter-func="starts", header-menu="headerMenu"
- Link columns: formatter="linkFormatter" with formatter-params containing routePrefix, template, url: "urlFormatter"
- Date columns: formatter="linkDateTimeFormatter"
- Boolean columns: formatter="tickCross", header-filter="tickCross", header-filter-params='{"tristate":true}'
- depends: ["base", "loader", "partial-base"]
- After generating, list template properties: slug, schema, route_prefix, depends, template_type, route_next_template_slug`
      },
      '/create-edit': {
        description: 'Generate a Go Kart edit/form template',
        sections: {},
        systemPrompt: `You are a Go Kart template expert. Generate an EDIT/FORM template with Content tab (HTML) and Code tab (JavaScript).
The model name = collection name = schema slug (e.g., model Article → collection "article").
Edit slug convention: COLLECTION (e.g., article). List slug: COLLECTION_list.

=== EXAMPLE (Content Tab) ===
{% extends "__template_name__" %}
{% block css %}{% endblock %}
{% block pageContent %}
<wc-article-skeleton _="on load WaveHelpers.waitForThenHideAndShow('#article-skeleton', '.page-content', 3000, 500) end"></wc-article-skeleton>
<div class="page-content flex flex-col flex-1 py-2 px-3 gap-2 hidden">
  <div class="flex flex-row gap-3 justify-between items-center">
    <wc-breadcrumb>
      <wc-breadcrumb-item label="" link="/v/home"></wc-breadcrumb-item>
      <wc-breadcrumb-item label="Article" link="/x/{{ Template.RoutePrevTemplateSlug }}/list"></wc-breadcrumb-item>
      <wc-breadcrumb-item label="{{ Record.title }}" link=""></wc-breadcrumb-item>
    </wc-breadcrumb>
    <div class="flex flex-row items-center gap-3">
      <wc-save-split-button method="{{ FormMethod }}" form="form#article" hx-include="form#article"
        save-url="/x/article/{{ RecordID }}" save-new-url="/x/article/create"
        save-return-url="/x/article_list/list">
      </wc-save-split-button>
    </div>
  </div>
  <wc-tab class="col-1 mt-2 mb-4" animate="">
    <wc-tab-item class="active" label="General">
      <div class="col-1 gap-2 pt-2 pb-5 px-5">
        <wc-form class="col gap-3" method="{{ FormMethod }}" id="article" hx-{{FormMethod}}="/x/article/{{ RecordID }}">
          {% include "meta_fields" %}
          <div class="row gap-4">
            <wc-input name="title" lbl-label="Title" class="col-1" value="{{ Record.title }}" required></wc-input>
            <wc-select name="category" lbl-label="Category" class="col-1" value="{{ Record.category }}" required>
              <option value="">Choose...</option>
              <option value="news">News</option>
              <option value="blog">Blog</option>
              <option value="tutorial">Tutorial</option>
              <option value="announcement">Announcement</option>
            </wc-select>
          </div>
          <div class="row gap-4">
            <wc-input name="release_date" lbl-label="Release Date" class="col-1" type="date" value="{{ Record.release_date }}"></wc-input>
            <wc-input name="is_active" lbl-label="Is Active" class="col" type="checkbox" toggle-switch {% if Record.is_active %} checked="" {% endif %}></wc-input>
          </div>
          <hr class="my-4" />
          <div class="row gap-4">
            <wc-textarea name="description" lbl-label="Description" class="col-1" rows="6">{{ Record.description }}</wc-textarea>
          </div>
          <wc-hotkey keys="ctrl+s" target="button.save-btn"></wc-hotkey>
        </wc-form>
      </div>
    </wc-tab-item>
    <wc-tab-item label="Change Log">
      <div class="col-1 gap-2 pt-2 pb-5 px-5">
        {% if RecordID != "create" %}
        <div hx-get="/x/change_log?collection=article&original_id={{ RecordID }}" hx-trigger="revealed" hx-swap="innerHTML" hx-indicator="#content-loader" hx-push-url="false">
          Loading change history...
        </div>
        {% else %}
        <div class="text-center p-4 text-muted">Save the record to view change history</div>
        {% endif %}
      </div>
    </wc-tab-item>
  </wc-tab>
</div>
{% endblock %}

=== EXAMPLE (Code Tab) ===
function runGet() {
  let collection = 'article';
  if (ctx.RecordID === 'create') {
    let record = ctx.DB.CreateNew(rdx.ConnName, rdx.DBName, 'article');
    return {record};
  }
  let record = ctx.DB.FindByID(rdx.ConnName, rdx.DBName, collection, ctx.RecordID);
  return {record};
}
function runPut() {
  let collection = 'article';
  let id = ctx.RecordID;
  id = ctx.DB.SaveAndValidate(rdx.ConnName, rdx.DBName, collection, id, form, 'article', [], []);
  if (id === '') { id = ctx.RecordID; }
  let record = ctx.DB.FindByID(rdx.ConnName, rdx.DBName, collection, id);
  ctx.App.Session.Put(ctx.Request.Context(), 'flash', 'Save successful!');
  return {record};
}
function runPost() {
  let collection = 'article';
  let id = ctx.RecordID;
  id = ctx.DB.SaveAndValidate(rdx.ConnName, rdx.DBName, collection, id, form, 'article', [], []);
  let record = ctx.DB.FindByID(rdx.ConnName, rdx.DBName, collection, id);
  ctx.App.Session.Put(ctx.Request.Context(), 'flash', 'Save successful!');
  return {record};
}
function runDelete() {
  let collection = 'article';
  let id = ctx.RecordID;
  ctx.DB.DeleteByID(rdx.ConnName, rdx.DBName, collection, id);
  return {success: true};
}

=== RULES ===
- Replace "article" with the actual collection name throughout ALL code
- Replace "Article" with the display name
- LAYOUT: Always wrap form in wc-tab with "General" and "Change Log" tabs. Use "row gap-4" for horizontal field pairs with "col-1" on each field. Use "hr class=my-4" between sections. Use fieldset with legend for nested objects. Use wc-textarea full-width in its own row for long text.
- Use rdx.ConnName/rdx.DBName — NEVER raw session calls
- In SaveAndValidate, the schema slug must be the collection name as a string like 'article' — NOT a variable name. The last two args are arrays for tag and array fields, use [] if none.
- depends: ["base", "loader", "partial-base"]
- Always include wc-hotkey keys="ctrl+s" and {% include "meta_fields" %}
- Component mapping: string→wc-input, email→wc-input type="email", enum→wc-select with options, boolean→wc-input type="checkbox" toggle-switch, multiline→wc-textarea (full width), date→wc-input type="date", tel→wc-input type="tel", currency→wc-input type="currency"
- After generating, list template properties: slug, schema, route_prefix, depends, template_type, route_prev_template_slug`
      },
      '/create-screen': {
        description: 'Generate full screen: schema + form + list + field rules',
        sections: {},
        systemPrompt: `You are a Go Kart full-stack expert. Generate a complete screen: LiteSpec schema, form template (Content + Code tabs), list template, and field rules. Follow all LiteSpec and Go Kart conventions. Use Wave CSS components for the UI.`
      },
      '/create-component': {
        description: 'Generate a new Wave CSS web component',
        sections: {},
        systemPrompt: `You are a Wave CSS component expert. Generate new web components following the library architecture:
- Extend WcBaseComponent (or WcBaseFormComponent for form inputs)
- No Shadow DOM — use regular DOM with classList.add('contents')
- Define static get is(), observedAttributes, _render(), _handleAttributeChange(), _applyStyle()
- Support HTMX via htmx.process(this)
- Use CSS variables for theming`
      },
      '/create-web-pilot': {
        description: 'Generate a Playwright automation script chain',
        sections: {},
        systemPrompt: `You are a Go Kart Web Pilot expert. Generate Playwright automation scripts using the composition pattern:
- Code tab: load data via load(), loadMany(), getCredentials(). Set up context.mapSourceToTarget() for value mapping.
- Script tab: page.goto(), page.fill(), page.selectOption(), page.click(), page.screenshot()
- Composition: {% include 'page_script_slug' %} with {% if %} for state/type variations
- Auth check: Promise.race pattern for login detection
- Naming: {carrier}_{page}_{state} (e.g., nat_gen_drivers_page_nc)`
      },
      '/query': {
        description: 'Generate a MongoDB query from natural language',
        sections: {},
        systemPrompt: `You are a MongoDB query expert. Generate MongoDB find queries or aggregation pipelines from natural language descriptions.

OUTPUT FORMAT — respond ONLY with the labeled fenced blocks below. Do NOT use a \`json\` block.

For FIND queries, output up to three labeled blocks:
\`\`\`query
{ "field": "value" }
\`\`\`
\`\`\`projection
{ "field": 1 }
\`\`\`
\`\`\`sort
{ "field": 1 }
\`\`\`

For AGGREGATION pipelines, output a single labeled block:
\`\`\`pipeline
[
  { "$match": { ... } },
  { "$group": { ... } }
]
\`\`\`

CRITICAL SHAPE: the query object uses field names as keys directly — e.g. { "status": "shipped" }, NEVER { "field": "status", "value": "shipped" }.

EXAMPLES:

Input: orders with status shipped
\`\`\`query
{ "status": "shipped" }
\`\`\`

Input: active users in NC, newest first, show name and email
\`\`\`query
{ "address.state": "NC", "active": true }
\`\`\`
\`\`\`projection
{ "name": 1, "contact.email": 1 }
\`\`\`
\`\`\`sort
{ "createdAt": -1 }
\`\`\`

RULES:
- Respond ONLY with the labeled query/projection/sort (or pipeline) fenced blocks. Do NOT use a \`json\` block or an unlabeled block.
- Output ONLY valid MongoDB JSON — no JavaScript, no comments
- Use standard MongoDB query operators: $gt, $gte, $lt, $lte, $in, $nin, $regex, $exists, $ne, $or, $and, $not, $elemMatch
- For dates, use ISO 8601 strings: { "$gte": "2026-01-01T00:00:00Z" }
- For case-insensitive text search, use $regex with $options: "i"
- For "contains" searches, use $regex: "pattern"
- For array fields, use $elemMatch for sub-document conditions
- For counting, grouping, or "top N" requests, use an aggregation pipeline
- Always include $match early in pipelines to reduce documents before grouping
- Use $ifNull to handle missing array fields: { "$ifNull": ["$arrayField", []] }
- Projection: use 1 to include, 0 to exclude. Don't mix include/exclude (except _id)
- Sort: 1 for ascending, -1 for descending
- CRITICAL: Always use the EXACT full dotted field path from the field list (e.g., "address.state" NOT "state", "contact.email" NOT "email"). Never shorten or simplify field paths.
- After the JSON blocks, briefly explain what the query does

If the user's request is ambiguous, generate the most likely interpretation and note your assumption.`
      },
      '/help': {
        description: 'Show available commands',
        sections: {},
        systemPrompt: ''
      }
    };

    // Known hardware configurations
    static KNOWN_CAPABLE_CONFIGS = [
      // Apple Silicon - excellent WebLLM support
      { gpu: /Apple M[1-4]/, capability: 'high', name: 'Apple Silicon' },
      
      // High-end NVIDIA GPUs (RTX 30/40 series)
      { gpu: /RTX [34]0[6-9]0/, capability: 'high', name: 'NVIDIA RTX High-end' },
      { gpu: /RTX [34]0[7-8]0/, capability: 'high', name: 'NVIDIA RTX High-end' },
      
      // Mid-range NVIDIA GPUs
      { gpu: /RTX [34]0[5-6]0/, capability: 'medium', name: 'NVIDIA RTX Mid-range' },
      { gpu: /RTX 20[7-8]0/, capability: 'medium', name: 'NVIDIA RTX 20 Series' },
      { gpu: /GTX 16[6-8]0/, capability: 'low', name: 'NVIDIA GTX 16 Series' },
      
      // AMD GPUs (limited WebGPU support)
      { gpu: /Radeon RX 6[7-9]00/, capability: 'medium', name: 'AMD Radeon RX 6000' },
      { gpu: /Radeon RX 7[7-9]00/, capability: 'medium', name: 'AMD Radeon RX 7000' },
      
      // Known problematic hardware
      { gpu: /Intel.*HD Graphics/, capability: 'none', name: 'Intel HD Graphics' },
      { gpu: /Intel.*UHD Graphics/, capability: 'none', name: 'Intel UHD Graphics' },
      { gpu: /Intel.*Iris/, capability: 'low', name: 'Intel Iris' },
      { gpu: /Radeon Vega/, capability: 'low', name: 'AMD Radeon Vega' },
      { gpu: /GeForce MX/, capability: 'none', name: 'NVIDIA GeForce MX' }
    ];

    constructor() {
      super();
      
      // Internal state
      this._messages = [];
      this._isLoading = false;
      this._activeController = null;    // AbortController for the in-flight turn (supersede/recover)
      this._isModelReady = false;
      this._isMinimized = true;
      this._error = null;
      this._engine = null;
      this._provider = null;           // resolved backend: 'webllm' | 'gemini-nano' | 'server'
      this._modelProgress = 0;
      this._sessionId = null;          // stable per-instance id for server mode
      this._turnstileWidgetId = null;  // Cloudflare Turnstile widget handle (server mode)
      // Async init (model load): resolve the base `ready` promise manually once the
      // model is ready (or a terminal error/unsupported state is reached).
      this._deferReady = true;
      this._isUnsupported = false;
      this._unsupportedReason = '';

      // Assistant mode state
      this._knowledgeBases = {};       // Loaded KB data keyed by name
      this._knowledgeBasesLoaded = false;
      this._activeCommand = null;      // Current command being processed

      // Bind methods
      this._handleSend = this._handleSend.bind(this);
      this._handleKeydown = this._handleKeydown.bind(this);
      this._handleToggle = this._handleToggle.bind(this);
      this._handleClose = this._handleClose.bind(this);
    }

    static get is() {
      return 'wc-ai-bot';
    }

    async _render() {
      this.classList.add('contents');

      // Optionally remove the component entirely when Gemini Nano can't run on this
      // device (e.g. non-Chrome browsers, or hardware without built-in AI). Intended
      // to pair with provider="gemini-nano" for Nano-only experiences.
      if (this.getAttribute('hide-if-unavailable') === 'true') {
        const nano = await this._isGeminiNanoAvailable();
        if (nano === 'unavailable') {
          this._hideUnavailable();
          return;
        }
      }

      // Resolve which inference backend to use before any capability gating.
      this._provider = await this._resolveProvider();

      // Check system capabilities before rendering. Gemini Nano runs via Chrome's
      // on-device model component (not WebGPU) and the server backend runs no model in
      // the browser at all, so the GPU compatibility gate only applies to WebLLM.
      const checkGPU = this.getAttribute('check-gpu-compatibility') !== 'false';
      if (this._provider !== 'gemini-nano' && this._provider !== 'server'
          && checkGPU && !(await this._checkSystemCapabilities())) {
        // System doesn't meet requirements - render minimal fallback UI
        this._renderUnsupportedUI();
        return;
      }
      
      const title = this.getAttribute('title') || 'AI Assistant';
      const placeholder = this.getAttribute('placeholder') || 'Type your message...';
      
      // Create bot container
      this._container = document.createElement('div');
      this._container.className = 'wc-ai-bot-container';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'wc-ai-bot-header';
      header.innerHTML = `
        <div class="wc-ai-bot-header-title">
          <wc-fa-icon name="robot" icon-style="solid" size="1.2rem" class="mr-2"></wc-fa-icon>
          <span>${title}</span>
        </div>
        <div class="wc-ai-bot-header-actions">
          <button class="wc-ai-bot-toggle" aria-label="Toggle chat">
            <wc-fa-icon name="minus" icon-style="solid" size="1rem"></wc-fa-icon>
          </button>
          <button class="wc-ai-bot-close" aria-label="Close chat">
            <wc-fa-icon name="xmark" icon-style="solid" size="1rem"></wc-fa-icon>
          </button>
        </div>
      `;
      
      // Create messages container
      this._messagesContainer = document.createElement('div');
      this._messagesContainer.className = 'wc-ai-bot-messages';
      
      // Create input container
      const inputContainer = document.createElement('div');
      inputContainer.className = 'wc-ai-bot-input-container';
      
      this._input = document.createElement('textarea');
      this._input.className = 'wc-ai-bot-input';
      this._input.placeholder = placeholder;
      this._input.rows = 2;
      
      this._sendButton = document.createElement('button');
      this._sendButton.className = 'wc-ai-bot-send';
      this._sendButton.innerHTML = '<wc-fa-icon name="paper-plane" icon-style="solid" size="1rem"></wc-fa-icon>';
      this._sendButton.disabled = true;
      
      inputContainer.appendChild(this._input);
      inputContainer.appendChild(this._sendButton);
      
      // Assemble container
      this._container.appendChild(header);
      this._container.appendChild(this._messagesContainer);
      this._container.appendChild(inputContainer);
      
      // Add status bar for model loading
      this._statusBar = document.createElement('div');
      this._statusBar.className = 'wc-ai-bot-status';
      this._container.appendChild(this._statusBar);
      
      this.appendChild(this._container);
      
      // Create FAB button for bubble theme
      if (this.getAttribute('theme') === 'bubble' || !this.getAttribute('theme')) {
        this._fab = document.createElement('button');
        this._fab.className = 'wc-ai-bot-fab';
        this._fab.setAttribute('aria-label', 'Open chat');
        this._fab.innerHTML = '<wc-fa-icon name="message" icon-style="solid" size="1.5rem"></wc-fa-icon>';
        this._fab.addEventListener('click', () => {
          this._isMinimized = false;
          this.classList.add('wc-ai-bot--open');
          this._fab.style.display = 'none';
          setTimeout(() => this._input.focus(), 100);
        });
        this.appendChild(this._fab);
      }
      
      // Apply styles
      this._applyStyles();
      
      // Add event listeners
      this._sendButton.addEventListener('click', this._handleSend);
      this._input.addEventListener('keydown', this._handleKeydown);
      this._input.addEventListener('input', () => this._adjustInputHeight());
      
      const toggleBtn = this._container.querySelector('.wc-ai-bot-toggle');
      if (toggleBtn) toggleBtn.addEventListener('click', this._handleToggle);
      
      const closeBtn = this._container.querySelector('.wc-ai-bot-close');
      if (closeBtn) closeBtn.addEventListener('click', this._handleClose);
      
      // Initialize model
      await this._initializeModel();
      
      // Load marked for markdown parsing
      if (!markedModule) {
        try {
          const module = await waveImport('https://cdn.jsdelivr.net/npm/marked@4/lib/marked.esm.js');
          markedModule = module;
          console.log('[wc-ai-bot] Marked module loaded successfully');
        } catch (error) {
          console.error('[wc-ai-bot] Failed to load marked module:', error);
        }
      }
      
      // Load knowledge bases for assistant mode
      if (this._isAssistantMode()) {
        await this._loadKnowledgeBases();
      }

      // Auto-open if specified
      if (this.getAttribute('auto-open') === 'true') {
        this._isMinimized = false;
        this.classList.add('wc-ai-bot--open');
        if (this._fab) {
          this._fab.style.display = 'none';
        }
      }

      // Add initial message
      this._addMessage('bot', this._getWelcomeMessage());
    }

    _applyStyles() {
      const style = `
        wc-ai-bot {
          display: contents;
        }

        /* Base container styles */
        .wc-ai-bot-container {
          display: flex;
          flex-direction: column;
          background: var(--component-bg-color);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        /* Header styles */
        .wc-ai-bot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--primary-bg-color);
          color: var(--primary-color);
        }

        .wc-ai-bot-header-title {
          display: flex;
          align-items: center;
          font-weight: 600;
        }

        .wc-ai-bot-header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .wc-ai-bot-header button {
          background: transparent;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: opacity 0.2s;
        }

        .wc-ai-bot-header button:hover {
          opacity: 0.8;
        }

        /* Messages container */
        .wc-ai-bot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          min-height: 200px;
          max-height: 400px;
          background: var(--component-bg-color);
        }

        /* Message styles */
        .wc-ai-bot-message {
          margin-bottom: 1rem;
          display: flex;
        }

        .wc-ai-bot-message--user {
          justify-content: flex-end;
        }

        .wc-ai-bot-message--bot {
          justify-content: flex-start;
        }

        .wc-ai-bot-message-bubble {
          max-width: 80%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          word-wrap: break-word;
          overflow-wrap: anywhere;
        }

        .wc-ai-bot-message--user .wc-ai-bot-message-bubble {
          /* Theme surface + on-surface text so contrast follows the active light/dark theme.
             A light accent tint marks the bubble as "mine" without hurting readability. */
          background: color-mix(in srgb, var(--accent, var(--primary-bg-color)) 16%, var(--surface-3, var(--component-bg-color)));
          color: var(--text-1, var(--component-color));
          /* Preserve the user's own line breaks; bot bubbles hold rendered markdown
             where pre-wrap would surface marked's inter-element newlines as big gaps. */
          white-space: pre-wrap;
        }

        .wc-ai-bot-message--bot .wc-ai-bot-message-bubble {
          background: var(--surface-2, var(--component-bg-color));
          color: var(--text-1, var(--component-color));
          border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
        }

        /* Links in rendered answers read against the (surface) bubble background. */
        .wc-ai-bot-message-bubble a {
          color: var(--accent, var(--primary-color));
          text-decoration: underline;
          font-weight: 500;
          overflow-wrap: anywhere;
        }

        /* Markdown content styling */
        .wc-ai-bot-message-bubble p {
          margin: 0 0 0.5rem 0;
        }
        
        .wc-ai-bot-message-bubble p:last-child {
          margin-bottom: 0;
        }
        
        .wc-ai-bot-message-bubble ul,
        .wc-ai-bot-message-bubble ol {
          margin: 0.25rem 0;
          padding-left: 1.35rem;
        }

        /* Nested lists sit snug against their parent item. */
        .wc-ai-bot-message-bubble li > ul,
        .wc-ai-bot-message-bubble li > ol {
          margin: 0.1rem 0 0.1rem 0;
        }

        .wc-ai-bot-message-bubble li {
          margin: 0.15rem 0;
          overflow-wrap: anywhere;
        }

        /* GFM tables: bordered, padded, shaded header, horizontal scroll on overflow
           so wide cells don't squish inside the panel. Theme-safe via currentColor mix. */
        .wc-ai-bot-message-bubble table {
          border-collapse: collapse;
          display: block;
          overflow-x: auto;
          max-width: 100%;
          margin: 0.5rem 0;
          font-size: 0.85em;
        }

        .wc-ai-bot-message-bubble th,
        .wc-ai-bot-message-bubble td {
          border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
          padding: 0.4rem 0.6rem;
          text-align: left;
          white-space: nowrap;
          vertical-align: top;
        }

        .wc-ai-bot-message-bubble th {
          background: color-mix(in srgb, currentColor 10%, transparent);
          font-weight: 600;
        }

        .wc-ai-bot-message-bubble pre {
          background: var(--code-bg-color, color-mix(in srgb, currentColor 12%, transparent));
          padding: 0.5rem;
          border-radius: 0.25rem;
          overflow-x: auto;
          margin: 0.5rem 0;
        }

        .wc-ai-bot-message-bubble code {
          background: var(--code-bg-color, color-mix(in srgb, currentColor 12%, transparent));
          padding: 0.125rem 0.25rem;
          border-radius: 0.125rem;
          font-size: 0.875em;
          overflow-wrap: anywhere;
        }

        .wc-ai-bot-message-bubble pre code {
          background: none;
          padding: 0;
          /* Fenced blocks keep their own whitespace and scroll rather than wrap. */
          white-space: pre;
          overflow-wrap: normal;
        }

        /* Code block language labels */
        .wc-ai-bot-message-bubble pre code[class*="language-"]::before {
          display: block;
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.6;
          margin-bottom: 0.25rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.15);
        }
        .wc-ai-bot-message-bubble pre code.language-query::before { content: 'Query'; }
        .wc-ai-bot-message-bubble pre code.language-projection::before { content: 'Projection'; }
        .wc-ai-bot-message-bubble pre code.language-sort::before { content: 'Sort'; }
        .wc-ai-bot-message-bubble pre code.language-pipeline::before { content: 'Pipeline'; }
        .wc-ai-bot-message-bubble pre code.language-javascript::before { content: 'JavaScript'; }
        .wc-ai-bot-message-bubble pre code.language-json::before { content: 'JSON'; }
        .wc-ai-bot-message-bubble pre code.language-html::before { content: 'HTML'; }
        .wc-ai-bot-message-bubble pre code.language-css::before { content: 'CSS'; }
        .wc-ai-bot-message-bubble pre code.language-go::before { content: 'Go'; }
        .wc-ai-bot-message-bubble pre code.language-python::before { content: 'Python'; }
        .wc-ai-bot-message-bubble pre code.language-bash::before { content: 'Bash'; }
        .wc-ai-bot-message-bubble pre code.language-sql::before { content: 'SQL'; }

        /* Code block copy button */
        .wc-ai-bot-code-wrapper {
          position: relative;
        }

        .wc-ai-bot-copy-btn {
          position: absolute;
          top: 0.375rem;
          right: 0.375rem;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          border-radius: 0.25rem;
          color: inherit;
          cursor: pointer;
          padding: 0.25rem 0.375rem;
          opacity: 0;
          transition: opacity 0.2s, background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }

        .wc-ai-bot-code-wrapper:hover .wc-ai-bot-copy-btn {
          opacity: 1;
        }

        .wc-ai-bot-copy-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Transparent background for loading bubbles */
        .wc-ai-bot-message-bubble--loading {
          background: transparent !important;
          padding: 0 !important;
          display: flex;
          flex: 1 1 0%;
          justify-content: center;
          align-items: center;
          min-width: 100px;
          min-height: 60px;
        }

        /* Input container */
        .wc-ai-bot-input-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 0 1rem 1rem;
          border-top: 1px solid var(--border-color);
          background: var(--component-bg-color);
        }

        .wc-ai-bot-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          background: var(--input-bg-color);
          color: var(--input-color);
          resize: none;
          font-family: inherit;
          font-size: 0.875rem;
          line-height: 1.25rem;
          min-height: 3.5rem;
          max-height: 120px;
        }

        .wc-ai-bot-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-color-alpha);
        }

        .wc-ai-bot-send {
          padding: 0.5rem 0.75rem;
          /*
          background: var(--primary-color);
          color: var(--primary-contrast-color);
          */
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: center;
          flex-shrink: 0;
          height: 2.5rem;
        }

        .wc-ai-bot-send:hover:not(:disabled) {
          opacity: 0.9;
        }

        .wc-ai-bot-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Status bar */
        .wc-ai-bot-status {
          display: none;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          background: var(--primary-bg-color);
          color: var(--primary-color);
          border-top: 1px solid var(--border-color);
        }

        .wc-ai-bot-status--error {
          background: var(--danger-color);
          color: var(--danger-contrast-color);
        }

        .wc-ai-bot-status--warning {
          background: var(--warning-color, #f59e0b);
          color: var(--warning-contrast-color, white);
        }

        /* Server-mode source links ("Learn more") */
        .wc-ai-bot-sources {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 0.75rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-color);
        }

        .wc-ai-bot-sources-label {
          font-size: 0.75rem;
          font-weight: 600;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .wc-ai-bot-source-link {
          font-size: 0.85rem;
          color: var(--primary-color);
          text-decoration: none;
        }

        .wc-ai-bot-source-link:hover {
          text-decoration: underline;
        }

        /* Server-mode Cloudflare Turnstile container */
        .wc-ai-bot-turnstile {
          display: flex;
          justify-content: center;
          padding: 0.5rem 1rem 0;
        }

        .wc-ai-bot-turnstile:empty {
          display: none;
        }

        /* Gemini Nano state panels (download / unsupported / error) */
        .wc-ai-bot-nano-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.5rem 1.25rem;
          margin: auto;
          text-align: center;
          color: var(--text-1, inherit);
        }

        .wc-ai-bot-nano-text {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
          max-width: 32ch;
        }

        .wc-ai-bot-nano-msg {
          margin: 0;
          font-size: 0.8rem;
          opacity: 0.75;
          word-break: break-word;
        }

        .wc-ai-bot-nano-progress {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        /* Match the library's themed buttons (--button-* tokens) so contrast
           tracks the active theme rather than relying on the global .btn class. */
        .wc-ai-bot-nano-btn {
          background: var(--button-bg-color);
          color: var(--button-color);
          border: 1px solid var(--button-border-color);
          border-radius: 6px;
          padding: 0.5rem 1.1rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s ease-in-out, color 0.2s ease-in-out;
        }

        .wc-ai-bot-nano-btn:hover:not(:disabled) {
          background: var(--button-hover-bg-color);
          color: var(--button-hover-color);
        }

        .wc-ai-bot-nano-btn:focus {
          outline: none;
          border-color: var(--button-focus-border-color);
          box-shadow: 0 0 4px var(--button-focus-ring-color);
        }

        .wc-ai-bot-nano-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .wc-ai-bot-nano-unsupported,
        .wc-ai-bot-nano-error {
          color: var(--danger-color, #ef4444);
        }

        /* FAB Button */
        .wc-ai-bot-fab {
          position: fixed;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--primary-bg-color);
          color: var(--primary-color);
          border: none;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wc-ai-bot-fab:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
        }

        /* FAB positions based on bot position */
        .wc-ai-bot--bubble.wc-ai-bot--bottom-right .wc-ai-bot-fab {
          bottom: 1rem;
          right: 1rem;
        }

        .wc-ai-bot--bubble.wc-ai-bot--bottom-left .wc-ai-bot-fab {
          bottom: 1rem;
          left: 1rem;
        }

        .wc-ai-bot--bubble.wc-ai-bot--top-right .wc-ai-bot-fab {
          top: 1rem;
          right: 1rem;
        }

        .wc-ai-bot--bubble.wc-ai-bot--top-left .wc-ai-bot-fab {
          top: 1rem;
          left: 1rem;
        }

        /* Hide FAB for non-bubble themes */
        .wc-ai-bot--minimal .wc-ai-bot-fab,
        .wc-ai-bot--sidebar .wc-ai-bot-fab {
          display: none !important;
        }

        /* Theme: Bubble */
        .wc-ai-bot--bubble .wc-ai-bot-container {
          position: fixed;
          /* Grow to the configured size (attr → --wc-ai-bot-panel-*), clamped to the viewport. */
          width: min(var(--wc-ai-bot-panel-width, 350px), 92vw);
          height: min(var(--wc-ai-bot-panel-height, 500px), 85vh);
          z-index: 1000;
          transition: opacity 0.3s, transform 0.3s;
          opacity: 0;
          transform: scale(0.95);
          pointer-events: none;
        }

        .wc-ai-bot--bubble.wc-ai-bot--open .wc-ai-bot-container {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }

        /* Bubble: let the messages area fill the (now sizable) panel instead of the 400px cap. */
        .wc-ai-bot--bubble .wc-ai-bot-messages {
          max-height: none;
        }

        /* Bubble positions */
        .wc-ai-bot--bubble.wc-ai-bot--bottom-right .wc-ai-bot-container {
          bottom: 1rem;
          right: 1rem;
        }

        .wc-ai-bot--bubble.wc-ai-bot--bottom-left .wc-ai-bot-container {
          bottom: 1rem;
          left: 1rem;
        }

        .wc-ai-bot--bubble.wc-ai-bot--top-right .wc-ai-bot-container {
          top: 1rem;
          right: 1rem;
        }

        .wc-ai-bot--bubble.wc-ai-bot--top-left .wc-ai-bot-container {
          top: 1rem;
          left: 1rem;
        }

        /* Theme: Minimal */
        .wc-ai-bot--minimal .wc-ai-bot-container {
          width: 100%;
          height: 100%;
          border-radius: 0;
          box-shadow: none;
        }

        .wc-ai-bot--minimal .wc-ai-bot-header {
          background: transparent;
          color: var(--color);
          border-bottom: 1px solid var(--border-color);
        }

        .wc-ai-bot--minimal .wc-ai-bot-header button {
          color: var(--color);
        }

        /* Theme: Sidebar */
        .wc-ai-bot--sidebar .wc-ai-bot-container {
          width: 100%;
          height: 100%;
          border-radius: 0;
        }

        .wc-ai-bot--sidebar .wc-ai-bot-messages {
          max-height: none;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .wc-ai-bot--bubble .wc-ai-bot-container {
            /* Honor the configured panel size but never exceed the phone viewport. */
            width: min(var(--wc-ai-bot-panel-width, 350px), calc(100vw - 2rem));
            height: min(var(--wc-ai-bot-panel-height, 500px), calc(100vh - 2rem));
            max-width: none;
            max-height: none;
          }
        }

        /* Unsupported UI */
        .wc-ai-bot-container--unsupported {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .wc-ai-bot-unsupported {
          text-align: center;
          padding: 2rem;
          max-width: 400px;
        }

        .wc-ai-bot-unsupported-icon {
          color: var(--warning-color, #f59e0b);
          margin-bottom: 1rem;
        }

        .wc-ai-bot-unsupported-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--color);
        }

        .wc-ai-bot-unsupported-message {
          color: var(--muted-color);
          margin-bottom: 1rem;
        }

        .wc-ai-bot-unsupported-help {
          font-size: 0.875rem;
          color: var(--muted-color);
        }
      `.trim();
      
      this.loadStyle('wc-ai-bot-style', style);
      
      // Handle dynamic theme changes
      const theme = this.getAttribute('theme') || 'bubble';
      const position = this.getAttribute('position') || 'bottom-right';
      const maxHeight = this.getAttribute('max-height');
      
      // Remove all theme classes first
      this.classList.remove('wc-ai-bot--bubble', 'wc-ai-bot--minimal', 'wc-ai-bot--sidebar');
      this.classList.remove('wc-ai-bot--bottom-right', 'wc-ai-bot--bottom-left', 
                           'wc-ai-bot--top-right', 'wc-ai-bot--top-left');
      
      // Add theme class
      this.classList.add(`wc-ai-bot--${theme}`);
      
      // Add position class for bubble theme
      if (theme === 'bubble' && position) {
        this.classList.add(`wc-ai-bot--${position}`);
      }
      
      // Apply max-height if specified and not bubble theme
      if (maxHeight && theme !== 'bubble' && this._container) {
        this._container.style.maxHeight = maxHeight;
      } else if (this._container) {
        this._container.style.maxHeight = '';
      }

      // Panel size (bubble): set the CSS custom properties the container clamps against.
      // Consumers can also set --wc-ai-bot-panel-width/height directly in CSS. `panel-height`
      // is the preferred alias for the bubble panel's height (falls back to max-height).
      const panelWidth = this.getAttribute('panel-width');
      const panelHeight = this.getAttribute('panel-height') || (theme === 'bubble' ? maxHeight : null);
      if (panelWidth) this.style.setProperty('--wc-ai-bot-panel-width', panelWidth);
      else this.style.removeProperty('--wc-ai-bot-panel-width');
      if (panelHeight) this.style.setProperty('--wc-ai-bot-panel-height', panelHeight);
      else this.style.removeProperty('--wc-ai-bot-panel-height');
      
      // Show/hide toggle button based on theme
      if (this._container) {
        const toggleBtn = this._container.querySelector('.wc-ai-bot-toggle');
        if (toggleBtn) {
          toggleBtn.style.display = theme === 'bubble' ? 'block' : 'none';
        }
      }
    }

    async _initializeModel() {
      // Server-backed: no in-browser model — wire up the endpoint and (optionally) Turnstile.
      if (this._provider === 'server') {
        return this._initServer();
      }

      // Gemini Nano (Chrome built-in AI) has its own init path — no WebLLM download.
      if (this._provider === 'gemini-nano') {
        return this._initGeminiNano();
      }

      let modelName = this.getAttribute('model');

      // Auto-select model based on detected capability if not specified
      if (!modelName && this._detectedCapability) {
        if (this._detectedCapability === 'high' || this._detectedCapability === 'medium') {
          modelName = 'Llama-3.2-3B-Instruct-q4f32_1-MLC'; // Better model for capable hardware
        } else {
          modelName = 'Llama-3.2-1B-Instruct-q4f32_1-MLC'; // Smaller model for weaker hardware
        }
        
        if (this.getAttribute('debug') === 'true') {
          console.log(`[wc-ai-bot] Auto-selected model ${modelName} based on ${this._detectedCapability} capability`);
        }
      }
      
      // Default if still not set
      if (!modelName) {
        modelName = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
      }
      
      const botId = this.getAttribute('bot-id') || 'default';
      
      try {
        this._updateStatus('Initializing AI model...');
        
        // Load WebLLM module if not already loaded
        if (!webllmModule) {
          this._updateStatus('Loading WebLLM...');
          webllmModule = await waveImport('https://esm.run/@mlc-ai/web-llm');
        }
        
        // Check if model is already loaded
        if (loadedModels.has(modelName)) {
          this._engine = loadedModels.get(modelName);
          this._isModelReady = true;
          this._sendButton.disabled = false;
          this._updateStatus('');
          this._emitBotEvent('wcbotready', 'bot:ready', { botId, model: modelName });
          return;
        }
        
        // Check if model is currently loading
        if (modelLoadingPromises.has(modelName)) {
          this._updateStatus('Waiting for model to load...');
          this._engine = await modelLoadingPromises.get(modelName);
          this._isModelReady = true;
          this._sendButton.disabled = false;
          this._updateStatus('');
          this._emitBotEvent('wcbotready', 'bot:ready', { botId, model: modelName });
          return;
        }
        
        // Load the model
        const loadPromise = this._loadModel(modelName);
        modelLoadingPromises.set(modelName, loadPromise);
        
        this._engine = await loadPromise;
        loadedModels.set(modelName, this._engine);
        modelLoadingPromises.delete(modelName);
        
        this._isModelReady = true;
        this._sendButton.disabled = false;
        this._updateStatus('');
        this._emitBotEvent('wcbotready', 'bot:ready', { botId, model: modelName });
        
        // Mark success in localStorage
        localStorage.setItem('wc-ai-bot-success', 'true');
        
      } catch (error) {
        console.error('[wc-ai-bot] Failed to initialize model:', error);
        this._error = error.message;
        this._updateStatus(`Error: ${error.message}`, 'error');
        this._emitBotEvent('wcboterror', 'bot:error', { botId, error: error.message });
        
        // Mark failure in localStorage (unless force-enabled)
        if (this.getAttribute('force-enable') !== 'true') {
          localStorage.setItem('wc-ai-bot-failure', 'true');
        }
      }
    }

    async _loadModel(modelName) {
      const engine = new webllmModule.MLCEngine();
      
      let lastProgress = 0;
      let progressTimeout = null;
      
      // Set up progress callback
      engine.setInitProgressCallback((progress) => {
        const percentage = Math.round(progress.progress * 100);
        this._modelProgress = percentage;
        
        // Update status with more detailed info
        if (progress.text) {
          this._updateStatus(`${progress.text} ${percentage}%`);
        } else {
          this._updateStatus(`Loading model: ${percentage}%`);
        }
        
        // Reset timeout on progress
        if (progressTimeout) clearTimeout(progressTimeout);
        lastProgress = percentage;
        
        // Set timeout to detect stalled downloads
        progressTimeout = setTimeout(() => {
          if (lastProgress < 100) {
            this._updateStatus(`Download may be stalled at ${lastProgress}%. Check network connection.`, 'warning');
          }
        }, 30000); // 30 second timeout
      });
      
      try {
        // Build model config overrides
        const overrides = {};
        const ctxSize = parseInt(this.getAttribute('context-window-size') || '0');
        if (ctxSize > 0) {
          overrides.context_window_size = ctxSize;
          if (this.getAttribute('debug') === 'true') {
            console.log(`[wc-ai-bot] Overriding context_window_size to ${ctxSize}`);
          }
        }

        if (Object.keys(overrides).length > 0) {
          await engine.reload(modelName, overrides);
        } else {
          await engine.reload(modelName);
        }
        if (progressTimeout) clearTimeout(progressTimeout);
        return engine;
      } catch (error) {
        if (progressTimeout) clearTimeout(progressTimeout);
        throw error;
      }
    }

    // --- Provider Resolution (WebLLM vs Gemini Nano) ---

    // Returns the Prompt API availability string, or 'unavailable' if the
    // browser doesn't expose the built-in AI LanguageModel global at all.
    // Values: 'available' | 'downloadable' | 'downloading' | 'unavailable'
    async _isGeminiNanoAvailable() {
      try {
        if (!('LanguageModel' in self) || typeof self.LanguageModel.availability !== 'function') {
          return 'unavailable';
        }
        return await self.LanguageModel.availability();
      } catch (error) {
        if (this.getAttribute('debug') === 'true') {
          console.warn('[wc-ai-bot] Gemini Nano availability check failed:', error);
        }
        return 'unavailable';
      }
    }

    // Decide which backend to use. provider="webllm" forces WebLLM,
    // provider="gemini-nano" forces Nano (NEVER falls back to WebLLM — _initGeminiNano
    // handles every availability state itself), and provider="auto" (default) prefers
    // Nano only when it is already downloaded so users never hit a surprise download.
    async _resolveProvider() {
      const pref = (this.getAttribute('provider') || 'auto').toLowerCase();

      // Server-backed: no in-browser model, talk to a backend endpoint.
      if (pref === 'server') return 'server';

      if (pref === 'webllm') return 'webllm';

      // Explicit opt-in: always use Nano. _initGeminiNano decides what to render for
      // available / downloadable / downloading / unavailable, with no WebLLM fallback.
      if (pref === 'gemini-nano') return 'gemini-nano';

      // auto: only prefer Nano when the model is ready (no surprise downloads).
      const nano = await this._isGeminiNanoAvailable();
      if (nano === 'available') return 'gemini-nano';
      return 'webllm';
    }

    // Hide the component entirely (used by hide-if-unavailable when Gemini Nano
    // can't run). Renders nothing, settles `ready`, and emits wcbotunsupported so
    // consumers can react if needed.
    _hideUnavailable() {
      this._isUnsupported = true;
      this._unsupportedReason = 'Gemini Nano is not available in this browser.';
      this.style.display = 'none';
      this.classList.add('wc-ai-bot--hidden');

      if (this.getAttribute('debug') === 'true') {
        console.warn('[wc-ai-bot] Gemini Nano unavailable and hide-if-unavailable="true" — hiding component');
      }

      this._emitBotEvent('wcbotunsupported', 'bot:unsupported', {
        botId: this.getAttribute('bot-id') || 'default',
        reason: this._unsupportedReason,
        provider: 'gemini-nano',
        hidden: true
      });
    }

    // --- Server Backend (provider="server") ---

    // No in-browser model: the backend owns the prompt, grounding, model and limits,
    // and the model API key never reaches the browser. Sets up a stable session id and
    // (optionally) a Cloudflare Turnstile challenge, then marks the bot ready.
    async _initServer() {
      const botId = this.getAttribute('bot-id') || 'default';

      if (!this._sessionId) this._sessionId = this._generateSessionId();

      // Optional Cloudflare Turnstile challenge rendered above the input.
      const siteKey = this.getAttribute('turnstile-site-key');
      if (siteKey) {
        this._turnstileContainer = document.createElement('div');
        this._turnstileContainer.className = 'wc-ai-bot-turnstile';
        const inputContainer = this._container.querySelector('.wc-ai-bot-input-container');
        if (inputContainer) {
          this._container.insertBefore(this._turnstileContainer, inputContainer);
        } else {
          this._container.appendChild(this._turnstileContainer);
        }
        this._ensureTurnstile(); // fire-and-forget render; token read per request
      }

      this._engine = { type: 'server' };
      this._isModelReady = true;
      this._sendButton.disabled = false;
      this._updateStatus('');
      this._emitBotEvent('wcbotready', 'bot:ready', { botId, model: 'server' });
    }

    _generateSessionId() {
      try {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
          return window.crypto.randomUUID();
        }
      } catch (e) { /* fall through */ }
      return 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }

    // POST the full conversation to the backend and stream the SSE reply into the
    // loading bubble. Handles the 503 JSON deny shape and the done/error SSE events.
    async _streamServer(message, loadingId, botId, signal) {
      const endpoint = this.getAttribute('endpoint') || '/api/ai';

      // Full conversation as user/assistant turns (exclude the in-progress bot bubble).
      const messages = this._messages
        .filter(m => !m.isLoading && (m.role === 'user' || m.role === 'bot'))
        .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }));

      const turnstileToken = await this._getTurnstileToken();

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages,
          session_id: this._sessionId,
          turnstile_token: turnstileToken
        }),
        signal
      });

      const contentType = (resp.headers.get('content-type') || '').toLowerCase();

      // Denied → 503 application/json { reason }
      if (!resp.ok || contentType.includes('application/json')) {
        let reason = 'provider_unavailable';
        try {
          const data = await resp.json();
          if (data && data.reason) reason = data.reason;
        } catch (e) { /* keep default */ }
        this._resetTurnstile();
        this._updateMessage(loadingId, this._serverDenyMessage(reason));
        this._emitBotEvent('wcboterror', 'bot:error', { botId, error: reason, reason });
        return;
      }

      if (!resp.body) {
        throw new Error('Streaming not supported by this browser/response.');
      }

      // Allowed → 200 text/event-stream. POST means EventSource can't be used, so we
      // read the body and parse SSE frames manually.
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';
      let sources = [];
      let streamError = null;
      // Complete on the `done`/`error` SSE event — the backend may keep the socket open
      // (heartbeats) after it, so waiting only for EOF would hang the turn forever.
      let streamDone = false;

      const processFrame = (frame) => {
        let eventType = 'message';
        const dataLines = [];
        frame.split('\n').forEach(line => {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).replace(/^ /, ''));
          }
        });
        const dataStr = dataLines.join('\n');
        if (!dataStr) return;
        let data;
        try { data = JSON.parse(dataStr); } catch (e) { return; }

        if (eventType === 'delta') {
          answer += data.text || '';
          this._updateMessage(loadingId, answer);
        } else if (eventType === 'done') {
          sources = Array.isArray(data.sources) ? data.sources : [];
          streamDone = true;
        } else if (eventType === 'error') {
          streamError = data.reason || 'provider_error';
          streamDone = true;
        }
      };

      try {
        while (!streamDone) {
          const { value, done } = await reader.read();
          if (done) break; // EOF — server closed the stream without an explicit done frame
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          let idx;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            processFrame(frame);
          }
        }
        if (buffer.trim()) processFrame(buffer);
      } finally {
        // Stop reading promptly (turn done, EOF, error, or abort) so a socket held open
        // by heartbeats can't keep the turn — and thus the busy state — alive.
        try { await reader.cancel(); } catch (e) { /* already closed */ }
      }

      this._resetTurnstile();

      if (streamError) {
        const friendly = this._serverDenyMessage(streamError);
        this._updateMessage(loadingId, answer ? `${answer}\n\n_${friendly}_` : friendly);
        this._emitBotEvent('wcboterror', 'bot:error', { botId, error: streamError, reason: streamError });
        return;
      }

      if (sources.length > 0) {
        this._appendSources(loadingId, sources);
      }

      this._emitBotEvent('wcbotresponsereceived', 'bot:response-received', { botId, response: answer, sources });
    }

    // Map a backend deny/error reason to a friendly, user-facing message.
    _serverDenyMessage(reason) {
      switch (reason) {
        case 'captcha':
          return 'Please complete the verification and try again.';
        case 'rate_limited':
        case 'session_cap':
        case 'global_cap':
        case 'breaker_velocity':
          return 'You\'ve reached a limit. Please try again shortly.';
        case 'input_too_large':
          return 'Your message is too long. Please shorten it and try again.';
        default:
          return 'The assistant is temporarily unavailable. Please try again.';
      }
    }

    // Render "Learn more" source links beneath a bot message bubble.
    _appendSources(messageId, sources) {
      const messageEl = this._messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
      if (!messageEl) return;
      const bubbleEl = messageEl.querySelector('.wc-ai-bot-message-bubble');
      if (!bubbleEl) return;

      const wrap = document.createElement('div');
      wrap.className = 'wc-ai-bot-sources';

      const label = document.createElement('div');
      label.className = 'wc-ai-bot-sources-label';
      label.textContent = 'Learn more';
      wrap.appendChild(label);

      sources.forEach(src => {
        if (!src || !src.url) return;
        const a = document.createElement('a');
        a.className = 'wc-ai-bot-source-link';
        a.href = src.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = src.title || src.url;
        if (src.text) a.title = src.text;
        wrap.appendChild(a);
      });

      bubbleEl.appendChild(wrap);
      this._messagesContainer.scrollTop = this._messagesContainer.scrollHeight;
    }

    // --- Cloudflare Turnstile (server mode, optional) ---

    async _ensureTurnstile() {
      const siteKey = this.getAttribute('turnstile-site-key');
      if (!siteKey || !this._turnstileContainer) return;

      if (!turnstileScriptPromise) {
        turnstileScriptPromise = new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          s.async = true;
          s.defer = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load Turnstile script'));
          document.head.appendChild(s);
        });
      }

      try {
        await turnstileScriptPromise;
      } catch (e) {
        console.warn('[wc-ai-bot] Turnstile failed to load:', e);
        return;
      }

      if (window.turnstile && this._turnstileWidgetId == null) {
        try {
          this._turnstileWidgetId = window.turnstile.render(this._turnstileContainer, {
            sitekey: siteKey,
            size: 'flexible'
          });
        } catch (e) {
          console.warn('[wc-ai-bot] Turnstile render failed:', e);
        }
      }
    }

    async _getTurnstileToken() {
      if (!this.getAttribute('turnstile-site-key')) return '';
      if (this._turnstileWidgetId == null) {
        await this._ensureTurnstile();
      }
      try {
        if (window.turnstile && this._turnstileWidgetId != null) {
          return window.turnstile.getResponse(this._turnstileWidgetId) || '';
        }
      } catch (e) { /* fall through */ }
      return '';
    }

    _resetTurnstile() {
      try {
        if (window.turnstile && this._turnstileWidgetId != null) {
          window.turnstile.reset(this._turnstileWidgetId);
        }
      } catch (e) { /* ignore */ }
    }

    // Input/output language hints for the Prompt API. Specifying these silences the
    // "No output language was specified" console warning and keeps responses in English.
    _nanoLanguageOpts() {
      return {
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }]
      };
    }

    async _initGeminiNano() {
      const botId = this.getAttribute('bot-id') || 'default';
      const explicit = (this.getAttribute('provider') || 'auto').toLowerCase() === 'gemini-nano';

      try {
        const availability = await this._isGeminiNanoAvailable();

        if (availability === 'available') {
          // Model already present — creating a session does not download, so no
          // user gesture is required. Activate immediately.
          await this._activateGeminiNano(botId);
          return;
        }

        if (availability === 'downloadable' || availability === 'downloading') {
          // Chrome requires a user gesture to start the model download, so we must
          // NOT call create() at render time. Show a download affordance instead;
          // the click handler performs the gesture-gated download.
          this._renderNanoDownloadUI(availability);
          this._emitBotEvent('wcbotdownloadrequired', 'bot:download-required', { botId, availability });
          return; // `ready` intentionally NOT settled — this is a non-terminal state.
        }

        // availability === 'unavailable' (only reachable for explicit gemini-nano —
        // auto resolves to WebLLM when Nano isn't already 'available').
        if (this.getAttribute('hide-if-unavailable') === 'true') {
          this._hideUnavailable();
        } else {
          this._renderNanoUnsupported(botId);
        }

      } catch (error) {
        console.error('[wc-ai-bot] Failed to initialize Gemini Nano:', error);

        if (!explicit) {
          // provider="auto": degrade to WebLLM rather than leaving a dead bot.
          if (this.getAttribute('debug') === 'true') {
            console.warn('[wc-ai-bot] Falling back to WebLLM after Gemini Nano init failure (provider="auto")');
          }
          this._provider = 'webllm';
          return this._initializeModel();
        }

        // provider="gemini-nano": never fall back — surface an error + Retry state.
        this._renderNanoError(botId, error);
      }
    }

    // Activate Nano when the model is already downloaded ('available'). Probes a
    // session to validate, then transitions to the ready state.
    async _activateGeminiNano(botId) {
      const probe = await self.LanguageModel.create(this._nanoLanguageOpts());
      if (typeof probe.destroy === 'function') probe.destroy();
      this._finalizeNanoReady(botId);
    }

    // Shared "Nano is usable" transition — used by both the already-available path
    // and the post-download path.
    _finalizeNanoReady(botId) {
      this._engine = { type: 'gemini-nano' };
      this._isModelReady = true;
      this._sendButton.disabled = false;
      this._updateStatus('');
      this._emitBotEvent('wcbotready', 'bot:ready', { botId, model: 'gemini-nano' });
      localStorage.setItem('wc-ai-bot-success', 'true');
    }

    // Gesture-gated model download. Invoked from the Download button click so the
    // create() call (which starts the multi-GB download) happens inside a user gesture.
    async _downloadGeminiNano(panel) {
      const botId = this.getAttribute('bot-id') || 'default';
      const btn = panel.querySelector('.wc-ai-bot-nano-btn');
      const progressEl = panel.querySelector('.wc-ai-bot-nano-progress');
      const pctEl = panel.querySelector('.wc-ai-bot-nano-pct');

      if (btn) btn.disabled = true;
      this._sendButton.disabled = true;
      if (progressEl) progressEl.style.display = 'flex';
      this._updateStatus('Downloading Gemini Nano: 0%');

      try {
        const session = await self.LanguageModel.create({
          ...this._nanoLanguageOpts(),
          monitor: (m) => {
            m.addEventListener('downloadprogress', (e) => {
              const loaded = e.loaded || 0;
              const pct = Math.round(loaded * 100);
              this._modelProgress = pct;
              this._updateStatus(`Downloading Gemini Nano: ${pct}%`);
              if (pctEl) pctEl.textContent = `${pct}%`;
              this._emitBotEvent('wcbotdownloadprogress', 'bot:download-progress', { botId, loaded });
            });
          }
        });
        if (typeof session.destroy === 'function') session.destroy();

        if (panel.parentNode) panel.remove();
        this._nanoDownloadPanel = null;
        this._finalizeNanoReady(botId);

      } catch (error) {
        console.error('[wc-ai-bot] Gemini Nano download failed:', error);
        // Retryable — re-enable the button and keep the non-terminal download state
        // (do not settle `ready`).
        if (btn) btn.disabled = false;
        if (progressEl) progressEl.style.display = 'none';
        this._updateStatus(`Download failed: ${error.message}`, 'error');
      }
    }

    _renderNanoDownloadUI(availability) {
      this._sendButton.disabled = true;
      this._updateStatus('');

      const panel = document.createElement('div');
      panel.className = 'wc-ai-bot-nano-panel wc-ai-bot-nano-download';
      panel.innerHTML = `
        <wc-fa-icon name="robot" icon-style="solid" size="2rem"></wc-fa-icon>
        <p class="wc-ai-bot-nano-text">This assistant runs a private on-device AI model that needs to be downloaded once before first use.</p>
        <button class="wc-ai-bot-nano-btn" type="button">Download AI model</button>
        <div class="wc-ai-bot-nano-progress" style="display:none;">
          <wc-loader size="36px" speed="1s" thickness="5px"></wc-loader>
          <span class="wc-ai-bot-nano-pct">0%</span>
        </div>
      `;
      const btn = panel.querySelector('.wc-ai-bot-nano-btn');
      btn.addEventListener('click', () => this._downloadGeminiNano(panel));

      this._messagesContainer.appendChild(panel);
      this._nanoDownloadPanel = panel;
    }

    _renderNanoUnsupported(botId) {
      this._sendButton.disabled = true;
      this._updateStatus('');

      const panel = document.createElement('div');
      panel.className = 'wc-ai-bot-nano-panel wc-ai-bot-nano-unsupported';
      panel.innerHTML = `
        <wc-fa-icon name="triangle-exclamation" icon-style="solid" size="1.5rem"></wc-fa-icon>
        <p class="wc-ai-bot-nano-text">This AI assistant requires Chrome's built-in AI (Gemini Nano), which isn't available in this browser.</p>
      `;
      this._messagesContainer.appendChild(panel);

      this._emitBotEvent('wcbotunsupported', 'bot:unsupported', {
        botId,
        reason: 'Gemini Nano is not available in this browser.',
        provider: 'gemini-nano',
        hidden: false
      });
    }

    _renderNanoError(botId, error) {
      this._error = error.message;
      this._sendButton.disabled = true;
      this._updateStatus('');

      const panel = document.createElement('div');
      panel.className = 'wc-ai-bot-nano-panel wc-ai-bot-nano-error';
      panel.innerHTML = `
        <wc-fa-icon name="triangle-exclamation" icon-style="solid" size="1.5rem"></wc-fa-icon>
        <p class="wc-ai-bot-nano-text">Failed to initialize the on-device AI model.</p>
        <p class="wc-ai-bot-nano-msg"></p>
        <button class="wc-ai-bot-nano-btn" type="button">Retry</button>
      `;
      panel.querySelector('.wc-ai-bot-nano-msg').textContent = error.message;
      const retry = panel.querySelector('.wc-ai-bot-nano-btn');
      retry.addEventListener('click', () => {
        panel.remove();
        this._initGeminiNano();
      });

      this._messagesContainer.appendChild(panel);
      this._emitBotEvent('wcboterror', 'bot:error', { botId, error: error.message });
    }

    // --- Streaming Abstraction ---

    // Streams a chat completion through the active backend, invoking onUpdate with
    // the full accumulated response text on each delta. Returns the final text.
    async _streamChat(messages, opts, onUpdate) {
      if (this._provider === 'gemini-nano') {
        return this._streamGeminiNano(messages, opts, onUpdate);
      }
      return this._streamWebLLM(messages, opts, onUpdate);
    }

    async _streamWebLLM(messages, { temperature, maxTokens }, onUpdate) {
      const completion = await this._engine.chat.completions.create({
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: true
      });

      let response = '';
      for await (const chunk of completion) {
        response += chunk.choices[0].delta.content || '';
        onUpdate(response);
      }
      return response;
    }

    async _streamGeminiNano(messages, { temperature }, onUpdate) {
      // The Prompt API sets the system prompt + history at session creation and
      // takes the latest turn via prompt(). Reuse the same messages array the
      // WebLLM path builds: everything but the final user turn becomes the
      // session's initialPrompts, the final turn is the prompt.
      const initialPrompts = messages.slice(0, -1);
      const last = messages[messages.length - 1];

      const createOpts = { ...this._nanoLanguageOpts() };
      if (initialPrompts.length > 0) createOpts.initialPrompts = initialPrompts;
      // temperature and topK must be set together when overriding sampling.
      if (!Number.isNaN(temperature)) {
        createOpts.temperature = temperature;
        createOpts.topK = 3;
      }

      const session = await self.LanguageModel.create(createOpts);
      try {
        let response = '';
        const stream = session.promptStreaming(last.content);
        // Chrome 138+ yields incremental deltas (not cumulative).
        for await (const chunk of stream) {
          response += chunk;
          onUpdate(response);
        }
        return response;
      } finally {
        if (typeof session.destroy === 'function') session.destroy();
      }
    }

    // --- Assistant Mode Methods ---

    _isAssistantMode() {
      return this.getAttribute('mode') === 'assistant';
    }

    async _loadKnowledgeBases() {
      const urls = this.getAttribute('context-urls');
      if (!urls) return;

      const urlList = urls.split(',').map(u => u.trim()).filter(Boolean);
      this._updateStatus('Loading knowledge bases...');

      for (const url of urlList) {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            console.warn(`[wc-ai-bot] Failed to load KB from ${url}: ${response.status}`);
            continue;
          }
          const data = await response.json();
          // Derive name from the meta field or filename
          const name = data?.meta?.name?.toLowerCase().replace(/\s+knowledge\s+base/i, '').replace(/\s+/g, '-') ||
                       url.split('/').pop().replace('.json', '');
          this._knowledgeBases[name] = data;

          if (this.getAttribute('debug') === 'true') {
            const size = JSON.stringify(data).length;
            console.log(`[wc-ai-bot] Loaded KB "${name}" from ${url} (${(size/1024).toFixed(1)} KB)`);
          }
        } catch (error) {
          console.error(`[wc-ai-bot] Error loading KB from ${url}:`, error);
        }
      }

      this._knowledgeBasesLoaded = Object.keys(this._knowledgeBases).length > 0;
      if (this._knowledgeBasesLoaded) {
        const names = Object.keys(this._knowledgeBases).join(', ');
        this._updateStatus('');
        if (this.getAttribute('debug') === 'true') {
          console.log(`[wc-ai-bot] Knowledge bases loaded: ${names}`);
        }
      }
    }

    _parseCommand(message) {
      const trimmed = message.trim();
      if (!trimmed.startsWith('/')) return null;

      const spaceIdx = trimmed.indexOf(' ');
      const cmd = spaceIdx === -1 ? trimmed : trimmed.substring(0, spaceIdx);
      const args = spaceIdx === -1 ? '' : trimmed.substring(spaceIdx + 1).trim();

      const commandDef = WcAiBot.ASSISTANT_COMMANDS[cmd];
      if (!commandDef) return null;

      return { command: cmd, args, definition: commandDef };
    }

    _buildAssistantContext(commandDef) {
      // Select relevant sections from loaded knowledge bases
      const contextParts = [];
      const sectionMap = commandDef?.sections || {};

      for (const [kbName, sectionNames] of Object.entries(sectionMap)) {
        const kb = this._knowledgeBases[kbName];
        if (!kb) continue;

        for (const sectionName of sectionNames) {
          const section = kb[sectionName];
          if (section) {
            const json = JSON.stringify(section, null, 2);
            contextParts.push(`### ${kbName} — ${sectionName}\n${json}`);
          }
        }
      }

      return contextParts.join('\n\n');
    }

    _getCommandHelpText() {
      const commands = WcAiBot.ASSISTANT_COMMANDS;
      const lines = ['**Available Commands:**\n'];
      for (const [cmd, def] of Object.entries(commands)) {
        if (cmd === '/help') continue;
        lines.push(`- \`${cmd}\` — ${def.description}`);
      }
      lines.push('');
      lines.push('**Usage:** Type a command followed by a description:');
      lines.push('```');
      lines.push('/create-schema contact with first name, last name, email, phone, status');
      lines.push('/create-list article with title, category, release date, is active');
      lines.push('/create-edit article with title, description, release date, category');
      lines.push('/create-template article list and edit templates');
      lines.push('/create-screen ticket tracker with title, priority, assignee, status');
      lines.push('/query Find all prospects in Oregon created this month sorted by last name');
      lines.push('```');
      lines.push('');
      lines.push('**Tip:** Use `/create-list` and `/create-edit` for faster generation than `/create-template`.');
      lines.push('**Tip:** `/query` works best when the collection is selected — field names are injected automatically.');
      lines.push('');
      lines.push('You can also ask general questions — relevant knowledge will be injected automatically.');
      return lines.join('\n');
    }

    _matchKnowledgeByKeywords(message) {
      // For non-command messages in assistant mode, match KB sections by keywords
      const lower = message.toLowerCase();
      const sections = {};

      // Keyword → KB section mapping
      const keywordMap = [
        { keywords: ['schema', 'litespec', '@required', '@enum', '@if', 'def ', 'model '], kb: 'lite-spec', sections: ['syntax', 'attributes', 'conditionalValidation'] },
        { keywords: ['template', 'content tab', 'code tab', 'runget', 'runpost', 'runput', 'rundelete', 'rdx.', 'saveandvalidate'], kb: 'go-kart', sections: ['templateSystem', 'patterns'] },
        { keywords: ['field rule', 'fieldrule', 'syncwith', 'setvalue', 'settext', 'calculate', 'updateoptions', 'visible', 'required when'], kb: 'go-kart', sections: ['fieldRules'] },
        { keywords: ['web pilot', 'webpilot', 'playwright', 'automation', 'script', 'carrier', 'schedule'], kb: 'go-kart', sections: ['webPilots'] },
        { keywords: ['component', 'wc-', 'wave css', 'wavecss', 'wc-input', 'wc-select', 'wc-form', 'wc-tab', 'wc-tabulator'], kb: 'wave-css', sections: ['components', 'overview'] },
        { keywords: ['theme', 'css variable', 'color', 'dark mode', 'light mode'], kb: 'wave-css', sections: ['themes', 'cssUtilities'] },
        { keywords: ['route', 'htmx', 'hx-get', 'hx-post', 'middleware', 'auth'], kb: 'go-kart', sections: ['architecture'] },
        { keywords: ['app', 'navigation', 'permission', 'user profile', 'collection'], kb: 'go-kart', sections: ['coreModels', 'mongodbCollections'] },
      ];

      for (const mapping of keywordMap) {
        if (mapping.keywords.some(kw => lower.includes(kw))) {
          if (!sections[mapping.kb]) sections[mapping.kb] = new Set();
          mapping.sections.forEach(s => sections[mapping.kb].add(s));
        }
      }

      // Convert Sets to arrays
      const result = {};
      for (const [kb, sectionSet] of Object.entries(sections)) {
        result[kb] = Array.from(sectionSet);
      }

      return Object.keys(result).length > 0 ? { sections: result } : null;
    }

    _handleAttributeChange(name, newValue, oldValue) {
      if (name === 'system-prompt' && this._isModelReady) {
        // System prompt changes can be applied to next conversation
        // We'll use it in the next message
      } else if (name === 'theme' || name === 'position' || name === 'max-height'
                 || name === 'panel-width' || name === 'panel-height') {
        // Re-apply styles
        this._applyStyles();
      } else if (name === 'title' && this._container) {
        // Update title dynamically
        const titleEl = this._container.querySelector('.wc-ai-bot-header-title span');
        if (titleEl) titleEl.textContent = newValue;
      } else if (name === 'placeholder' && this._input) {
        this._input.placeholder = newValue || 'Type your message...';
      }
    }

    _handleSend() {
      const message = this._input.value.trim();
      if (!message || !this._isModelReady) return;

      // Resilience: never no-op forever. If a prior turn is still marked busy (whether
      // genuinely in flight or wedged by an earlier error), abort it and reset so this
      // message can proceed rather than being silently dropped.
      if (this._isLoading) {
        this._recoverFromStuckTurn();
      }

      // In assistant mode, intercept /commands
      if (this._isAssistantMode()) {
        const parsed = this._parseCommand(message);
        if (parsed) {
          if (parsed.command === '/help') {
            this._input.value = '';
            this._adjustInputHeight();
            this._addMessage('user', message);
            this._addMessage('bot', this._getCommandHelpText());
            return;
          }
          // Store the active command for _prepareMessages to use
          this._activeCommand = parsed;
        } else {
          // Not a command — try keyword matching for context injection
          this._activeCommand = this._matchKnowledgeByKeywords(message);
        }
      }

      this._sendMessage(message);
    }

    // Abort any in-flight request and clear the busy state so a new send can proceed.
    // The aborted turn's own finally is guarded by controller identity, so it won't
    // stomp the state of the turn that supersedes it.
    _recoverFromStuckTurn() {
      if (this._activeController) {
        try { this._activeController.abort(); } catch (e) { /* ignore */ }
        this._activeController = null;
      }
      this._isLoading = false;
      if (this._sendButton) this._sendButton.disabled = false;
    }

    _handleKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    }

    _handleToggle() {
      this._isMinimized = !this._isMinimized;
      this.classList.toggle('wc-ai-bot--open', !this._isMinimized);
      
      if (!this._isMinimized) {
        this._input.focus();
        if (this._fab) {
          this._fab.style.display = 'none';
        }
      } else {
        if (this._fab) {
          this._fab.style.display = 'flex';
        }
      }
    }

    _handleClose() {
      if (this.getAttribute('theme') === 'bubble') {
        this._isMinimized = true;
        this.classList.remove('wc-ai-bot--open');
        if (this._fab) {
          this._fab.style.display = 'flex';
        }
      } else {
        // For embedded bots, emit close event
        this._emitBotEvent('wcbotclosed', 'bot:closed', { botId: this.getAttribute('bot-id') });
      }
    }

    async _sendMessage(message) {
      const botId = this.getAttribute('bot-id') || 'default';

      // Capture whether this is a /query command now — _prepareMessages() clears
      // _activeCommand before the response comes back.
      const isQueryCommand = this._isAssistantMode()
        && !!this._activeCommand
        && this._activeCommand.command === '/query';

      // Add user message
      this._addMessage('user', message);
      this._input.value = '';
      this._adjustInputHeight();
      
      // Emit message sent event
      this._emitBotEvent('wcbotmessagesent', 'bot:message-sent', { botId, message });
      
      // Show loading state. Each turn gets its own AbortController so a later send can
      // supersede a wedged/in-flight one without the two turns racing on shared state.
      this._isLoading = true;
      this._sendButton.disabled = true;
      const controller = new AbortController();
      this._activeController = controller;
      const loadingId = this._addMessage('bot', '...', true);

      try {
        // Server backend owns prompt/grounding/model/limits — stream from the endpoint.
        if (this._provider === 'server') {
          await this._streamServer(message, loadingId, botId, controller.signal);
          return;
        }

        // Prepare messages for the model
        const messages = this._prepareMessages(message);

        // Get completion
        const temperature = parseFloat(this.getAttribute('temperature') || '0.7');
        const maxTokens = parseInt(this.getAttribute('max-tokens') || '1000');

        // Stream through the active backend (WebLLM or Gemini Nano). The callback
        // receives the full accumulated text so the message bubble updates live.
        let response = '';
        await this._streamChat(messages, { temperature, maxTokens }, (full) => {
          response = full;
          this._updateMessage(loadingId, response);
        });

        // Log raw response to console if debug mode is enabled
        if (this.getAttribute('debug') === 'true') {
          console.log('[wc-ai-bot] Raw LLM response:', response);
        }

        // Emit response received event. For /query results, also surface the parsed
        // query parts so consumers can apply them without re-parsing the markdown.
        const detail = { botId, response };
        if (isQueryCommand) {
          detail.parsed = this._parseQueryResponse(response);
        }
        this._emitBotEvent('wcbotresponsereceived', 'bot:response-received', detail);

      } catch (error) {
        // A superseding send aborts this turn — leave its partial answer as-is, no error bubble.
        if (error && error.name === 'AbortError') {
          return;
        }
        console.error('[wc-ai-bot] Failed to get response:', error);
        this._updateMessage(loadingId, `Error: ${error.message}`);
        this._emitBotEvent('wcboterror', 'bot:error', { botId, error: error.message });
      } finally {
        // Only the turn that is still current resets shared state. A superseded older
        // turn's controller was already replaced, so it must not clear the newer turn's
        // busy flag / send button.
        if (this._activeController === controller) {
          this._activeController = null;
          this._isLoading = false;
          this._sendButton.disabled = false;
          this._input.focus();
        }
      }
    }

    // Extract the MongoDB query parts from a /query response's fenced code blocks.
    // Returns { pipeline } for aggregations, { query, projection, sort } for finds
    // (keys with no matching block are omitted), or null if nothing usable is found.
    // Each value is the raw JSON string from the block, ready to drop into an editor.
    //
    // Weaker models (e.g. Gemini Nano) sometimes ignore the requested labels and emit
    // a generic ```json (or unlabeled) block, possibly using a { field, value } shape
    // instead of a real filter. We fall back to those and normalize so detail.parsed
    // is populated whenever the model emits any usable JSON.
    _parseQueryResponse(response) {
      if (!response) return null;

      const extract = (label) => {
        // Matches ```label\n ...content... ``` (label optionally followed by spaces).
        const re = new RegExp('```' + label + '\\s*\\n([\\s\\S]*?)```', 'i');
        const m = response.match(re);
        return m ? m[1].trim() : null;
      };

      // Aggregation pipelines are emitted as a single ```pipeline block.
      const pipeline = extract('pipeline');
      if (pipeline) return { pipeline };

      // Find queries are up to three labeled blocks.
      const parsed = {};
      const query = extract('query');
      const projection = extract('projection');
      const sort = extract('sort');
      if (query) parsed.query = this._normalizeQueryShape(query);
      if (projection) parsed.projection = projection;
      if (sort) parsed.sort = sort;

      if (Object.keys(parsed).length > 0) return parsed;

      // Lenient fallback: a generic ```json block or an unlabeled ``` block.
      const fallback = extract('json') || this._extractUnlabeledBlock(response);
      if (!fallback) return null;

      let data;
      try {
        data = JSON.parse(fallback);
      } catch {
        return null;
      }

      // An array is an aggregation pipeline; an object is a find filter.
      if (Array.isArray(data)) {
        return { pipeline: JSON.stringify(data, null, 2) };
      }
      if (data && typeof data === 'object') {
        return { query: this._normalizeQueryShape(fallback) };
      }
      return null;
    }

    // Pull the first unlabeled fenced block (```\n ... ```), ignoring labeled ones.
    _extractUnlabeledBlock(response) {
      const m = response.match(/```[ \t]*\r?\n([\s\S]*?)```/);
      return m ? m[1].trim() : null;
    }

    // Normalize the { field, value } (optionally { field, operator, value }) shape
    // weaker models emit into a real MongoDB filter { [field]: value }. Returns a JSON
    // string; if the input can't be parsed or isn't that exact shape, returns it as-is.
    _normalizeQueryShape(jsonStr) {
      let obj;
      try {
        obj = JSON.parse(jsonStr);
      } catch {
        return jsonStr;
      }

      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return jsonStr;

      const allowed = new Set(['field', 'value', 'operator', 'op']);
      const isFieldValueShape = typeof obj.field === 'string'
        && 'value' in obj
        && Object.keys(obj).every((k) => allowed.has(k));
      if (!isFieldValueShape) return jsonStr;

      const op = obj.operator || obj.op;
      const filter = (typeof op === 'string' && op.startsWith('$'))
        ? { [obj.field]: { [op]: obj.value } }
        : { [obj.field]: obj.value };
      return JSON.stringify(filter, null, 2);
    }

    _prepareMessages(userMessage) {
      let systemPrompt = this.getAttribute('system-prompt') ||
        'You are a helpful AI assistant. Be concise and friendly in your responses.';

      // In assistant mode, build enhanced system prompt with knowledge base context
      if (this._isAssistantMode() && this._activeCommand) {
        const cmd = this._activeCommand;
        const def = cmd.definition || cmd; // command definition or keyword match result

        // Build context from knowledge bases
        const kbContext = this._buildAssistantContext(def);

        // Use command-specific system prompt if available, otherwise use attribute
        const cmdSystemPrompt = def.systemPrompt || systemPrompt;

        if (kbContext) {
          // Guard: limit KB context to ~8KB to stay within context window
          const maxContextChars = 8000;
          const trimmedContext = kbContext.length > maxContextChars
            ? kbContext.substring(0, maxContextChars) + '\n\n[...truncated to fit context window]'
            : kbContext;
          systemPrompt = `${cmdSystemPrompt}\n\n## Reference Documentation\n\n${trimmedContext}`;

          if (this.getAttribute('debug') === 'true' && kbContext.length > maxContextChars) {
            console.log(`[wc-ai-bot] KB context truncated from ${(kbContext.length/1024).toFixed(1)} KB to ${(maxContextChars/1024).toFixed(1)} KB`);
          }
        } else {
          systemPrompt = cmdSystemPrompt;
        }

        // For /query command, inject query-context (collection field list) into system prompt
        if (cmd.command === '/query') {
          const queryContext = this.getAttribute('query-context');
          if (queryContext) {
            try {
              const ctx = JSON.parse(queryContext);
              const fieldLines = (ctx.fields || []).map(f => `- ${f.path} (${f.type})`).join('\n');
              const collectionInfo = `\n\n## Collection Context\n\nCollection: **${ctx.collection || 'unknown'}**\n\nFields:\n${fieldLines}`;
              systemPrompt += collectionInfo;
            } catch (e) {
              console.warn('[wc-ai-bot] Failed to parse query-context:', e);
            }
          }
        }

        // For commands, rewrite the user message to include args
        if (cmd.command && cmd.args) {
          userMessage = `${cmd.command}: ${cmd.args}`;
        }

        if (this.getAttribute('debug') === 'true') {
          const contextSize = kbContext ? kbContext.length : 0;
          const queryCtxSize = (cmd.command === '/query') ? (this.getAttribute('query-context') || '').length : 0;
          console.log(`[wc-ai-bot] Assistant mode — command: ${cmd.command || 'keyword-match'}, kb-context: ${(contextSize/1024).toFixed(1)} KB, query-context: ${(queryCtxSize/1024).toFixed(1)} KB`);
          if (cmd.command === '/query') {
            console.log(`[wc-ai-bot] System prompt length: ${systemPrompt.length} chars`);
          }
        }

        // Clear active command after use
        this._activeCommand = null;
      }

      const messages = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history (last 10 messages for context)
      const history = this._messages.slice(-10);
      history.forEach(msg => {
        if (msg.role !== 'system') {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      });

      // Add current message
      messages.push({ role: 'user', content: userMessage });

      return messages;
    }

    _addMessage(role, content, isLoading = false) {
      // Unique per message — a bare Date.now() collides when the user bubble and the bot
      // loading bubble are appended in the same millisecond, which would make _updateMessage
      // (which looks up by id) stream the answer into the user's bubble instead.
      this._msgSeq = (this._msgSeq || 0) + 1;
      const messageId = `${Date.now().toString(36)}-${this._msgSeq}`;
      const message = { id: messageId, role, content, timestamp: new Date(), isLoading };
      this._messages.push(message);
      
      const messageEl = document.createElement('div');
      messageEl.className = `wc-ai-bot-message wc-ai-bot-message--${role}`;
      messageEl.dataset.messageId = messageId;
      
      const bubbleEl = document.createElement('div');
      bubbleEl.className = 'wc-ai-bot-message-bubble';
      
      if (isLoading) {
        bubbleEl.classList.add('wc-ai-bot-message-bubble--loading');
        bubbleEl.innerHTML = '<wc-loader size="90px" speed="1s" thickness="12px"></wc-loader>';
      } else {
        // Use markdown for bot messages, plain text for user messages
        if (role === 'bot') {
          this._renderBotMarkdown(bubbleEl, content);
        } else {
          bubbleEl.textContent = content;
        }
      }

      messageEl.appendChild(bubbleEl);
      this._messagesContainer.appendChild(messageEl);
      
      // Scroll to bottom
      this._messagesContainer.scrollTop = this._messagesContainer.scrollHeight;
      
      return messageId;
    }

    _updateMessage(messageId, content) {
      const messageEl = this._messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
      if (messageEl) {
        const bubbleEl = messageEl.querySelector('.wc-ai-bot-message-bubble');
        if (bubbleEl) {
          // Remove loading class when updating content
          bubbleEl.classList.remove('wc-ai-bot-message-bubble--loading');

          // Render markdown for bot messages (safe — never throws out to the stream loop).
          this._renderBotMarkdown(bubbleEl, content);
        }
      }
      
      // Update in messages array
      const message = this._messages.find(m => m.id === messageId);
      if (message) {
        message.content = content;
        message.isLoading = false;
      }
      
      // Scroll to bottom
      this._messagesContainer.scrollTop = this._messagesContainer.scrollHeight;
    }

    // Render a bot bubble's markdown. A rich answer (GFM tables, inline <a> anchors)
    // must NEVER throw and wedge the streaming turn — on any failure we fall back to
    // plain text and keep going, so the turn still finishes and input re-enables.
    _renderBotMarkdown(bubbleEl, content) {
      try {
        if (markedModule && markedModule.marked) {
          const html = markedModule.marked.parse(content);
          bubbleEl.innerHTML = html;
          this._addCopyButtons(bubbleEl);
          if (this.getAttribute('debug') === 'true') {
            console.log('[wc-ai-bot] Parsed HTML:', html);
          }
          return;
        }
      } catch (err) {
        console.error('[wc-ai-bot] Markdown render failed; falling back to plain text:', err);
      }
      bubbleEl.textContent = content;
    }

    _addCopyButtons(containerEl) {
      const preBlocks = containerEl.querySelectorAll('pre');
      preBlocks.forEach(pre => {
        // Skip if already has a copy button
        if (pre.querySelector('.wc-ai-bot-copy-btn')) return;

        // Wrap pre in a relative container
        const wrapper = document.createElement('div');
        wrapper.className = 'wc-ai-bot-code-wrapper';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const btn = document.createElement('button');
        btn.className = 'wc-ai-bot-copy-btn';
        btn.title = 'Copy to clipboard';
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        btn.addEventListener('click', () => {
          const code = pre.querySelector('code');
          const text = code ? code.textContent : pre.textContent;
          navigator.clipboard.writeText(text).then(() => {
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            setTimeout(() => {
              btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
            }, 2000);
          });
        });
        wrapper.appendChild(btn);
      });
    }

    _updateStatus(status, type = 'info') {
      if (this._statusBar) {
        this._statusBar.textContent = status;
        this._statusBar.className = `wc-ai-bot-status wc-ai-bot-status--${type}`;
        this._statusBar.style.display = status ? 'block' : 'none';
      }
    }

    _adjustInputHeight() {
      this._input.style.height = 'auto';
      this._input.style.height = Math.min(this._input.scrollHeight, 120) + 'px';
    }


    _getWelcomeMessage() {
      const title = this.getAttribute('title') || 'AI Assistant';
      if (this._isAssistantMode()) {
        const kbNames = Object.keys(this._knowledgeBases);
        const kbInfo = kbNames.length > 0
          ? `I have knowledge loaded for: **${kbNames.join(', ')}**.`
          : 'No knowledge bases loaded yet.';
        return `Hello! I'm ${title} running in **assistant mode**. ${kbInfo}\n\nType \`/help\` to see available commands, or ask me anything about these projects.`;
      }
      return `Hello! I'm ${title}. How can I help you today?`;
    }

    _emitBotEvent(newName, legacyName, detail) {
      const opts = { detail, bubbles: true, composed: true };
      // Use base class _emitEvent for backward-compat dispatch
      super._emitEvent(newName, legacyName, opts);

      // Settle the `ready` promise on the first terminal lifecycle event so that
      // `await bot.ready` resolves whether the model loaded, errored, or the device
      // is unsupported. _setReady() is idempotent, so later runtime errors no-op.
      if (newName === 'wcbotready' || newName === 'wcboterror' || newName === 'wcbotunsupported') {
        this._setReady();
      }

      // Also emit via EventHub (new name only)
      const botId = this.getAttribute('bot-id');
      if (botId && window.wc && window.wc.EventHub) {
        window.wc.EventHub.broadcast(newName, [`[bot-id="${botId}"]`], detail);
      }
    }

    // Public methods

    // True only when an inference model (WebLLM or Gemini Nano) is loaded and the
    // bot can answer. Distinct from `isReady`/`ready`, which settle once the init
    // lifecycle completes regardless of outcome (ready, error, or unsupported).
    get isModelReady() {
      return this._isModelReady;
    }

    // The resolved inference backend: 'webllm' | 'gemini-nano' | null (pre-init).
    get provider() {
      return this._provider;
    }

    async sendMessage(text) {
      if (this._isModelReady && !this._isLoading) {
        this._input.value = text;
        await this._sendMessage(text);
      }
    }

    static async getAvailableModels() {
      // Load WebLLM module if not already loaded
      if (!webllmModule) {
        webllmModule = await waveImport('https://esm.run/@mlc-ai/web-llm');
      }
      
      // Return the list of available models
      if (webllmModule.prebuiltAppConfig && webllmModule.prebuiltAppConfig.model_list) {
        return webllmModule.prebuiltAppConfig.model_list.map(model => ({
          model_id: model.model_id,
          model: model.model,
          description: model.description || ''
        }));
      }
      
      return [];
    }

    clearConversation() {
      this._messages = [];
      this._messagesContainer.innerHTML = '';
      this._addMessage('bot', this._getWelcomeMessage());
      this._emitBotEvent('wcbotconversationcleared', 'bot:conversation-cleared', { 
        botId: this.getAttribute('bot-id') 
      });
    }

    exportConversation() {
      return {
        botId: this.getAttribute('bot-id'),
        model: this.getAttribute('model'),
        messages: this._messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        }))
      };
    }

    setContext(context) {
      this.setAttribute('system-prompt', context);
    }

    toggleMinimize() {
      if (this.getAttribute('theme') === 'bubble') {
        this._handleToggle();
      }
    }

    async _checkSystemCapabilities() {
      try {
        // Allow force-enable for testing
        if (this.getAttribute('force-enable') === 'true') {
          console.warn('[wc-ai-bot] Force-enabled, skipping capability checks');
          return true;
        }
        
        // Check if user has previously succeeded or failed
        const previousSuccess = localStorage.getItem('wc-ai-bot-success');
        const previousFailure = localStorage.getItem('wc-ai-bot-failure');
        
        if (previousFailure === 'true' && previousSuccess !== 'true') {
          this._unsupportedReason = 'AI models previously failed to load on this device. Use force-enable="true" to retry.';
          return false;
        }
        
        // Check basic requirements
        const hasWebGPU = 'gpu' in navigator;
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        const hasWebGL = !!gl;
        
        if (!hasWebGPU && !hasWebGL) {
          this._unsupportedReason = 'WebGPU and WebGL are not available. A modern browser with GPU support is required.';
          return false;
        }
        
        // Get GPU renderer info
        let renderer = 'unknown';
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
        
        // Check against known configurations
        let detectedConfig = null;
        for (const config of WcAiBot.KNOWN_CAPABLE_CONFIGS) {
          if (config.gpu.test(renderer)) {
            detectedConfig = config;
            break;
          }
        }
        
        // Log detection results
        if (this.getAttribute('debug') === 'true') {
          console.log('[wc-ai-bot] Hardware detection:', {
            renderer,
            detectedConfig,
            hasWebGPU,
            hasWebGL,
            previousSuccess,
            previousFailure
          });
        }
        
        // Make decision based on hardware
        if (detectedConfig) {
          if (detectedConfig.capability === 'none') {
            this._unsupportedReason = `${detectedConfig.name} is not capable of running AI models efficiently. This would cause your browser to freeze.`;
            return false;
          }
          
          if (detectedConfig.capability === 'low') {
            // Check required performance level
            const requiredPerformance = this.getAttribute('required-performance') || 'low';
            if (requiredPerformance !== 'low') {
              this._unsupportedReason = `${detectedConfig.name} can only run small AI models. Set required-performance="low" to proceed.`;
              return false;
            }
          }
          
          // Store capability for model selection
          this._detectedCapability = detectedConfig.capability;
          return true;
        }
        
        // Unknown hardware - check if user wants to proceed
        if (previousSuccess === 'true') {
          // User has successfully used it before on this hardware
          return true;
        }
        
        // For unknown hardware, be conservative
        this._unsupportedReason = `Unable to verify GPU compatibility (${renderer}). To protect your browsing experience, AI models are disabled. Add force-enable="true" to try anyway.`;
        return false;
        
      } catch (error) {
        console.error('[wc-ai-bot] Error checking system capabilities:', error);
        this._unsupportedReason = 'Error detecting system capabilities. AI models are disabled for safety.';
        return false;
      }
    }


    _renderUnsupportedUI() {
      this._isUnsupported = true;
      
      const theme = this.getAttribute('theme') || 'bubble';
      const title = this.getAttribute('title') || 'AI Assistant';
      
      // For bubble theme, don't show anything
      if (theme === 'bubble') {
        this.style.display = 'none';
        this._emitBotEvent('wcbotunsupported', 'bot:unsupported', { 
          botId: this.getAttribute('bot-id'),
          reason: this._unsupportedReason
        });
        return;
      }
      
      // For embedded themes, show a message
      this._container = document.createElement('div');
      this._container.className = 'wc-ai-bot-container wc-ai-bot-container--unsupported';
      this._container.innerHTML = `
        <div class="wc-ai-bot-unsupported">
          <div class="wc-ai-bot-unsupported-icon">
            <wc-fa-icon name="triangle-exclamation" icon-style="solid" size="2rem"></wc-fa-icon>
          </div>
          <h3 class="wc-ai-bot-unsupported-title">${title} Unavailable</h3>
          <p class="wc-ai-bot-unsupported-message">${this._unsupportedReason}</p>
          <p class="wc-ai-bot-unsupported-help">
            For the best experience, please use a modern browser on a device with at least 
            ${this.getAttribute('min-memory-gb') || '4'}GB of memory.
          </p>
        </div>
      `;
      
      this.appendChild(this._container);
      this._applyStyles();
      
      this._emitBotEvent('wcbotunsupported', 'bot:unsupported', { 
        botId: this.getAttribute('bot-id'),
        reason: this._unsupportedReason
      });
    }

    static async checkSystemSupport() {
      try {
        // Check previous results
        const previousSuccess = localStorage.getItem('wc-ai-bot-success') === 'true';
        const previousFailure = localStorage.getItem('wc-ai-bot-failure') === 'true';
        
        // Basic capability checks
        const hasWebGPU = 'gpu' in navigator;
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        const hasWebGL = !!gl;
        
        if (!hasWebGPU && !hasWebGL) {
          return {
            supported: false,
            reason: 'No WebGPU or WebGL support',
            hasWebGPU,
            hasWebGL
          };
        }
        
        // Get GPU info
        let renderer = 'unknown';
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
        
        // Check against known configs
        let detectedConfig = null;
        for (const config of WcAiBot.KNOWN_CAPABLE_CONFIGS) {
          if (config.gpu.test(renderer)) {
            detectedConfig = config;
            break;
          }
        }
        
        // Build response
        const result = {
          renderer,
          hasWebGPU,
          hasWebGL,
          previousSuccess,
          previousFailure
        };
        
        if (detectedConfig) {
          result.hardware = detectedConfig.name;
          result.capability = detectedConfig.capability;
          result.supported = detectedConfig.capability !== 'none';
          
          if (detectedConfig.capability === 'high') {
            result.recommendation = 'Excellent hardware for AI models. Can run large models smoothly.';
            result.suggestedModel = 'Llama-3.2-3B-Instruct-q4f32_1-MLC';
          } else if (detectedConfig.capability === 'medium') {
            result.recommendation = 'Good hardware for AI models. Suitable for medium-sized models.';
            result.suggestedModel = 'Llama-3.2-3B-Instruct-q4f32_1-MLC';
          } else if (detectedConfig.capability === 'low') {
            result.recommendation = 'Limited hardware. Only small AI models recommended.';
            result.suggestedModel = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
          } else {
            result.recommendation = 'This hardware cannot run AI models efficiently.';
            result.suggestedModel = null;
          }
        } else {
          // Unknown hardware
          result.hardware = 'Unknown';
          result.capability = 'unknown';
          result.supported = previousSuccess && !previousFailure;
          result.recommendation = previousSuccess ? 
            'This hardware has successfully run AI models before.' :
            'Unknown hardware. Use force-enable="true" to try at your own risk.';
        }
        
        return result;
      } catch (error) {
        return {
          supported: false,
          error: error.message,
          recommendation: 'Error detecting hardware capabilities.'
        };
      }
    }

    static clearStoredPreferences() {
      localStorage.removeItem('wc-ai-bot-success');
      localStorage.removeItem('wc-ai-bot-failure');
    }
  }
  
  customElements.define(WcAiBot.is, WcAiBot);
}