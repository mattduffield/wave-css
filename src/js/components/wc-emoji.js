/**
 *
 *  Name: wc-emoji
 *  Usage:
 *    <!-- Quick reaction bar with expandable picker -->
 *    <wc-emoji
 *      quick-emojis='["👍","❤️","🎉","😂"]'
 *      onpick="handleEmoji(event.detail.emoji)">
 *    </wc-emoji>
 *
 *    <!-- Picker only (no quick bar, just a trigger button) -->
 *    <wc-emoji picker-only
 *      trigger-emoji="😀"
 *      onpick="handleEmoji(event.detail.emoji)">
 *    </wc-emoji>
 *
 *    <!-- Custom categories -->
 *    <wc-emoji
 *      categories='[{"name":"Favorites","emojis":["🔥","🚀","💯"]}]'
 *      onpick="handleEmoji(event.detail.emoji)">
 *    </wc-emoji>
 *
 *  Attributes:
 *    - quick-emojis: JSON array of emoji strings for quick-access buttons (default: ["👍","❤️","🎉","😂"])
 *    - picker-only: Boolean — hide quick bar, only show trigger button
 *    - trigger-emoji: Text/emoji shown on the "more" button (default: "...")
 *    - onpick: Event handler when an emoji is selected. Receives event.detail.emoji
 *    - categories: JSON array to override default emoji categories
 *    - hover-target: CSS selector for an ancestor element — emoji bar is hidden until that ancestor is hovered
 *
 *  Events:
 *    - wcemojipick — dispatched when an emoji is selected, with { detail: { emoji, shortcode } }
 *
 *  API:
 *    wc.EventHub.broadcast('wcemojiopen', '#myEmoji')
 *    wc.EventHub.broadcast('wcemojiclose', '#myEmoji')
 *    wc.EventHub.broadcast('wcemojitoggle', '#myEmoji')
 *
 *  Shortcodes:
 *    All emojis have associated shortcodes (e.g. :thumbsup: for 👍).
 *    Shortcodes are shown as tooltips on hover.
 *    Use WcEmoji.shortcodeMap to look up shortcodes programmatically.
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-emoji')) {
  class WcEmoji extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'quick-emojis', 'picker-only', 'trigger-emoji', 'onpick', 'categories', 'hover-target'];
    }

    static get shortcodeMap() {
      return {
        // Smileys
        '😀': ':grinning:', '😃': ':smiley:', '😄': ':smile:', '😁': ':grin:',
        '😂': ':joy:', '🤣': ':rofl:', '😊': ':blush:', '😇': ':innocent:',
        '😍': ':heart_eyes:', '🤩': ':star_struck:', '😘': ':kissing_heart:', '🥰': ':smiling_face_with_hearts:',
        '😎': ':sunglasses:', '🤔': ':thinking:', '🫡': ':saluting_face:', '🤗': ':hugs:',
        '😐': ':neutral_face:', '😑': ':expressionless:', '🙄': ':roll_eyes:', '😮': ':open_mouth:',
        '😢': ':cry:', '😭': ':sob:',
        // Gestures
        '👍': ':thumbsup:', '👎': ':thumbsdown:', '👏': ':clap:', '🙌': ':raised_hands:',
        '🤝': ':handshake:', '💪': ':muscle:', '🤞': ':crossed_fingers:', '✌️': ':v:',
        '👋': ':wave:', '🫶': ':heart_hands:',
        // Symbols
        '❤️': ':heart:', '🔥': ':fire:', '⭐': ':star:', '✅': ':white_check_mark:',
        '🎉': ':tada:', '💯': ':100:', '🚀': ':rocket:', '💡': ':bulb:',
        '⚡': ':zap:', '👀': ':eyes:', '🏆': ':trophy:', '💎': ':gem:',
        // Extra common
        '😅': ':sweat_smile:', '😜': ':stuck_out_tongue_winking_eye:', '🥳': ':partying_face:',
        '😤': ':triumph:', '😱': ':scream:', '🤯': ':exploding_head:',
        '🙏': ':pray:', '🤙': ':call_me:', '✊': ':fist:',
        '🖐️': ':raised_hand_with_fingers_splayed:', '🤘': ':metal:',
        '💔': ':broken_heart:', '💕': ':two_hearts:', '💖': ':sparkling_heart:',
        '🌟': ':star2:', '✨': ':sparkles:', '🎯': ':dart:', '🎶': ':notes:',
        '💬': ':speech_balloon:', '🔔': ':bell:', '📌': ':pushpin:',
        '🔗': ':link:', '📎': ':paperclip:', '🏠': ':house:', '🌍': ':earth_africa:',
        '⏰': ':alarm_clock:', '📅': ':date:', '🔑': ':key:', '🛠️': ':hammer_and_wrench:',
      };
    }

    static getShortcode(emoji) {
      return WcEmoji.shortcodeMap[emoji] || emoji;
    }

    static getEmojiByShortcode(shortcode) {
      const map = WcEmoji.shortcodeMap;
      for (const [emoji, code] of Object.entries(map)) {
        if (code === shortcode) return emoji;
      }
      return null;
    }

    static get defaultCategories() {
      return [
        {
          name: 'Smileys',
          emojis: ['😀','😃','😄','😁','😂','🤣','😊','😇','😍','🤩','😘','🥰','😎','🤔','🫡','🤗','😐','😑','🙄','😮','😢','😭']
        },
        {
          name: 'Gestures',
          emojis: ['👍','👎','👏','🙌','🤝','💪','🤞','✌️','👋','🫶']
        },
        {
          name: 'Symbols',
          emojis: ['❤️','🔥','⭐','✅','🎉','💯','🚀','💡','⚡','👀','🏆','💎']
        }
      ];
    }

    constructor() {
      super();
      this._isOpen = false;
      this._onpickHandler = null;

      this._boundHandleWindowClick = this._handleWindowClick.bind(this);
      this._boundHandleOpen = this._handleOpen.bind(this);
      this._boundHandleClose = this._handleClose.bind(this);
      this._boundHandleToggle = this._handleToggle.bind(this);
      this._boundHoverShow = this._hoverShow.bind(this);
      this._boundHoverHide = this._hoverHide.bind(this);
      this._hoverTargetEl = null;

      const compEl = this.querySelector('.wc-emoji');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-emoji');
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      this._wireEvents();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    _handleAttributeChange(attrName, newValue) {
      if (attrName === 'id') {
        // Do not propagate id to componentElement
      } else if (attrName === 'quick-emojis') {
        this._rebuild();
      } else if (attrName === 'picker-only') {
        this._rebuild();
      } else if (attrName === 'trigger-emoji') {
        const trigger = this.querySelector('.wc-emoji-trigger');
        if (trigger) {
          trigger.textContent = newValue || '...';
        }
      } else if (attrName === 'onpick') {
        this._wireOnpick(newValue);
      } else if (attrName === 'categories') {
        this._rebuild();
      } else if (attrName === 'hover-target') {
        this._wireHoverTarget(newValue);
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _render() {
      super._render();
      const innerEl = this.querySelector('.wc-emoji > *');
      if (!innerEl) {
        this.componentElement.innerHTML = '';
        this._createInnerElement();
      }

      const onpick = this.getAttribute('onpick');
      if (onpick) {
        this._wireOnpick(onpick);
      }

      if (typeof htmx !== 'undefined') {
        htmx.process(this);
      }
    }

    _rebuild() {
      if (!this._isConnected) return;
      this.componentElement.innerHTML = '';
      this._createInnerElement();
    }

    _createInnerElement() {
      const pickerOnly = this.hasAttribute('picker-only');
      const triggerEmoji = this.getAttribute('trigger-emoji') || '...';

      // Quick emoji buttons
      if (!pickerOnly) {
        let quickEmojis = ['👍','❤️','🎉','😂'];
        const quickAttr = this.getAttribute('quick-emojis');
        if (quickAttr) {
          try { quickEmojis = JSON.parse(quickAttr); } catch(e) { /* use defaults */ }
        }
        quickEmojis.forEach(emoji => {
          const btn = document.createElement('button');
          btn.className = 'wc-emoji-quick';
          btn.type = 'button';
          btn.dataset.emoji = emoji;
          btn.textContent = emoji;
          btn.title = WcEmoji.getShortcode(emoji);
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._pickEmoji(emoji);
          });
          this.componentElement.appendChild(btn);
        });
      }

      // Trigger button
      const trigger = document.createElement('button');
      trigger.className = 'wc-emoji-trigger';
      trigger.type = 'button';
      trigger.textContent = triggerEmoji;
      trigger.title = 'More reactions';
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this._togglePicker();
      });
      this.componentElement.appendChild(trigger);

      // Picker popup
      const picker = document.createElement('div');
      picker.className = 'wc-emoji-picker';

      let categories = WcEmoji.defaultCategories;
      const catAttr = this.getAttribute('categories');
      if (catAttr) {
        try { categories = JSON.parse(catAttr); } catch(e) { /* use defaults */ }
      }

      categories.forEach(cat => {
        const heading = document.createElement('div');
        heading.className = 'wc-emoji-category';
        heading.textContent = cat.name;
        picker.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'wc-emoji-grid';
        cat.emojis.forEach(emoji => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.dataset.emoji = emoji;
          btn.textContent = emoji;
          btn.title = WcEmoji.getShortcode(emoji);
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._pickEmoji(emoji);
            this._closePicker();
          });
          grid.appendChild(btn);
        });
        picker.appendChild(grid);
      });

      this.componentElement.appendChild(picker);
    }

    _pickEmoji(emoji) {
      this._emitEvent('wcemojipick', 'emoji:pick', {
        bubbles: true,
        composed: true,
        detail: { emoji, shortcode: WcEmoji.getShortcode(emoji) }
      });
    }

    _togglePicker() {
      if (this._isOpen) {
        this._closePicker();
      } else {
        this._openPicker();
      }
    }

    _openPicker() {
      // Close any other open emoji pickers
      document.querySelectorAll('wc-emoji').forEach(el => {
        if (el !== this && el._isOpen) {
          el._closePicker();
        }
      });
      const picker = this.querySelector('.wc-emoji-picker');
      if (picker) {
        picker.classList.add('open');
        this._isOpen = true;
        this._positionPicker(picker);
      }
    }

    _closePicker() {
      const picker = this.querySelector('.wc-emoji-picker');
      if (picker) {
        picker.classList.remove('open');
        this._isOpen = false;
      }
      // Re-hide if hover-target is active and mouse is not over the target
      if (this._hoverTargetEl && !this._hoverTargetEl.matches(':hover')) {
        this._hoverHide();
      }
    }

    _positionPicker(picker) {
      const trigger = this.querySelector('.wc-emoji-trigger');
      if (!trigger) return;

      // Reset position to measure natural size
      picker.style.top = '';
      picker.style.bottom = '';
      picker.style.left = '';
      picker.style.right = '';

      const triggerRect = trigger.getBoundingClientRect();
      const pickerRect = picker.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      // Vertical: prefer below, flip above if not enough space
      if (spaceBelow < pickerRect.height && spaceAbove > spaceBelow) {
        picker.style.bottom = '100%';
        picker.style.top = 'auto';
      } else {
        picker.style.top = '100%';
        picker.style.bottom = 'auto';
      }

      // Horizontal: prefer right-aligned, shift left if overflows viewport
      const pickerLeft = triggerRect.right - pickerRect.width;
      if (pickerLeft < 0) {
        picker.style.left = '0';
        picker.style.right = 'auto';
      } else {
        picker.style.right = '0';
        picker.style.left = 'auto';
      }
    }

    _wireOnpick(handlerStr) {
      if (this._onpickHandler) {
        this.removeEventListener('wcemojipick', this._onpickHandler);
        this._onpickHandler = null;
      }
      if (handlerStr) {
        this._onpickHandler = new Function('event', `
          const element = event.target;
          with (element) {
            ${handlerStr}
          }
        `);
        this.addEventListener('wcemojipick', this._onpickHandler);
      }
    }

    _handleWindowClick(e) {
      if (this._isOpen && !this.contains(e.target)) {
        this._closePicker();
      }
    }

    _matchesSelector(selector) {
      const isArray = Array.isArray(selector);
      if (typeof selector === 'string' || isArray) {
        const tgts = document.querySelectorAll(selector);
        for (const tgt of tgts) {
          if (tgt === this) return true;
        }
        return false;
      }
      return selector === this;
    }

    _handleOpen(event) {
      const { detail } = event;
      const { selector } = detail;
      if (this._matchesSelector(selector)) {
        this._openPicker();
      }
    }

    _handleClose(event) {
      const { detail } = event;
      const { selector } = detail;
      if (this._matchesSelector(selector)) {
        this._closePicker();
      }
    }

    _handleToggle(event) {
      const { detail } = event;
      const { selector } = detail;
      if (this._matchesSelector(selector)) {
        this._togglePicker();
      }
    }

    _wireHoverTarget(selector) {
      this._unwireHoverTarget();
      if (!selector) {
        this.componentElement.style.opacity = '';
        this.componentElement.style.pointerEvents = '';
        this.componentElement.style.transition = '';
        return;
      }

      // Set initial hidden state immediately
      this.componentElement.style.opacity = '0';
      this.componentElement.style.pointerEvents = 'none';
      this.componentElement.style.transition = 'opacity 0.2s ease-in-out';

      // Find the closest ancestor matching the selector
      const findTarget = () => {
        this._hoverTargetEl = this.closest(selector);
        if (this._hoverTargetEl) {
          this._hoverTargetEl.addEventListener('mouseenter', this._boundHoverShow);
          this._hoverTargetEl.addEventListener('mouseleave', this._boundHoverHide);
        }
      };

      // Try immediately, retry on next frame if not found (HTMX timing)
      findTarget();
      if (!this._hoverTargetEl) {
        requestAnimationFrame(() => findTarget());
      }
    }

    _unwireHoverTarget() {
      if (this._hoverTargetEl) {
        this._hoverTargetEl.removeEventListener('mouseenter', this._boundHoverShow);
        this._hoverTargetEl.removeEventListener('mouseleave', this._boundHoverHide);
        this._hoverTargetEl = null;
      }
    }

    _hoverShow() {
      this.componentElement.style.opacity = '1';
      this.componentElement.style.pointerEvents = 'auto';
    }

    _hoverHide() {
      if (this._isOpen) return;
      this.componentElement.style.opacity = '0';
      this.componentElement.style.pointerEvents = 'none';
    }

    _wireEvents() {
      super._wireEvents();
      window.addEventListener('click', this._boundHandleWindowClick);
      document.body.addEventListener('wcemojiopen', this._boundHandleOpen);
      document.body.addEventListener('wcemojiclose', this._boundHandleClose);
      document.body.addEventListener('wcemojitoggle', this._boundHandleToggle);
    }

    _unWireEvents() {
      super._unWireEvents();
      window.removeEventListener('click', this._boundHandleWindowClick);
      document.body.removeEventListener('wcemojiopen', this._boundHandleOpen);
      document.body.removeEventListener('wcemojiclose', this._boundHandleClose);
      document.body.removeEventListener('wcemojitoggle', this._boundHandleToggle);
      this._unwireHoverTarget();
      if (this._onpickHandler) {
        this.removeEventListener('wcemojipick', this._onpickHandler);
        this._onpickHandler = null;
      }
    }

    _applyStyle() {
      const style = `
        wc-emoji {
          display: contents;
        }
        .wc-emoji {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          position: relative;
        }
        .wc-emoji button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 0.9rem;
          line-height: 1;
          color: var(--color, inherit);
          transition: background-color 0.2s ease-in-out;
        }
        .wc-emoji button:hover {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
        }
        .wc-emoji-trigger {
          opacity: 0.7;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .wc-emoji-trigger:hover {
          opacity: 1;
        }
        .wc-emoji-picker {
          display: none;
          position: absolute;
          top: 100%;
          right: 0;
          z-index: 100;
          background: var(--secondary-bg-color, var(--bg-color, #fff));
          color: var(--primary-color, var(--color, inherit));
          border: 1px solid var(--accent-bg-color, var(--component-border-color));
          border-radius: 8px;
          padding: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          min-width: 220px;
          max-height: 300px;
          overflow-y: auto;
        }
        .wc-emoji-picker.open {
          display: block;
        }
        .wc-emoji-category {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--button-color);
          padding: 4px 2px 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .wc-emoji-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 1px;
        }
        .wc-emoji-grid button {
          font-size: 1.1rem;
          padding: 3px;
          text-align: center;
        }
        .wc-emoji-grid button:hover {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          transform: scale(1.2);
        }
      `;
      this.loadStyle('wc-emoji-style', style);
    }
  }

  customElements.define('wc-emoji', WcEmoji);
}
