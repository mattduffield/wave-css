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
      return ['delay', 'position'];
    }

    constructor() {
      super();
      this.loadCSS = loadCSS.bind(this);
      this.loadScript = loadScript.bind(this);
      this.loadLibrary = loadLibrary.bind(this);
      this.loadStyle = loadStyle.bind(this);
      this._defaultDelay = 3000;
      this._notifications = [];
      this._position = 'top-right';

      // console.log('ctor:wc-notify');
    }

    async connectedCallback() {
      if (document.querySelector(this.tagName) !== this) {
        console.warn(`${this.tagName} is already present on the page.`);
        this.remove();
      } else {
        await this.renderNotify();
      }
  
      this._applyStyle();

      // console.log('conntectedCallback:wc-notify');
    }

    disconnectedCallback() {      
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'delay') {
        this._defaultDelay = parseInt(newValue) || 3000;
      } else if (name === 'position') {
        const validPositions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
        if (validPositions.includes(newValue)) {
          this._position = newValue;
        }
      }
    }

    get delay() {
      return this._defaultDelay;
    }

    get position() {
      return this._position;
    }

    async renderNotify() {
      if (!window.wc) {
        window.wc = {};
      }
      window.wc.Notify = this;
      wc.EventHub.broadcast('wc-notify:ready', '', '');
    }

    showSuccess(message, delay, persist = false) {
      this.showNotification(message, 'success', delay, persist);
    }

    showError(message, delay, persist = false) {
      this.showNotification(message, 'error', delay, persist);
    }

    showInfo(message, delay, persist = false) {
      this.showNotification(message, 'info', delay, persist);
    }

    showNotification(message, type = 'info', delay, persist = false) {
      // Use provided delay or fall back to component's default
      const notificationDelay = delay !== undefined ? delay : this.delay;
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification ${type} ${this.position}`;
      
      // Build notification content
      let notificationContent = `
        <wc-fa-icon name="${type === 'success' ? 'circle-check' : type === 'error' ? 'circle-exclamation' : 'circle-info'}" icon-style="duotone" size="1rem" class="flex">
        </wc-fa-icon>
        <span class="notification-message">${message}</span>
      `;
      
      // Add close button if persist is true
      if (persist) {
        notificationContent += `
          <button class="notification-close" aria-label="Close notification">
            <wc-fa-icon name="xmark" size="1rem"></wc-fa-icon>
          </button>
        `;
      }
      
      notification.innerHTML = notificationContent;
      
      // Add close button functionality if persist is true
      if (persist) {
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
          this._removeNotification(notification);
        });
      }
      
      // Add to tracking array
      this._notifications.push(notification);
      
      // Calculate position based on existing notifications
      this._updateNotificationPositions();
      
      // Add to page
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => notification.classList.add('show'), 10);
      
      // Only auto-remove if not persistent
      if (!persist) {
        setTimeout(() => {
          this._removeNotification(notification);
        }, notificationDelay);
      }
    }

    _removeNotification(notification) {
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
    }

    _updateNotificationPositions() {
      const spacing = 10; // Gap between notifications
      const isBottom = this.position.includes('bottom');
      let currentPosition = 20; // Initial position from edge
      
      this._notifications.forEach((notification, index) => {
        if (isBottom) {
          // For bottom positions, stack from bottom to top
          notification.style.bottom = `${currentPosition}px`;
          notification.style.top = 'auto';
        } else {
          // For top positions, stack from top to bottom
          notification.style.top = `${currentPosition}px`;
          notification.style.bottom = 'auto';
        }
        
        // Get the actual height after it's rendered
        if (notification.offsetHeight) {
          currentPosition += notification.offsetHeight + spacing;
        } else {
          // Default height estimate if not yet rendered
          currentPosition += 60 + spacing;
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
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transition: transform 0.3s, top 0.3s ease-out, bottom 0.3s ease-out;
            z-index: 2000;
            max-width: 400px;
        }

        .notification-message {
            flex: 1;
        }

        .notification-close {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.25rem;
            margin-left: 0.5rem;
            color: #666;
            transition: color 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .notification-close:hover {
            color: #333;
        }

        /* Position-specific styles */
        .notification.top-right {
            right: 20px;
            transform: translateX(400px);
        }

        .notification.top-left {
            left: 20px;
            transform: translateX(-400px);
        }

        .notification.bottom-right {
            right: 20px;
            transform: translateX(400px);
        }

        .notification.bottom-left {
            left: 20px;
            transform: translateX(-400px);
        }

        .notification.show {
            transform: translateX(0);
        }

        .notification.success {
          border-left: 4px solid #2ecc71;
          background-color: #c6edd7ff;
          color: #063218ff;
        }

        .notification.success svg {
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