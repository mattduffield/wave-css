# Wave CSS Color & Token Reference

The catalog of CSS custom properties (and their utility classes) that Wave themes expose. For
**how** these are generated and switched, see [`THEMES.md`](./THEMES.md).

> **Golden rule:** style with these **role tokens**, never hardcoded hex. They resolve correctly in
> every theme and in both light/dark automatically.

---

## Generator knobs

| Token | Range | Effect |
|---|---|---|
| `--hue` | 0–360 | Color-wheel angle the whole palette is built around. |
| `--chroma-mult` | 0–1+ | Saturation multiplier. `1` full · `0` grayscale · `0.15` muted tint. |

## Swatch ramp (raw palette)

`--swatch-1 … --swatch-13`, light → dark, generated as
`oklch(<fixed L> calc(<baseC> * var(--chroma-mult,1)) var(--hue))`.

| Swatch | ~Role |
|---|---|
| `--swatch-1` … `--swatch-4` | lightest tints (light-mode backgrounds) |
| `--swatch-5` … `--swatch-7` | mid / **vivid accent** (`--swatch-7` is the brand accent) |
| `--swatch-8` … `--swatch-10` | darker mids |
| `--swatch-11` … `--swatch-13` | darkest shades (dark-mode backgrounds) |

You rarely use swatches directly — prefer the **role tokens** below (mapped from swatches per mode).

---

## Surfaces & text (the everyday tokens)

| Token family | Tokens | Use for |
|---|---|---|
| **Surfaces** | `--surface-1 … --surface-13` | Backgrounds, page → elevated (`--surface-1` = base page, higher = more elevated). |
| **Text** | `--text-1 … --text-13` | Foreground text (`--text-1` = strongest/primary, `--text-2`/`--text-3` = muted). |
| **Component** | `--component-bg-color`, `--component-border-color`, `--component-color`, `--component-alt-color`, `--component-placeholder-color`, `--component-disabled-bg-color`, `--component-disabled-text-color`, `--component-focus-border-color`, `--component-focus-ring-color` | Inputs/controls. |
| **Card** | `--card-bg-color`, `--card-border-color`, `--card-color` | `.card` surfaces. |
| **Container** | `--container-bg-color`, `--container-border-color`, `--container-color` | Larger containers/panels. |

## Primary / secondary (the accent)

| Token | Meaning |
|---|---|
| `--primary-bg-color` | The theme accent **fill** (bright/saturated in both light & dark). |
| `--primary-color` | The theme's on-primary text color (⚠ flips per mode — for text on the accent prefer `--wc-on-primary`). |
| `--primary-hover-color`, `--primary-light` | Accent hover / light variant. |
| `--secondary-bg-color` | Secondary/neutral fill. |
| **`--wc-on-primary`** | **Auto-contrast** black/white for text sitting on `--primary-bg-color` — AA in every theme. Use this for on-accent text. |

## Semantic state colors

Fixed in `:root`, auto-nudged one shade under `prefers-color-scheme`:

| Family | Tokens | Utility classes |
|---|---|---|
| Success | `--success-color` (#22c55e), `--success-light-color` | `success-color`, `success-bg-color`, `success-border-color`, `success-light-color` |
| Danger | `--danger-color` (#ef4444), `--danger-light-color` | `danger-color`, `danger-bg-color`, `danger-border-color`, `danger-light-color` |
| Warning | `--warning-color` (#f59e0b), `--warning-light-color` | `warning-color`, `warning-bg-color`, `warning-border-color`, `warning-light-color` |
| Info | `--info-color` (#3b82f6), `--info-light-color` | `info-color`, `info-bg-color`, `info-border-color`, `info-light-color` |

**On-surface foreground** (legible accent-as-text on a surface): `.on-surface-accent` (set
`--accent` inline) + conveniences `.on-surface-success/-danger/-warning/-info`. Use these when an
accent is rendered as **text/icon**; use the raw `--*-color` for **fills**.

**Badges:** `badge badge-{success|warning|danger|info|muted|primary}` — foreground is the accent
mixed 55% toward `--text-1` so it stays AA on light and dark.

**Buttons:** `.btn` + `.btn-{primary|secondary|cancel|success|danger|warning|info}` (and
`.btn-outline`). Bare `.btn` label auto-contrasts (black/white) against its own fill; all variants
verified AA across themes × light/dark.

## Accent family (`.crisp` mode only)

Opt into `crisp` to get a vivid, AA-safe accent set (see [`THEMES.md` §5](./THEMES.md)):

| Token | Meaning | Utility |
|---|---|---|
| `--accent` | vivid brand hue | — |
| `--accent-hover` | hover shade | — |
| `--on-accent` | fg on `--accent-fill-bg` | — |
| `--accent-fill-bg` | the accent fill | `.accent-fill` |
| `--accent-soft` / `--on-accent-soft` | subtle offset fill + its fg | `.accent-soft-fill` |
| `--accent-border` | accent-derived border/ring | `.accent-border-color` |

---

## Examples

```css
/* A themed card — resolves in every theme + mode, no hex */
.my-panel {
  background: var(--surface-2);
  color: var(--text-1);
  border: 1px solid var(--surface-4);
}

/* Text on the accent fill — always legible */
.my-header {
  background: var(--primary-bg-color);
  color: var(--wc-on-primary);
}

/* Dark-mode tweak (mode is a class on <html>) */
.dark .my-panel { box-shadow: 0 1px 6px rgba(0,0,0,.4); }
```

See [`THEMES.md`](./THEMES.md) for the generator, light/dark mapping, `.crisp`, neutral themes,
cascade layers, and adding a theme.
