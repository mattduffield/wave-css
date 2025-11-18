/*
 * Name: WcMaskHub
 * Usage:
 *
 *  <wc-mask-hub></wc-mask-hub>
 *
 * References:
 *  https://github.com/uNmAnNeR/imaskjs
 */

import { loadStyle } from './helper-function.js';
import { DependencyManager } from '../utils/dependency-manager.js';

if (!customElements.get('wc-mask-hub')) {
  class WcMaskHub extends HTMLElement {
    static get observedAttributes() {
      return [];
    }

    constructor() {
      super();
      this.loadStyle = loadStyle.bind(this);

      // Register IMask as a required dependency
      DependencyManager.register('IMask');

      // console.log('ctor:wc-mask-hub');
    }

    async connectedCallback() {
      if (document.querySelector(this.tagName) !== this) {
        console.warn(`${this.tagName} is already present on the page.`);
        this.remove();
      } else {
        await this.renderMask();
        this._applyStyle();
      }
      // console.log('conntectedCallback:wc-mask-hub');
    }
    disconnectedCallback() {
    }

    async renderMask() {
      // Set wc.MaskHub BEFORE loading IMask so it's available when wc:ready fires
      if (!window.wc) {
        window.wc = {};
      }
      window.wc.MaskHub = this;

      // Use dependency manager - this will deduplicate if multiple components try to load
      await DependencyManager.load('IMask');

      // Define mask configurations for different types
      this.maskConfigs = {
        phone: {
          mask: '(000) 000-0000',
          lazy: false,
          placeholderChar: '_'
        },
        ssn: {
          mask: '000-00-0000',
          lazy: false,
          placeholderChar: '_'
        },
        zip: {
          mask: '00000',
          lazy: false,
          placeholderChar: '_'
        },
        zipPlus4: {
          mask: '00000-0000',
          lazy: false,
          placeholderChar: '_'
        },
        date: {
          mask: Date,
          pattern: 'm/d/Y',
          lazy: false,
          blocks: {
            m: {
              mask: IMask.MaskedRange,
              from: 1,
              to: 12,
              maxLength: 2
            },
            d: {
              mask: IMask.MaskedRange,
              from: 1,
              to: 31,
              maxLength: 2
            },
            Y: {
              mask: IMask.MaskedRange,
              from: 1900,
              to: 2099,
              maxLength: 4
            }
          }
        },
        currency: {
          mask: Number,
          scale: 2,
          thousandsSeparator: ',',
          padFractionalZeros: true,
          normalizeZeros: true,
          radix: '.',
          mapToRadix: ['.'],
          min: 0
        }
      };
    }

    /**
     * Generic method to apply any mask type to an input
     * @param {Event} event - The event object with target input element
     * @param {string} maskType - The type of mask to apply (phone, ssn, etc.)
     */
    applyMask(event, maskType = 'phone') {
      const {target} = event;

      // Check if mask already exists
      if (target._imaskInstance) {
        console.log('Mask already applied to element, skipping:', target.getAttribute('name') || target.id || 'unnamed');
        return; // Already initialized
      }

      // Get the mask configuration
      const maskConfig = this.maskConfigs[maskType];
      if (!maskConfig) {
        console.error(`WcMaskHub: Unknown mask type "${maskType}". Available types:`, Object.keys(this.maskConfigs));
        return;
      }

      console.log('Applying', maskType, 'mask to element:', target.getAttribute('name') || target.id || 'unnamed');

      // Create and store the IMask instance
      target._imaskInstance = IMask(target, maskConfig);
      target._maskType = maskType;

      // Handle pre-filled values
      if (target.value) {
        target._imaskInstance.value = target.value;
      }

      // Store cleanup handler
      if (!target._maskCleanupRegistered) {
        target._maskCleanupRegistered = true;

        // Cleanup when element is removed from DOM
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
              if (node === target || node.contains(target)) {
                this._destroyMask(target);
                observer.disconnect();
              }
            });
          });
        });

        // Observe parent for removal
        if (target.parentNode) {
          observer.observe(target.parentNode, { childList: true, subtree: true });
        }
      }
    }

    /**
     * Apply mask to an element directly (for use with hyperscript/events without proper target)
     * @param {HTMLElement} element - The input element
     * @param {string} maskType - The type of mask to apply
     */
    applyMaskToElement(element, maskType = 'phone') {
      this.applyMask({ target: element }, maskType);
    }

    /**
     * Convenience method for phone mask (backwards compatibility)
     */
    phoneMask(event) {
      this.applyMask(event, 'phone');
    }

    /**
     * Convenience method for phone mask on element (for hyperscript)
     */
    phoneMaskElement(element) {
      this.applyMaskToElement(element, 'phone');
    }

    /**
     * Convenience method for SSN mask
     */
    ssnMask(event) {
      this.applyMask(event, 'ssn');
    }

    /**
     * Convenience method for ZIP code mask
     */
    zipMask(event) {
      this.applyMask(event, 'zip');
    }

    /**
     * Convenience method for ZIP+4 mask
     */
    zipPlus4Mask(event) {
      this.applyMask(event, 'zipPlus4');
    }

    /**
     * Convenience method for date mask
     */
    dateMask(event) {
      this.applyMask(event, 'date');
    }

    /**
     * Convenience method for currency mask
     */
    currencyMask(event) {
      this.applyMask(event, 'currency');
    }

    /**
     * Destroy mask instance and cleanup
     */
    _destroyMask(target) {
      if (target._imaskInstance) {
        target._imaskInstance.destroy();
        target._imaskInstance = null;
        target._maskType = null;
      }
    }

    /**
     * Public method to get the unmasked value
     * @param {HTMLElement} target - The input element
     * @returns {string} The unmasked value
     */
    getUnmaskedValue(target) {
      if (target._imaskInstance) {
        return target._imaskInstance.unmaskedValue;
      }
      return target.value;
    }

    /**
     * Public method to update mask value programmatically
     * @param {HTMLElement} target - The input element
     * @param {string} value - The value to set
     */
    updateMaskValue(target, value) {
      if (target._imaskInstance) {
        target._imaskInstance.value = value;
      } else {
        target.value = value;
      }
    }

    _applyStyle() {
      const style = `
      wc-mask-hub {
        display: contents;
      }
      `;
      this.loadStyle('wc-mask-hub-style', style);
    }
  }

  customElements.define('wc-mask-hub', WcMaskHub);
}
