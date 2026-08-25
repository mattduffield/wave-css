# WC-Combobox Web Component

A single-value combobox: type free text AND/OR pick from DB-loaded suggestions. Like `wc-select` it can load options from a URL (`display-member` / `value-member` / `results-member` / `sort`) but, unlike `wc-select`, it always allows the user to keep whatever they type (true combobox behavior).

> Related: [wc-select](./wc-select.md) (fixed-option dropdown), [wc-record-lookup](./wc-record-lookup.md) (search an existing collection).

## Features

- Type free text or pick a suggestion — custom values are always allowed
- Declarative `<option>` children, or options loaded from a `url`
- Client-side filter (load-once) or server-side search when `url` contains a `{query}` placeholder (or via `search-param`), with `min-chars` / `debounce`
- `select-first` (opt-in): default to the first option when the value is empty and options exist — never overrides an already-set value
- `depends-on` multi-parent declarative cascade (substitutes each parent's value into the `url` via `{name}` placeholders and re-fetches on parent change)
- Form-associated (FACE) — submits the option's value-member or the raw typed text
- Keyboard navigation (Arrow / Enter / Escape)

## Basic Usage

```html
<!-- Declarative options -->
<wc-combobox name="status" lbl-label="Status" value="open">
  <option value="open">Open</option>
  <option value="closed">Closed</option>
</wc-combobox>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Form field name; submitted via FACE |
| `value` | "" | Selected value (seeds + round-trips) |
| `items` | — | Inline options (alternative to `<option>` children / `url`) |
| `url` | — | Endpoint to load options; include a `{query}` placeholder for server-side search |
| `display-member` | — | Object member used as the visible label |
| `value-member` | — | Object member used as the stored/submitted value |
| `results-member` | — | Member of the response holding the results array |
| `sort` | — | Sort order applied to loaded options |
| `search-param` | — | Query-string param name for server-side search |
| `min-chars` | — | Minimum characters before a server search fires |
| `debounce` | — | Debounce (ms) for server search |
| `placeholder` | "" | Input placeholder |
| `lbl-label` | "" | Field label text |
| `disabled` | — | Disables the field |
| `required` | — | Marks the field required |
| `autofocus` | — | Focus the input on connect |
| `elt-class` | — | Extra class(es) applied to the inner control |
| `depends-on` | — | Space-separated parent field names; gates fetch and re-fetches on parent change |
| `select-first` | — | When empty and options exist, default to the first option and emit `wccomboboxchange` |

## Events

| Event | detail | When |
|-------|--------|------|
| `wccomboboxinput` (legacy alias `combobox:input`) | `{ query }` | While typing |
| `wccomboboxchange` (legacy alias `combobox:change`) | `{ value, … }` | On value change (also fires a native `change` event) |
| `wcoptionsloaded` (legacy alias `optionsloaded`) | — | After URL options finish loading |

## Examples

```html
<!-- DB-loaded options, client-side filter -->
<wc-combobox name="manufacturer" lbl-label="Manufacturer"
  url="/api/manufacturers" display-member="name" value-member="id"
  value="{{ Record.manufacturer }}"></wc-combobox>
```

```html
<!-- Server-side search for large datasets ({query} placeholder) -->
<wc-combobox name="city" lbl-label="City"
  url="/api/cities?q={query}" display-member="name" value-member="code"
  min-chars="2" debounce="250"></wc-combobox>
```

```html
<!-- Cascading conn → db → collection with zero hyperscript -->
<wc-combobox name="connection" url="/api/connections" select-first></wc-combobox>
<wc-combobox name="database" url="/api/dbs?conn={connection}"
             depends-on="connection" select-first></wc-combobox>
<wc-combobox name="collection" url="/api/cols?conn={connection}&db={database}"
             depends-on="connection database" select-first></wc-combobox>
```

## Notes

- The submitted value is the selected option's value-member, or the raw typed text for a custom value. The visible `<input>` holds display text only and carries no name, so the host's `setFormValue()` is the single value submitted (native forms and HTMX `hx-include` alike).
- `select-first` never overrides an already-set value (server-rendered / restored / user-picked); it re-defaults on a later reload when empty.
- `depends-on` parents are matched by `name`/`data-name`, resolved to the nearest match, and reacted to via bubbling `wccomboboxchange` (htmx-safe). A parent going empty clears and collapses the dependent.
- Extends `WcBaseFormComponent`.
