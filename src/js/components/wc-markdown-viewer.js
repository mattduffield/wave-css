/**
 * Name: wc-markdown-viewer
 * Usage:
 *   <wc-markdown-viewer>
 *     <h1>My Doc</h1>
 *     <pre><code class="language-json">{"key": "value"}</code></pre>
 *   </wc-markdown-viewer>
 *
 * Description:
 *   Enhances goldmark-rendered markdown HTML with syntax highlighting (Prism.js)
 *   and copy-to-clipboard buttons on code blocks. Auto-processes content on connect
 *   and after HTMX swaps.
 *
 * Attributes:
 *   - theme: (optional) Prism theme name override (default: auto-detect dark/light)
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-markdown-viewer')) {
  class WcMarkdownViewer extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'theme'];
    }

    static get is() {
      return 'wc-markdown-viewer';
    }

    // Map language aliases to Prism component names
    static LANG_MAP = {
      'js': 'javascript',
      'ts': 'typescript',
      'sh': 'bash',
      'shell': 'bash',
      'zsh': 'bash',
      'yml': 'yaml',
      'py': 'python',
      'rb': 'ruby',
      'html': 'markup',
      'xml': 'markup',
      'svg': 'markup',
      'md': 'markdown',
    };

    constructor() {
      super();
      this._processed = new WeakSet();

      const compEl = this.querySelector('.wc-markdown-viewer');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-markdown-viewer');
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      await this._loadPrism();
      this._enhanceCodeBlocks();
      this._wireEvents();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    _render() {
      super._render();

      // Move children into componentElement if not already there
      const children = Array.from(this.childNodes).filter(
        n => n !== this.componentElement && n.nodeType !== Node.COMMENT_NODE
      );
      if (children.length > 0) {
        children.forEach(child => this.componentElement.appendChild(child));
      }
    }

    // ── Prism Loading ─────────────────────────────────────────────────────────

    async _loadPrism() {
      // Load Prism core
      if (!window.Prism) {
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js');
        // Disable Prism auto-highlighting — we control when it runs
        if (window.Prism) {
          Prism.manual = true;
        }
      }

      // Load theme CSS
      const themeName = this._getPrismTheme();
      await this.loadCSS(`https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/${themeName}.min.css`);

      // Detect languages used in code blocks and load their components
      const langs = this._detectLanguages();
      for (const lang of langs) {
        if (lang === 'markup' || lang === 'css' || lang === 'clike' || lang === 'javascript') {
          continue; // Included in core
        }
        const url = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${lang}.min.js`;
        try {
          await this.loadScript(url);
        } catch (e) {
          // Language component not available — skip silently
        }
      }
    }

    _getPrismTheme() {
      const override = this.getAttribute('theme');
      if (override) return override;

      const isDark = document.documentElement.classList.contains('dark');
      return isDark ? 'prism-tomorrow' : 'prism';
    }

    _detectLanguages() {
      const codeEls = this.componentElement.querySelectorAll('pre > code[class*="language-"]');
      const langs = new Set();
      codeEls.forEach(el => {
        const match = el.className.match(/language-(\S+)/);
        if (match) {
          const lang = match[1];
          const mapped = WcMarkdownViewer.LANG_MAP[lang] || lang;
          langs.add(mapped);
        }
      });
      return langs;
    }

    // ── Code Block Enhancement ────────────────────────────────────────────────

    _enhanceCodeBlocks() {
      if (!window.Prism) return;

      const codeEls = this.componentElement.querySelectorAll('pre > code[class*="language-"]');
      codeEls.forEach(codeEl => {
        if (this._processed.has(codeEl)) return;
        this._processed.add(codeEl);

        // Highlight with Prism
        Prism.highlightElement(codeEl);

        // Wrap <pre> in a container and add copy button
        const pre = codeEl.parentElement;
        if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.classList.add('code-block-wrapper');
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        // Language badge
        const match = codeEl.className.match(/language-(\S+)/);
        if (match) {
          const badge = document.createElement('span');
          badge.classList.add('code-block-lang');
          badge.textContent = match[1];
          wrapper.appendChild(badge);
        }

        // Copy button
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.classList.add('code-copy-btn');
        btn.title = 'Copy';
        btn.innerHTML = '<wc-fa-icon name="copy" size="0.75rem"></wc-fa-icon>';
        btn.addEventListener('click', () => this._copyCode(codeEl, btn));
        wrapper.appendChild(btn);
      });

      // Also handle <pre><code> without language class (plain text blocks)
      const plainCodeEls = this.componentElement.querySelectorAll('pre > code:not([class*="language-"])');
      plainCodeEls.forEach(codeEl => {
        if (this._processed.has(codeEl)) return;
        this._processed.add(codeEl);

        const pre = codeEl.parentElement;
        if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.classList.add('code-block-wrapper');
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.classList.add('code-copy-btn');
        btn.title = 'Copy';
        btn.innerHTML = '<wc-fa-icon name="copy" size="0.75rem"></wc-fa-icon>';
        btn.addEventListener('click', () => this._copyCode(codeEl, btn));
        wrapper.appendChild(btn);
      });
    }

    _copyCode(codeEl, btn) {
      const text = codeEl.textContent;
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '<wc-fa-icon name="check" size="0.75rem"></wc-fa-icon>';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = '<wc-fa-icon name="copy" size="0.75rem"></wc-fa-icon>';
          btn.classList.remove('copied');
        }, 2000);
      }).catch(() => {
        // Fallback for insecure contexts
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.innerHTML = '<wc-fa-icon name="check" size="0.75rem"></wc-fa-icon>';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = '<wc-fa-icon name="copy" size="0.75rem"></wc-fa-icon>';
          btn.classList.remove('copied');
        }, 2000);
      });
    }

    // ── Events ────────────────────────────────────────────────────────────────

    _wireEvents() {
      // Re-process after HTMX swaps new content in
      this._handleAfterSettle = (e) => {
        if (this.contains(e.detail?.target) || e.detail?.target === this.componentElement) {
          this._loadPrism().then(() => this._enhanceCodeBlocks());
        }
      };
      document.body.addEventListener('htmx:afterSettle', this._handleAfterSettle);
    }

    _unWireEvents() {
      if (this._handleAfterSettle) {
        document.body.removeEventListener('htmx:afterSettle', this._handleAfterSettle);
      }
    }

    _handleAttributeChange(attrName, newValue) {
      if (attrName === 'theme') {
        // Reload theme CSS
        this._loadPrism();
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _applyStyle() {
      const style = `
        wc-markdown-viewer {
          display: contents;
        }
        .wc-markdown-viewer {
          line-height: 1.6;
        }

        /* Code block wrapper */
        .code-block-wrapper {
          position: relative;
          margin: 0.75rem 0;
        }
        .code-block-wrapper pre {
          margin: 0;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
        }

        /* Language badge */
        .code-block-lang {
          position: absolute;
          top: 0;
          left: 0.75rem;
          padding: 0 0.375rem;
          font-size: 0.625rem;
          font-family: monospace;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-6);
          background: var(--surface-3);
          border-radius: 0 0 0.25rem 0.25rem;
          user-select: none;
        }

        /* Copy button */
        .code-copy-btn {
          position: absolute;
          top: 0.375rem;
          right: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.75rem;
          height: 1.75rem;
          border: none;
          border-radius: 0.25rem;
          background: var(--surface-4);
          color: var(--text-4);
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s, background 0.2s, color 0.2s;
        }
        .code-block-wrapper:hover .code-copy-btn {
          opacity: 1;
        }
        .code-copy-btn:hover {
          background: var(--surface-5);
          color: var(--text-1);
        }
        .code-copy-btn.copied {
          opacity: 1;
          color: var(--success-text-color, #4caf50);
        }

        /* Prism overrides for dark theme consistency */
        .wc-markdown-viewer pre[class*="language-"] {
          background: var(--surface-2) !important;
          border: 1px solid var(--surface-5);
        }
        .wc-markdown-viewer code[class*="language-"] {
          font-size: 0.8125rem;
          font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Consolas', monospace;
        }

        /* Inline code (not in pre blocks) */
        .wc-markdown-viewer code:not([class*="language-"]):not(pre code) {
          padding: 0.125rem 0.375rem;
          font-size: 0.8125rem;
          background: var(--surface-3);
          border-radius: 0.25rem;
          font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Consolas', monospace;
        }

        /* Markdown content styling */
        .wc-markdown-viewer h1 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
        .wc-markdown-viewer h2 { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem; border-bottom: 1px solid var(--surface-4); padding-bottom: 0.25rem; }
        .wc-markdown-viewer h3 { font-size: 1.1rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .wc-markdown-viewer h4 { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.375rem; }
        .wc-markdown-viewer p { margin: 0.5rem 0; }
        .wc-markdown-viewer ul, .wc-markdown-viewer ol { margin: 0.5rem 0; padding-left: 1.5rem; }
        .wc-markdown-viewer li { margin: 0.25rem 0; }
        .wc-markdown-viewer blockquote {
          margin: 0.75rem 0;
          padding: 0.5rem 1rem;
          border-left: 3px solid var(--primary-bg-color);
          background: var(--surface-2);
          border-radius: 0 0.25rem 0.25rem 0;
        }
        .wc-markdown-viewer table {
          border-collapse: collapse;
          margin: 0.75rem 0;
          width: 100%;
        }
        .wc-markdown-viewer th, .wc-markdown-viewer td {
          border: 1px solid var(--surface-5);
          padding: 0.375rem 0.75rem;
          text-align: left;
          font-size: 0.8125rem;
        }
        .wc-markdown-viewer th {
          background: var(--surface-3);
          font-weight: 600;
        }
        .wc-markdown-viewer a {
          color: var(--primary-bg-color);
          text-decoration: none;
        }
        .wc-markdown-viewer a:hover {
          text-decoration: underline;
        }
        .wc-markdown-viewer hr {
          border: none;
          border-top: 1px solid var(--surface-4);
          margin: 1rem 0;
        }
        .wc-markdown-viewer img {
          max-width: 100%;
          border-radius: 0.375rem;
        }
      `.trim();
      this.loadStyle('wc-markdown-viewer-style', style);
    }
  }

  customElements.define('wc-markdown-viewer', WcMarkdownViewer);
}
