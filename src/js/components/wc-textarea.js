/**
 * 
 *  Name: wc-textarea
 *  Usage:
 *    <wc-textarea class="col-1"
 *      rows="10"
 *      name="comments"
 *      value="10/10/2024 - First comment..."
 *      placeholder="Enter comments here..."></wc-textarea>
 *    <wc-textarea class="col-1"
 *      lbl-label="Notes"
 *      rows="10"
 *      name="notes"
 *      placeholder="Enter comments here...">
 *  10/30/2024 - Had a call with the client. They want to move forward.
 *  10/28/2024 - Had initial call with the client. They want to think about it.
 *    </wc-textarea>
 * 
 *  Note:
 *    If you provide both a value attribute and also inner text content. It will
 *    always take the value attribute and disregard the inner text.
 * 
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

class WcTextarea extends WcBaseFormComponent {
  static get observedAttributes() {
    return ['name', 'id', 'class', 'value', 'rows', 'cols', 'placeholder', 'lbl-label', 'disabled', 'readonly', 'required', 'autofocus', 'elt-class', 'emoji-shortcodes'];
  }

  constructor() {
    super();
    this.firstContent = '';
    this._emojiPopup = null;
    this._emojiSearch = '';
    this._emojiStartPos = -1;
    this._emojiSelectedIndex = 0;
    this._boundOnInput = this._onEmojiInput.bind(this);
    this._boundOnKeydown = this._onEmojiKeydown.bind(this);
    this._boundOnBlur = this._onEmojiBlur.bind(this);
    if (this.firstChild && this.firstChild.nodeName == '#text') {
      this.firstContent = this.firstChild.textContent;
      this.removeChild(this.firstChild);
    }
    const compEl = this.querySelector('.wc-textarea');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-textarea', 'relative');
      this.appendChild(this.componentElement);
    }
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    // console.log('connectedCallback:wc-textarea');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {
    if (attrName === 'autofocus') {
      this.formElement?.setAttribute('autofocus', '');
    } else if (attrName === 'lbl-label') {
      // Do nothing...
    } else if (attrName === 'disabled') {
      this.formElement?.setAttribute('disabled', '');
    } else if (attrName === 'readonly') {
      this.formElement?.setAttribute('readonly', '');
    } else if (attrName === 'required') {
      this.formElement?.setAttribute('required', '');
    } else if (attrName === 'placeholder') {
      this.formElement?.setAttribute('placeholder', newValue);
    } else if (attrName === 'cols') {
      this.formElement?.setAttribute('cols', newValue);
    } else if (attrName === 'rows') {
      this.formElement?.setAttribute('rows', newValue);
    } else if (attrName === 'emoji-shortcodes') {
      this._wireEmojiShortcodes();
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-textarea > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';

      this._createInnerElement();
    }

    if (this.hasAttribute('emoji-shortcodes')) {
      this._wireEmojiShortcodes();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
  }

  _createInnerElement() {
    const labelText = this.getAttribute('lbl-label') || '';
    const name = this.getAttribute('name');
    if (labelText) {
      const lblEl = document.createElement('label');
      lblEl.textContent = labelText;
      lblEl.setAttribute('for', name);
      this.componentElement.appendChild(lblEl);
    }
    this.formElement = document.createElement('textarea');
    this.formElement.setAttribute('form-element', '');
    this.componentElement.appendChild(this.formElement);
    const value = this.getAttribute('value') || '';
    if (this.firstContent && !value) {
      this.setAttribute('value', this.firstContent.trim());
      // this.value = this.firstContent;
    }
  }

  _wireEmojiShortcodes() {
    if (!this.formElement) return;
    this.formElement.removeEventListener('input', this._boundOnInput);
    this.formElement.removeEventListener('keydown', this._boundOnKeydown);
    this.formElement.removeEventListener('blur', this._boundOnBlur);
    this.formElement.addEventListener('input', this._boundOnInput);
    this.formElement.addEventListener('keydown', this._boundOnKeydown);
    this.formElement.addEventListener('blur', this._boundOnBlur);
  }

  _getShortcodeMap() {
    const WcEmoji = customElements.get('wc-emoji');
    if (WcEmoji && WcEmoji.shortcodeMap) {
      return WcEmoji.shortcodeMap;
    }
    return {};
  }

  _getShortcodeEntries() {
    const map = this._getShortcodeMap();
    return Object.entries(map).map(([emoji, code]) => ({ emoji, code }));
  }

  _onEmojiInput() {
    if (this._emojiInserting) return;
    const ta = this.formElement;
    const pos = ta.selectionStart;
    const text = ta.value.substring(0, pos);

    // Check for a complete :shortcode: pattern at the cursor
    const completeMatch = text.match(/:([a-z0-9_]+):$/);
    if (completeMatch) {
      const shortcode = ':' + completeMatch[1] + ':';
      const WcEmojiCls = customElements.get('wc-emoji');
      if (WcEmojiCls) {
        const emoji = WcEmojiCls.getEmojiByShortcode(shortcode);
        if (emoji) {
          this._emojiStartPos = pos - shortcode.length;
          this._insertEmoji(emoji);
          return;
        }
      }
    }

    // Find the last unmatched colon
    const lastColon = text.lastIndexOf(':');
    if (lastColon === -1) {
      this._closeEmojiPopup();
      return;
    }

    const query = text.substring(lastColon + 1);
    // If there's a space or another colon in the query, it's not a shortcode
    if (query.includes(' ') || query.includes(':')) {
      this._closeEmojiPopup();
      return;
    }

    this._emojiStartPos = lastColon;
    this._emojiSearch = query.toLowerCase();

    // Only reset selection index when the search query changes
    if (!this._emojiPopup) {
      this._emojiSelectedIndex = 0;
    }

    if (this._emojiSearch.length === 0) {
      // Just typed ":", show all entries (limited)
      this._emojiSelectedIndex = 0;
      this._showEmojiPopup(this._getShortcodeEntries().slice(0, 8));
    } else {
      const matches = this._getShortcodeEntries().filter(e =>
        e.code.toLowerCase().includes(this._emojiSearch)
      ).slice(0, 8);
      if (matches.length > 0) {
        // Clamp selection index to new matches length
        this._emojiSelectedIndex = Math.min(this._emojiSelectedIndex, matches.length - 1);
        this._showEmojiPopup(matches);
      } else {
        this._closeEmojiPopup();
      }
    }
  }

  _onEmojiKeydown(e) {
    if (!this._emojiPopup) return;
    const items = this._emojiPopup.querySelectorAll('.wc-emoji-ac-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._emojiSelectedIndex = Math.min(this._emojiSelectedIndex + 1, items.length - 1);
      this._highlightEmojiItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._emojiSelectedIndex = Math.max(this._emojiSelectedIndex - 1, 0);
      this._highlightEmojiItem(items);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (this._emojiPopup) {
        e.preventDefault();
        const selected = items[this._emojiSelectedIndex];
        if (selected) {
          this._insertEmoji(selected.dataset.emoji);
        }
      }
    } else if (e.key === 'Escape') {
      this._closeEmojiPopup();
    }
  }

  _onEmojiBlur() {
    // Delay to allow click on popup item
    setTimeout(() => this._closeEmojiPopup(), 200);
  }

  _showEmojiPopup(matches) {
    if (!this._emojiPopup) {
      this._emojiPopup = document.createElement('div');
      this._emojiPopup.className = 'wc-emoji-autocomplete';
      this.componentElement.appendChild(this._emojiPopup);
    }

    this._emojiPopup.innerHTML = '';
    matches.forEach((m, i) => {
      const item = document.createElement('div');
      item.className = 'wc-emoji-ac-item' + (i === this._emojiSelectedIndex ? ' selected' : '');
      item.dataset.emoji = m.emoji;
      item.innerHTML = `<span class="wc-emoji-ac-emoji">${m.emoji}</span><span class="wc-emoji-ac-code">${m.code}</span>`;
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._insertEmoji(m.emoji);
      });
      this._emojiPopup.appendChild(item);
    });

    this._positionEmojiPopup();
  }

  _positionEmojiPopup() {
    if (!this._emojiPopup || !this.formElement) return;
    const ta = this.formElement;
    const taRect = ta.getBoundingClientRect();
    const compRect = this.componentElement.getBoundingClientRect();

    // Position popup above the textarea's bottom edge
    this._emojiPopup.style.bottom = (compRect.bottom - taRect.bottom + ta.offsetHeight) + 'px';
    this._emojiPopup.style.left = '0';
  }

  _highlightEmojiItem(items) {
    items.forEach((item, i) => {
      item.classList.toggle('selected', i === this._emojiSelectedIndex);
    });
  }

  _insertEmoji(emoji) {
    const ta = this.formElement;
    const before = ta.value.substring(0, this._emojiStartPos);
    const after = ta.value.substring(ta.selectionStart);
    ta.value = before + emoji + after;
    const newPos = before.length + emoji.length;
    ta.setSelectionRange(newPos, newPos);
    ta.focus();
    this._closeEmojiPopup();

    // Trigger change event so form state updates
    this._emojiInserting = true;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
    this._emojiInserting = false;
  }

  _closeEmojiPopup() {
    if (this._emojiPopup) {
      this._emojiPopup.remove();
      this._emojiPopup = null;
    }
    this._emojiStartPos = -1;
    this._emojiSearch = '';
  }

  _applyStyle() {
    const style = `
      wc-textarea {
        display: contents;
      }
      .wc-emoji-autocomplete {
        position: absolute;
        bottom: 100%;
        left: 0;
        z-index: 100;
        background-color: var(--component-bg-color, var(--bg-color, #fff));
        color: var(--color, inherit);
        border: 1px solid var(--component-border-color);
        border-radius: 6px;
        padding: 4px 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        min-width: 200px;
        max-height: 240px;
        overflow-y: auto;
      }
      .wc-emoji-ac-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 10px;
        cursor: pointer;
        font-size: 0.85rem;
      }
      .wc-emoji-ac-item:hover,
      .wc-emoji-ac-item.selected {
        background-color: var(--primary-alt-bg-color, rgba(0, 0, 0, 0.08));
      }
      .wc-emoji-ac-emoji {
        font-size: 1.1rem;
      }
      .wc-emoji-ac-code {
        opacity: 0.7;
      }
    `.trim();
    this.loadStyle('wc-textarea-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
    if (this.formElement) {
      this.formElement.removeEventListener('input', this._boundOnInput);
      this.formElement.removeEventListener('keydown', this._boundOnKeydown);
      this.formElement.removeEventListener('blur', this._boundOnBlur);
    }
    this._closeEmojiPopup();
  }

}

customElements.define('wc-textarea', WcTextarea);
