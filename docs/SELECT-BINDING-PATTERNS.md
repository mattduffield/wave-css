# wc-select Binding Patterns in Go Kart

These are the actual patterns used across 146 production templates. The live designer must support all of them.

## Pattern 1: Lookup (68 instances — most common)
Options loaded from `_lookup` collection via Pongo2 `{% for %}` loop.

```html
<wc-select name="record_status" lbl-label="Record Status" class="col-1" required>
  <option value="">Choose...</option>
  {% set record_status = Record.record_status %}
  {% for item in Lookups.record_status_type.item_list %}
  <option value="{{ item.value }}"{% if record_status == item.value %} selected{% endif %}>{{ item.key }}</option>
  {% endfor %}
</wc-select>
```

**Designer needs:** Lookup name dropdown, "Choose..." placeholder toggle.
**At save:** Generate `{% set %}` + `{% for %}` pattern. Add lookup name to `_template_builder.lookups[]`.

## Pattern 2: Collection URL (46 instances)
Options loaded via wc-select's native `url` attribute — no Pongo2 loop needed.

```html
<wc-select name="tgtConnName" lbl-label="Target Connection"
  value="{{ DefaultConnectionName }}"
  url="/api/list-connections"
  autocomplete="off" required>
</wc-select>
```

**Designer needs:** URL field, optional display-member/value-member.
**At save:** Output `url`, `display-member`, `value-member` attributes directly.

## Pattern 3: Collection Loop via TemplateCollections (22 instances)
Options loaded from a pre-fetched collection using `TemplateCollections.collection_name` in Pongo2.

```html
<wc-select name="schema" class="col-1" lbl-label="Schema">
  <option value="">Choose...</option>
  {% set schema = Record.schema %}
  {% for sb in TemplateCollections._schema_builder %}
  <option value="{{sb.slug}}" {% if schema == sb.slug %} selected{% endif %}>{{sb.name}}</option>
  {% endfor %}
</wc-select>
```

**Designer needs:** Collection name, display field (e.g., `name`), value field (e.g., `slug`).
**At save:** Generate `{% for %}` over `TemplateCollections.collection_name`. Add collection to `_template_builder.collections[]`.

## Pattern 4: Static Enum / Inline Options (21 instances)
Options hard-coded as `<option>` tags. Values from schema enum or manually defined.

```html
<wc-select name="depend_full_request" class="col" lbl-label="Depend Full Req.">
  <option value="">Choose...</option>
  {% set depend_full = Record.depend_full_request %}
  <!-- Options from other data or hard-coded -->
</wc-select>
```

**Designer needs:** Enum values from schema (title-cased display), "Choose..." toggle.
**At save:** Output static `<option>` tags with value as-is, display in title case.

## Pattern 5: Items JSON (3 instances)
Options passed as a JSON string in the `items` attribute.

```html
<wc-select name="status" lbl-label="Status"
  value="{{ Record.status }}"
  items='[{"key":"Backlog","value":"backlog"},{"key":"Current Sprint","value":"current_sprint"}]'>
</wc-select>
```

**Designer needs:** JSON items editor (key/value pairs).
**At save:** Output `items` attribute with JSON string.

## Pattern 6: Chip + Dynamic (6 instances)
Multi-select with chip mode where users can add new values. Existing values from record array.

```html
<wc-select name="tags" mode="chip" class="col-1" lbl-label="Tags" multiple allow-dynamic>
  {% for tag in Record.tags %}
  <option value="{{ tag }}" selected>{{ tag }}</option>
  {% endfor %}
</wc-select>
```

**Designer needs:** Chip mode toggle, allow-dynamic toggle.
**At save:** Generate `{% for tag in Record.field %}` loop.

## Pattern 7: Chip + URL Template (dependent select) (22 instances)
Multi-select with chip mode where options URL depends on another field's value.

```html
<wc-select name="tgtDbNames" mode="chip" lbl-label="Target Database(s)"
  multiple
  data-url-template="/api/list-databases?connName={value}&filter=wec-dev"
  data-url-depends="tgtConnName"
  autocomplete="off" required>
</wc-select>
```

**Designer needs:** URL template field, depends-on field name.
**At save:** Output `data-url-template` and `data-url-depends` attributes.

## Also: wc-input Radio with Lookup
Not a wc-select but follows same lookup pattern.

```html
<wc-input name="gender" lbl-label="Gender" type="radio"
  radio-group-class="row modern" value="{{Record.gender}}">
  {% set gender = coalesce(Record, "gender", "") %}
  {% for item in Lookups.gender_type.item_list %}
  <option value="{{item.value}}"{% if gender == item.value %} checked{% endif %}>{{item.key}}</option>
  {% endfor %}
</wc-input>
```

## Summary: Data Source Types

| Source | Count | Property Panel Fields |
|--------|-------|----------------------|
| Lookup | 68 | Lookup name |
| Collection URL | 46 | URL, display-member, value-member |
| Collection Loop | 22 | Collection name, display field, value field |
| Static Enum | 21 | Enum values (from schema or manual) |
| Chip + URL Template | 22 | URL template, depends-on field |
| Chip + Dynamic | 6 | (just toggles: chip mode + allow-dynamic) |
| Items JSON | 3 | JSON key/value pairs |
