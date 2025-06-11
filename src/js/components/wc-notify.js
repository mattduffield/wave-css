/*
 * Name: WcNotify
 * Usage: 
 * 
 *  <wc-notify></wc-notify>
 * 
 */

import { loadCSS, loadScript, loadLibrary, loadStyle, show } from './helper-function.js';

if (!customElements.get('wc-notify')) {
  class WcNotify extends HTMLElement {
    static get observedAttributes() {
      return ['delay'];
    }

    constructor() {
      super();
      this.loadCSS = loadCSS.bind(this);
      this.loadScript = loadScript.bind(this);
      this.loadLibrary = loadLibrary.bind(this);
      this.loadStyle = loadStyle.bind(this);
      this._defaultDelay = 3000;
      this._notifications = [];

      console.log('ctor:wc-notify');
    }

    async connectedCallback() {
      if (document.querySelector(this.tagName) !== this) {
        console.warn(`${this.tagName} is already present on the page.`);
        this.remove();
      } else {
        await this.renderNotify();
      }
  
      this._applyStyle();

      console.log('conntectedCallback:wc-notify');
    }

    disconnectedCallback() {      
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'delay') {
        this._defaultDelay = parseInt(newValue) || 3000;
      }
    }

    get delay() {
      return this._defaultDelay;
    }

    async renderNotify() {
      if (!window.wc) {
        window.wc = {};
      }
      window.wc.Notify = this;
      wc.EventHub.broadcast('wc-notify:ready', '', '');
    }

    showSuccess(message, delay) {
      this.showNotification(message, 'success', delay);
    }

    showError(message, delay) {
      this.showNotification(message, 'error', delay);
    }

    showInfo(message, delay) {
      this.showNotification(message, 'info', delay);
    }

    showNotification(message, type = 'info', delay) {
      // Use provided delay or fall back to component's default
      const notificationDelay = delay !== undefined ? delay : this.delay;
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerHTML = `
          <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
          <span>${message}</span>
      `;
      
      // Add to tracking array
      this._notifications.push(notification);
      
      // Calculate position based on existing notifications
      this._updateNotificationPositions();
      
      // Add to page
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => notification.classList.add('show'), 10);
      
      // Remove after delay
      setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => {
            notification.remove();
            // Remove from tracking array
            const index = this._notifications.indexOf(notification);
            if (index > -1) {
              this._notifications.splice(index, 1);
              // Update positions of remaining notifications
              this._updateNotificationPositions();
            }
          }, 300);
      }, notificationDelay);
    }

    _updateNotificationPositions() {
      const spacing = 10; // Gap between notifications
      let currentTop = 20; // Initial top position
      
      this._notifications.forEach((notification) => {
        notification.style.top = `${currentTop}px`;
        // Get the actual height after it's rendered
        if (notification.offsetHeight) {
          currentTop += notification.offsetHeight + spacing;
        } else {
          // Default height estimate if not yet rendered
          currentTop += 60 + spacing;
        }
      });
    }

    _applyStyle() {
      const style = `
        wc-notify {
          display: contents;
        }
        /* Notifications */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transform: translateX(400px);
            transition: transform 0.3s, top 0.3s ease-out;
            z-index: 2000;
        }

        .notification.show {
            transform: translateX(0);
        }

        .notification.success {
            border-left: 4px solid #2ecc71;
        }

        .notification.success i {
            color: #2ecc71;
        }

        .notification.error {
            border-left: 4px solid #e74c3c;
        }

        .notification.error i {
            color: #e74c3c;
        }

        .notification.info {
            border-left: 4px solid #3498db;
        }

        .notification.info i {
            color: #3498db;
        }
      `;
      this.loadStyle('wc-notify-style', style);
    }

  }
  customElements.define('wc-notify', WcNotify);
}