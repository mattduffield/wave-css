/**
 *
 *  Name: wc-hotkey
 *  Usage:
 *    <wc-hotkey keys="ctrl+s" target="button[type='submit']"></wc-hotkey>
 *    <wc-hotkey keys="ctrl+enter" action="window.runQuery()"></wc-hotkey>
 *
 *  Description:
 *    The purpose of this component is to allow you to wire up keyboard mnemonics
 *    so that you can perform actions quicker. Use `target` to click an element,
 *    or `action` to execute a JavaScript expression directly.
 */

if (!customElements.get('wc-hotkey')) {
  class WcHotkey extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
        const keyCombination = this.getAttribute('keys') || '';
        const targetSelector = this.getAttribute('target') || '';
        const action = this.getAttribute('action') || '';

        if (!keyCombination || (!targetSelector && !action)) {
          console.error('WcHotkey requires "keys" and either "target" or "action" attribute.');
          return;
        }

        // Resolve target element if target attribute is set (takes precedence over action)
        let targetElement = null;
        if (targetSelector) {
          targetElement = document.querySelector(targetSelector);
          if (!targetElement) {
            console.error(`Target element not found for selector: ${targetSelector}`);
            return;
          }
        }

        // Convert key combination to usable conditions
        const keys = keyCombination.split('+');
        const keyMap = {
          metaKey: keys.includes('cmd'),
          ctrlKey: keys.includes('ctrl'),
          shiftKey: keys.includes('shift'),
          altKey: keys.includes('alt'),
          key: keys.find(k => !['cmd', 'ctrl', 'shift', 'alt'].includes(k)) || '',
        };

        // Listen for keydown events
        const handleKeydown = (event) => {
          if (
            (keyMap.metaKey === event.metaKey) &&
            (keyMap.ctrlKey === event.ctrlKey) &&
            (keyMap.shiftKey === event.shiftKey) &&
            (keyMap.altKey === event.altKey) &&
            (keyMap.key.toLowerCase() === event.key.toLowerCase())
          ) {
            event.preventDefault();
            if (targetElement) {
              targetElement.click();
            } else if (action) {
              try {
                new Function(action)();
              } catch (e) {
                console.error(`WcHotkey action error: ${e.message}`);
              }
            }
          }
        };

        document.addEventListener('keydown', handleKeydown);

        // Cleanup listener on disconnect
        this.cleanup = () => {
          document.removeEventListener('keydown', handleKeydown);
        };
    }

    disconnectedCallback() {
      if (this.cleanup) this.cleanup();
    }
  }

  // Define the web component
  customElements.define('wc-hotkey', WcHotkey);
}
