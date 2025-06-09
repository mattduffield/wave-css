/*
 * Name: WcNotify
 * Usage: 
 * 
 *  <wc-notify></wc-notify>
 * 
 */


if (!customElements.get('wc-notify')) {
  class WcNotify extends HTMLElement {
    constructor() {
      super();

      console.log('ctor:wc-notify');
    }

    async connectedCallback() {
      if (document.querySelector(this.tagName) !== this) {
        console.warn(`${this.tagName} is already present on the page.`);
        this.remove();
      } else {
        await this.renderNotify();
      }
  
      console.log('conntectedCallback:wc-notify');
    }

    disconnectedCallback() {      
    }

    async renderPrompt() {
      if (!window.wc) {
        window.wc = {};
      }
      window.wc.Notify = this;
      wc.EventHub.broadcast('wc-notify:ready', '', '');
    }

    showSuccess(message) {
      this.showNotification(message, 'success');
    }

    showError(message) {
      this.showNotification(message, 'error');
    }

    showInfo(message) {
      this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerHTML = `
          <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
          <span>${message}</span>
      `;
      
      // Add to page
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => notification.classList.add('show'), 10);
      
      // Remove after delay
      setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  }
  customElements.define('wc-notify', WcNotify);
}