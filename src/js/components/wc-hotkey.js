/**
 * 
 *  Name: wc-hotkey
 *  Usage:
 *    <wc-hotkey keys="ctrl+s" target="button[type='submit']"></wc-hotkey>
 * 
 *  Description: 
 *    The purpose of this component is to allow you to wire up keyboard mnemonics
 *    so that you can perform actions quicker.
 */

if (!customElements.get('wc-hotkey')) {
  class WcHotkey extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
        const keyCombination = this.getAttribute('keys') || '';
        const targetSelector = this.getAttribute('target') || '';

        if (!keyCombination || !targetSelector) {
          console.error('WcHotkey requires "keys" and "target" attributes.');
          return;
        }

        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) {
          console.error(`Target element not found for selector: ${targetSelector}`);
          return;
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
            targetElement.click(); // Trigger the target element's action
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