# WC-HF-Bot Web Component

`wc-hf-bot` is a chat assistant that runs a Hugging Face **Transformers.js** model **entirely in
the browser** — no server, no API key. It shares the same UI, attributes, events, and methods as
[`wc-ai-bot`](./wc-ai-bot.md), but its inference engine is
[Transformers.js](https://huggingface.co/docs/transformers.js) running **ONNX** models, rather than
WebLLM / Gemini Nano / a server backend.

Use it when you want a **specific Hugging Face model** running client-side (it works without WebGPU —
Transformers.js can run on WASM/CPU), and you don't need Gemini Nano, a hosted backend, or the
assistant/slash-command features.

> **Related:** [`wc-ai-bot`](./wc-ai-bot.md) — same UI/API, but WebLLM (WebGPU) / Chrome Gemini
> Nano / server SSE providers, plus assistant mode and knowledge bases.

## Features

- **In-browser inference** via Transformers.js (ONNX). Downloads the model once (browser-cached, shared across bot instances).
- **Auto model sizing** from detected GPU/hardware capability (`Xenova/gpt2` on stronger hardware, `Xenova/distilgpt2` on weaker).
- **Streaming** responses, **Markdown rendering** (via `marked`), and **theme-aware** bubbles — identical UX to `wc-ai-bot`.
- **Two layouts:** floating bubble (FAB + panel) or inline embed.
- **Graceful degradation:** capability gating (`check-gpu-compatibility` / `force-enable`) and an unsupported panel.
- HTMX-safe; No Shadow DOM.

## Quick start

```html
<script type="module" src="/dist/wave-css.min.js"></script>

<!-- Tiny default model, floating bubble -->
<wc-hf-bot
  title="HF Assistant"
  system-prompt="You are helpful."
  placeholder="Ask me…">
</wc-hf-bot>

<!-- Pick a specific HF/ONNX model, embedded inline -->
<wc-hf-bot
  model="Xenova/gpt2"
  theme="inline"
  system-prompt="You are a concise assistant.">
</wc-hf-bot>
```

## Attributes

| Attribute | Default | Description |
|---|---|---|
| `model` | auto | Hugging Face/ONNX model id for Transformers.js (e.g. `Xenova/distilgpt2`, `Xenova/gpt2`, `Xenova/gpt2-medium`). If omitted, chosen from detected capability. |
| `bot-id` | `default` | Identifier used for events and per-bot state. |
| `system-prompt` | — | System instruction (used when the model supports chat templates). |
| `title` | — | Header title text. |
| `placeholder` | — | Input placeholder text. |
| `theme` | `bubble` | `bubble` = floating action button + panel. Any other value (e.g. `inline`) embeds the bot in its container. |
| `position` | — | (bubble) corner placement of the FAB/panel. |
| `auto-open` | — | (bubble) open the panel on load. |
| `max-height` | — | Max panel/body height. |
| `temperature` | model default | Sampling temperature. |
| `max-tokens` | model default | Max tokens to generate. |
| `check-gpu-compatibility` | — | Gate rendering on a hardware-capability check. |
| `force-enable` | — | Bypass the capability gate. |
| `debug` | — | Verbose console logging. |

> **Not supported here** (use `wc-ai-bot`): `provider`, `endpoint`, `turnstile-site-key`,
> `hide-if-unavailable`, `mode="assistant"`, `context-urls` / `context-window-size` / `query-context`,
> and `panel-width` / `panel-height`.

## Events

Dispatched on the element (bubbling, composed), each with a **lowercase canonical name plus a
legacy `bot:*` alias**.

| Event (canonical / legacy) | When |
|---|---|
| `wcbotready` / `bot:ready` | Model is loaded and ready to chat. |
| `wcbotmessagesent` / `bot:message-sent` | User sent a message. |
| `wcbotresponsereceived` / `bot:response-received` | A response finished. |
| `wcboterror` / `bot:error` | Any failure. |
| `wcbotunsupported` / `bot:unsupported` | Can't run on this browser/device. |
| `wcbotconversationcleared` / `bot:conversation-cleared` | Conversation reset. |
| `wcbotclosed` / `bot:closed` | Bubble panel closed. |

## Methods

**Instance:** `sendMessage(text)` · `clearConversation()` · `exportConversation()` ·
`setContext(systemPrompt)` · `toggleMinimize()`

**Static:** `WcHfBot.checkSystemSupport()` · `WcHfBot.getAvailableModels()` ·
`WcHfBot.clearStoredPreferences()`

## Models

Transformers.js ONNX models, e.g.:

| Model id | Notes |
|---|---|
| `Xenova/distilgpt2` | Tiny (~250 MB) — default on weaker hardware; good for testing. |
| `Xenova/gpt2` | GPT‑2 Small (~500 MB) — default on stronger hardware. |
| `Xenova/gpt2-medium` | Better quality (~1.5 GB). |

Any Transformers.js-compatible text-generation model id can be used via `model`. Models with chat
templates (e.g. Llama-family ONNX builds) apply the `system-prompt` through the template.

## Styling

Same theming as `wc-ai-bot`: bubbles use `--surface-2` (bot) / accent-tinted `--surface-3` (user),
text `--text-1`, links `--accent`, so contrast follows the active light/dark theme.

## Dependencies (lazy-loaded, CDN with self-host fallback)

- **Transformers.js** — `@huggingface/transformers@3.5.0` (with `@xenova/transformers@2.17.2` as a fallback), loaded via `waveImport` (respects `WaveAssetBase`).
- **marked** (`marked-4`) for Markdown rendering.

## Testing / requirements

- Any modern browser; **WebGPU accelerates** inference but isn't strictly required (WASM/CPU fallback).
- First run downloads the selected model (browser-cached).
- Example page: `views/hf-bot.html`.

## Browser support

Custom Elements v1 + CSS custom properties. Inference speed depends on WebGPU/WASM support and the
chosen model size.
