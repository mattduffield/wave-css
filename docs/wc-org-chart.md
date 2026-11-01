# wc-org-chart

Event org chart for a live production (built for go-kart's Informa Events: ~20 stations, ~250 volunteers).
Leadership tiers on top, then titled groups of stations in a responsive grid, each with its leads and
members, and an optional **Not placed** pool. Directors move people between stations; everyone else views it
(`readonly`).

```html
<wc-org-chart
  tiers='[{"title":"Co-Director","people":[{"id":"p1","name":"Ann Lee","phone":"555-0100"}]},
          {"title":"Assistant Director","people":[…]}]'
  groups='[{"title":"Scenes","nodes":[{
             "id":"n1","title":"Shepherds","href":"/station/n1","count":6,"needed":8,
             "flags":["no-lead","short:2"],
             "leads":[{"id":"l1","name":"Bo Diaz","title":"Scene lead","phone":"555-0101"}],
             "members":[{"id":"m1","name":"Cy Park","sub":"Soprano","phone":"555-0102","state":"tonight-only"}]}]},
           {"title":"Travel with the groups","nodes":[…]},
           {"title":"Support","nodes":[…]}]'
  pool='{"title":"Not placed","members":[…]}'>
</wc-org-chart>
```

## Data

| Attribute | Shape |
|---|---|
| `tiers` | `[{title, people:[{id, name, phone}]}]` — one centered row per title, at the top |
| `groups` | `[{title, nodes:[node]}]` — titled sections ("Scenes", "Travel with the groups", "Support") |
| node | `{id, title, href, count, needed, flags, leads:[{id,name,title,phone}], members:[member]}` |
| member | `{id, name, sub, phone, state}` — `sub` is extra text such as a part ("Soprano") |
| `pool` | `{title?, members:[member]}` or just `[member]` — the **Not placed** node (id `__pool__`) |
| `readonly` | boolean — no dragging, no **Move to…** in the menu (Edit stays) |

- `state`: `""` · `"out"` (not there tonight — shown in a lighter text level and struck through; still
  ≥ 4.5:1) · `"tonight-only"` (an info chip).
- `flags`: `"no-lead"` → danger badge **No lead**, `"short:N"` → warning badge **Short N**, anything else →
  muted badge with the text.
- The header shows the live member count and `/ needed`; it updates as people move. A node's `count` is
  accepted but not shown — a passed-in count would go stale after a drag. Leads show a **Lead**
  badge and their title, separate from the members. The node title links to `href`.

## Moving people

- **Drag** — pointer events, so mouse, touch and pen all work. Mouse: drag the row. Touch and pen: drag the
  ⠿ grip (`touch-action: none`), so touching anywhere else on a row still scrolls the page. A ghost follows
  the pointer, the original dims, the node under the pointer gets a thick outline, and the page (or the
  nearest scrollable ancestor) auto-scrolls within 64px of the top/bottom edge. No reordering within a node.
- **Menu** — every member has a ⋯ button (the keyboard and phone path): **Move to…** lists every node
  (grouped, the current one marked) plus **Not placed**, and **Edit…** emits `wcorgchartedit`. Arrow keys,
  Home/End, Enter, Esc; focus returns to the ⋯ button. The menu is a body-level popover (never clipped) and
  carries the page's theme.
- Moves are announced in a polite live region.

## Events and methods

| | |
|---|---|
| `wcorgchartmove` | `{memberId, fromNode, toNode, source}` — **cancelable**, bubbles. The UI moves at once; `preventDefault()` returns the card immediately. `source`: `drag`, `drag-touch`, `drag-pen`, `menu`, `api`. |
| `wcorgchartedit` | `{memberId}` |
| `revert(memberId)` | Send a card back to where it was before its last move (e.g. the htmx save failed). Returns `true`/`false`. |
| `move(memberId, toNodeId)` | Programmatic move (emits `wcorgchartmove`). |
| `nodeOf(memberId)` | The member's current node id (`__pool__` for the pool). |
| `refresh()` | Re-read the attributes and re-render. |

```js
chart.addEventListener('wcorgchartmove', async (e) => {
  const { memberId, toNode } = e.detail;
  const ok = await fetch(`/station/${toNode}/members/${memberId}`, { method: 'PUT' }).then(r => r.ok, () => false);
  if (!ok) chart.revert(memberId);
});
```

## Layout, print, theming

- Groups lay their nodes out in a grid sized by the **chart's own width** (container queries): 1 column under
  640px, 3 from 640px, 4 from 1024px.
- **Print**: landscape (`@page { size: landscape }`), a compact 4-column grid, nodes never split across pages
  (`break-inside: avoid` — verified on the real PDF), grips and menus hidden.
- Wave tokens only: text uses `--text-1`…`--text-5` (all ≥ 4.5:1 on every surface), borders `--text-9`
  (≥ 3:1), the drop outline `--text-1`, flags/leads/chips are Wave badges. Verified in all 54 themes ×
  light/dark/follow-the-OS × OS light/dark × regular/`.crisp` (`tests/org-chart-contrast-test.py`).
- htmx-safe: re-attaching the element leaves no global listeners behind.

Demo: `views/org-chart.html`. Tests: `tests/org-chart-test.py` (mouse, touch, pen drag, auto-scroll,
keyboard Move to…, Edit, cancel, revert, readonly, print incl. a real-PDF page check, 252 members/20 nodes
performance, cleanup) and `tests/org-chart-contrast-test.py`.
