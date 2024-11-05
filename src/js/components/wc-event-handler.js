class WcEventHandler extends HTMLElement {
  static get observedAttributes() {
    return [
      'event-name', 'action', 'action-target'
    ];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    const eventName = this.getAttribute('event-name') || '';
    if (eventName) {
      document.body.addEventListener(eventName, this._handleEvent.bind(this));
    } else {
      console.warn('No event-name provided!');
    }
  }
  disconnectedCallback() {
    const eventName = this.getAttribute('event-name') || '';
    if (eventName) {
      document.body.removeEventListener(eventName, this._handleEvent.bind(this));
    }
  }

  _handleEvent(event) {
    const {target, detail} = event;
    const actionTarget = this.getAttribute('action-target') || '';
    const elt = document.querySelector(actionTarget);
    if (elt) {
      const {cls, action, item, selector} = detail;
      if (action === 'add-class') {
        elt.classList.add(cls);  
      } else if (action === 'remove-class') {
        elt.classList.remove(cls);  
      } else if (action === 'toggle-class') {
        elt.classList.toggle(cls);  
      } else if (action === 'add-item') {
        const d = document.createElement('div');
        d.innerHTML = item;
        elt.appendChild(d.firstChild);
      } else if (action === 'remove-item') {
        const tgt = document.querySelector(selector);
        tgt.remove();
      } else if (action === 'click') {
        const tgt = document.querySelector(selector);
        tgt.click();
      } else {
        // Do nothing...
      }      
    }
    console.log('_handleEvent:target', target, 'detail:', detail, 'actionTarget:', actionTarget);
    // const custom = new CustomEvent("custom-event", { detail: { action: "add-class", cls: "open" }});
    // document.body.dispatchEvent(custom);
    // const custom = new CustomEvent("custom-event", { detail: { action: "remove-class", cls: "open" }});
    // document.body.dispatchEvent(custom);
    // const custom = new CustomEvent("custom-event", { detail: { action: "toggle-class", cls: "open" }});
    // document.body.dispatchEvent(custom);
    // const custom = new CustomEvent("custom-event", { detail: { action: "add-item", item: '<wc-input class="test-input" type="button" value="Test"></wc-input>' }});
    // document.body.dispatchEvent(custom);
    // const custom = new CustomEvent("custom-event", { detail: { action: "remove-item", selector: ".test-input" }});
    // document.body.dispatchEvent(custom);
    // const custom = new CustomEvent("custom-event", { detail: { action: "click", selector: 'wc-sidenav[label="LEFT"] button.openbtn' }});
    // document.body.dispatchEvent(custom);
    // const custom = new CustomEvent("custom-event", { detail: { action: "click", selector: 'wc-sidenav[label="LEFT"] button.closebtn' }});
    // document.body.dispatchEvent(custom);
    // const custom = new CustomEvent("open-panel", { detail: { selector: 'wc-sidenav[label="LEFT"]' }});
    // document.body.dispatchEvent(custom);

    /*
    document.body.addEventListener('open-nav-only', (event) => {
      const {detail} = event;
      const {selector} = detail;
      console.log(detail);
      const tgt = document.querySelector(selector);
      const tagName = tgt?.tagName;
      const tags = document.querySelectorAll(tagName);
      tags.forEach(t => {
          const lbl = t.getAttribute('label');
          const css = `${t.tagName}[label="${lbl}"]`;
          const custom = new CustomEvent('close-nav', { detail: { selector: css }});
          document.body.dispatchEvent(custom);
      });
      const lbl = tgt.getAttribute('label');
      const css = `${tagName}[label="${lbl}"]`;
      const custom = new CustomEvent('open-nav', { detail: { selector: css }});
      document.body.dispatchEvent(custom);
    });
*/

  }

}

customElements.define('wc-event-handler', WcEventHandler);
