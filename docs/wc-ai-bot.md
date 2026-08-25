# WC-AI-Bot Web Component

`wc-ai-bot` is a chat assistant that runs a Large Language Model **in the browser** (no server
required) or, optionally, against a **hosted streaming backend**. It picks the best available
backend automatically, streams responses, renders Markdown, and adapts to the active Wave theme.

Three interchangeable **providers**:

| Provider | Where it runs | Model | Needs |
|---|---|---|---|
| **WebLLM** (MLC) | fully in-browser via **WebGPU** | Llama 3.2 (auto-sized) + others | a WebGPU-capable GPU; one-time model download |
| **Gemini Nano** | Chrome's built-in on-device AI | Gemini Nano (shared by Chrome) | desktop Chrome with built-in AI enabled |
| **Server** | your backend (SSE) | whatever your endpoint serves | an `endpoint` that streams `text/event-stream` |

It also has an **assistant mode** with slash-commands and pluggable knowledge bases (used by
Go Kart's schema/template/screen generators).

> **Related:** [`wc-hf-bot`](./wc-hf-bot.md) is the same UI/API but runs **Hugging Face
> Transformers.js** (ONNX) models instead of WebLLM/Nano/server.

## Features

- **Bring-your-own-backend:** WebLLM (WebGPU), Chrome's built-in **Gemini Nano**, or a **server SSE** endpoint — selected via `provider`.
- **Auto model sizing** for WebLLM based on detected GPU capability (Llama 3.2 3B on strong hardware, 1B on weaker).
- **Streaming** token-by-token responses with a busy state that reliably clears (SSE `done`/EOF/error), an `AbortController` per turn, and supersede-in-flight behavior.
- **Markdown rendering** (via `marked`): GFM tables (bordered, scroll on overflow), tight lists, wrapping long tokens, scrolling code fences — all theme-safe. Throw-safe (falls back to plain text).
- **Theme-aware bubbles** using surface tokens, so contrast follows the active light/dark theme.
- **Two layouts:** floating bubble (FAB + panel) or inline embed; configurable panel size.
- **Assistant mode:** slash-commands + knowledge bases loaded from URLs.
- **Graceful degradation:** GPU/availability gating, optional auto-hide, download affordance for Nano.
- HTMX-safe; No Shadow DOM.

## Quick start

```html
<script type="module" src="/dist/wave-css.min.js"></script>

<!-- Auto provider (Gemini Nano if available, else WebLLM), floating bubble -->
<wc-ai-bot
  title="AI Assistant"
  system-prompt="You are a helpful assistant."
  placeholder="Ask me anything…">
</wc-ai-bot>

<!-- Force in-browser WebLLM with a specific model, embedded inline -->
<wc-ai-bot
  provider="webllm"
  model="Llama-3.2-3B-Instruct-q4f32_1-MLC"
  theme="inline"
  system-prompt="You are a concise coding helper.">
</wc-ai-bot>

<!-- Chrome built-in Gemini Nano only; hide the widget where it can't run -->
<wc-ai-bot provider="gemini-nano" hide-if-unavailable="true"></wc-ai-bot>

<!-- Hosted streaming backend -->
<wc-ai-bot
  provider="server"
  endpoint="/api/chat"
  turnstile-site-key="0x4AAAAA...">
</wc-ai-bot>
```

## Attributes

| Attribute | Default | Description |
|---|---|---|
| `provider` | `auto` | Backend: `auto` \| `webllm` \| `gemini-nano` \| `server`. `auto` uses Gemini Nano if it's already available, otherwise WebLLM. |
| `model` | auto (WebLLM) | WebLLM model id (e.g. `Llama-3.2-3B-Instruct-q4f32_1-MLC`). If omitted, chosen from detected GPU capability. Ignored by `gemini-nano`/`server`. |
| `endpoint` | — | (server) URL that returns an SSE (`text/event-stream`) response. |
| `turnstile-site-key` | — | (server) Cloudflare Turnstile site key; loads the Turnstile script and includes a token. |
| `bot-id` | `default` | Identifier included in event details and used for per-bot state. (Slash-commands in assistant mode route by the typed command, not by `bot-id`.) |
| `mode` | (chat) | `assistant` enables slash-commands + knowledge bases (see below). |
| `system-prompt` | — | System instruction that shapes the assistant. Updatable at runtime. |
| `title` | — | Header title text. |
| `placeholder` | — | Input placeholder text. |
| `theme` | `bubble` | `bubble` = floating action button + panel. Any other value (e.g. `inline`) embeds the bot in its container. |
| `position` | — | (bubble) corner placement of the FAB/panel. |
| `auto-open` | — | (bubble) open the panel on load. |
| `panel-width` / `panel-height` | `350` / `500` | (bubble) panel size; clamped to `92vw` / `85vh` (and `calc(100v* − 2rem)` on ≤640px). Also settable via `--wc-ai-bot-panel-width` / `--wc-ai-bot-panel-height`. `panel-height` falls back to `max-height`. |
| `max-height` | — | Max panel/body height (fallback for `panel-height`). |
| `temperature` | model default | Sampling temperature. |
| `max-tokens` | model default | Max tokens to generate. |
| `check-gpu-compatibility` | — | Gate rendering on a GPU-capability check (WebLLM only; Nano/server skip it). |
| `force-enable` | — | Bypass the GPU capability gate. |
| `hide-if-unavailable` | — | Remove the component if the resolved provider can't run (great with `gemini-nano`). |
| `debug` | — | Verbose console logging. |
| `context-urls` | — | (assistant) comma-separated URLs of JSON knowledge bases to load. |
| `context-window-size` | — | (assistant) trim retrieved context to this size. |
| `query-context` | — | (assistant) extra context for `/query`. |

## Events

All events are dispatched on the element (bubbling, composed) with a **lowercase canonical name
plus a legacy `bot:*` alias**. `detail` shapes noted in parentheses.

| Event (canonical / legacy) | When |
|---|---|
| `wcbotready` / `bot:ready` | Model/session is ready to chat (`{ botId, model }`). |
| `wcbotmessagesent` / `bot:message-sent` | User sent a message (`{ botId, message }`). |
| `wcbotresponsereceived` / `bot:response-received` | A response finished (`{ botId, response }`). |
| `wcboterror` / `bot:error` | Any failure (`{ botId, error }`). |
| `wcbotunsupported` / `bot:unsupported` | Backend can't run on this browser/device (`{ botId, reason }`). |
| `wcbotconversationcleared` / `bot:conversation-cleared` | Conversation reset. |
| `wcbotclosed` / `bot:closed` | Bubble panel closed. |
| `wcbotdownloadrequired` / `bot:download-required` | (Gemini Nano) one-time, gesture-gated model download is needed (`{ botId, availability }`). |
| `wcbotdownloadprogress` / `bot:download-progress` | Model download progress (`{ botId, loaded }`). |

## Methods

**Instance:**

| Method | Description |
|---|---|
| `sendMessage(text)` | Programmatically send a user turn. |
| `clearConversation()` | Reset the conversation history. |
| `exportConversation()` | Return the conversation (e.g. for saving/logging). |
| `setContext(systemPrompt)` | Replace the system prompt at runtime. |
| `toggleMinimize()` | Open/close the bubble panel. |

**Static:**

| Method | Description |
|---|---|
| `WcAiBot.checkSystemSupport()` | Detect WebGPU/GPU capability + whether a backend can run. |
| `WcAiBot.getAvailableModels()` | List selectable WebLLM models. |
| `WcAiBot.clearStoredPreferences()` | Clear cached capability/model preferences. |

## Providers in depth

### WebLLM (in-browser, WebGPU)
Runs the model entirely on the client via [WebLLM/MLC](https://webllm.mlc.ai). The model is
downloaded once and **shared across bot instances**. Capability is auto-detected; the default
model is `Llama-3.2-3B-Instruct-q4f32_1-MLC` on strong GPUs and `Llama-3.2-1B-Instruct-q4f32_1-MLC`
on weaker ones. Set `model` to override, `check-gpu-compatibility`/`force-enable` to control gating.

### Gemini Nano (Chrome built-in, on-device)
Uses Chrome's built-in AI `LanguageModel` API. The model is provided by Chrome and shared across
sites. States: `available` → chat immediately; `downloadable`/`downloading` → the bot renders a
**Download** affordance (Chrome requires a user gesture to start the multi-GB download) and emits
`wcbotdownloadrequired` then `wcbotdownloadprogress`; `unavailable` → shows an unsupported panel
(or self-removes with `hide-if-unavailable`). With `provider="auto"` the bot falls back to WebLLM
if Nano can't run; with `provider="gemini-nano"` it never falls back.
See the deep-dive & a minimal standalone version in `_docs/presentation/gemini_nano/`.

### Server (hosted SSE)
Set `provider="server"` + `endpoint`. The bot POSTs the conversation and consumes a streaming
`text/event-stream` response. The busy state clears on the SSE `done` event (the reader is
cancelled so heartbeats can't hang the turn), on EOF, and on `error`. Each turn uses an
`AbortController`; sending again while busy supersedes the in-flight turn (preserving its partial
answer). Optionally protect the endpoint with Cloudflare **Turnstile** via `turnstile-site-key`.

## Assistant mode (`mode="assistant"`)

Turns the bot into a command-driven generator. Type a slash-command to route to a specialized
system prompt:

`/create-schema` · `/create-template` · `/create-list` · `/create-edit` · `/create-screen` ·
`/create-component` · `/create-web-pilot` · `/query` · `/help`

Load JSON **knowledge bases** with `context-urls="/kb/a.json,/kb/b.json"`; use
`context-window-size` to cap retrieved context and `query-context` to feed `/query`. This is how
Go Kart's in-app schema/template/screen assistants are built.

## Styling

- Message bubbles use theme surface tokens: bot = `--surface-2`, user = accent-tinted `--surface-3`,
  text = `--text-1`, links = `--accent` — so contrast tracks the active light/dark theme.
- Bubble panel size: `panel-width`/`panel-height` attributes or
  `--wc-ai-bot-panel-width`/`--wc-ai-bot-panel-height` custom properties (defaults 350×500,
  clamped to 92vw/85vh).

## Testing / requirements

- **WebLLM:** a WebGPU-capable browser + GPU (Chrome/Edge; Apple Silicon and RTX-class GPUs work
  well). First run downloads the model (hundreds of MB – GBs), cached by the browser.
- **Gemini Nano:** desktop Chrome with built-in AI enabled (Early Preview Program + `chrome://flags`);
  see `_docs/presentation/gemini_nano/` for exact steps and a `demo.html`.
- **Server:** any endpoint that streams SSE.
- Example pages: `views/ai-bot.html`, `views/ai-bot-assistant.html`, `views/company-bot-example.html`.

## Dependencies (lazy-loaded, CDN with self-host fallback)

- **WebLLM** core (`@mlc-ai/web-llm`) via the dependency manager (respects `WaveAssetBase`).
- **marked** (`marked-4`) for Markdown rendering.
- **Cloudflare Turnstile** script (server mode, only when `turnstile-site-key` is set).

## Browser support

Custom Elements v1 + CSS custom properties. WebLLM requires **WebGPU**; Gemini Nano requires
Chrome's built-in AI. Server mode works anywhere `fetch` + SSE do.
