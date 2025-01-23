/**
 * 
 *  Name: wc-timeline
 *  Usage:
 *    <wc-timeline id="timeline"
 *      items='[{"name": "home", "label": "Home", "selected": true}, {"name": "news", "label": "News", "selected": false}, {"name": "contact", "label": "Contact", "selected": false}, {"name": "about", "label": "About", "selected": false}]'
 *    ></wc-timeline>
 *    <wc-timeline id="timeline">
 *      <option value="2017">
 *        Lorem ipsum dolor sit amet, quo ei simul congue exerci, ad nec admodum perfecto mnesarchum, vim ea mazim fierent detracto. Ea quis iuvaret expetendis his, te elit voluptua dignissim per, habeo iusto primis ea eam.
 *      </option>
 *      <option value="2016">
 *        Lorem ipsum dolor sit amet, quo ei simul congue exerci, ad nec admodum perfecto mnesarchum, vim ea mazim fierent detracto. Ea quis iuvaret expetendis his, te elit voluptua dignissim per, habeo iusto primis ea eam.
 *      </option>
 *      <option value="2015">
 *       Lorem ipsum dolor sit amet, quo ei simul congue exerci, ad nec admodum perfecto mnesarchum, vim ea mazim fierent detracto. Ea quis iuvaret expetendis his, te elit voluptua dignissim per, habeo iusto primis ea eam.
 *      </option>
 *      <option value="2014">
 *        Lorem ipsum dolor sit amet, quo ei simul congue exerci, ad nec admodum perfecto mnesarchum, vim ea mazim fierent detracto. Ea quis iuvaret expetendis his, te elit voluptua dignissim per, habeo iusto primis ea eam.
 *      </option>
 *    </wc-timeline>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcTimeline extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'items'];
  }

  constructor() {
    super();
    this._items = [];
    const compEl = this.querySelector('.wc-timeline');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-timeline');
      this.appendChild(this.componentElement);
    }
    console.log('ctor:wc-timeline');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('connectedCallback:wc-timeline');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {    
    if (attrName === 'items') {
      if (typeof newValue === 'string') {
        this._items = JSON.parse(newValue);
      }
      this.removeAttribute('items');
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-timeline > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this._moveDeclarativeOptions();
      this.componentElement.innerHTML = '';

      this._items.forEach((item, idx) => {
        const el = this._createElement(item.label, item.content, idx);
        this.componentElement.appendChild(el);
      });      
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-timeline');
  }

  _createElement(itemLabel, itemContent, idx) {
    let position = 'left';
    if (idx % 2 !== 0) {
      position = 'right';
    }
    const container = document.createElement('div');
    container.classList.add('container', position);
    const card = document.createElement('div');
    card.classList.add('card');
    const header = document.createElement('h2');
    header.textContent = itemLabel;
    const content = document.createElement('p');
    content.textContent = itemContent;
    card.appendChild(header);
    card.appendChild(content);
    container.appendChild(card);
    return container;
  }

  _applyStyle() {
    const style = `
      wc-timeline {
        display: contents;
      }
        
      .wc-timeline,
      .wc-timeline * {
        box-sizing: border-box;
      }

      .wc-timeline {
        position: relative;
        max-width: 1200px;
        margin: 0 auto;
      }

      /* The actual timeline (the vertical ruler) */
      .wc-timeline::after {
        content: '';
        position: absolute;
        width: 6px;
        background-color: var(--primary-bg-color);
        top: 0;
        bottom: 0;
        left: 50%;
        margin-left: -3px;
      }

      /* Container around content */
      .wc-timeline .container {
        padding: 10px 40px;
        position: relative;
        background-color: inherit;
        width: 50%;
      }

      /* The circles on the timeline */
      .wc-timeline .container::after {
        content: '';
        position: absolute;
        width: 25px;
        height: 25px;
        right: -17px;
        background-color: var(--component-color);
        border: 4px solid var(--accent-bg-color);
        top: 15px;
        border-radius: 50%;
        z-index: 1;
      }

      /* Place the container to the left */
      .wc-timeline .left {
        left: 0;
      }

      /* Place the container to the right */
      .wc-timeline .right {
        left: 50%;
      }

      /* Add arrows to the left container (pointing right) */
      .wc-timeline .left::before {
        content: " ";
        height: 0;
        position: absolute;
        top: 22px;
        width: 0;
        z-index: 1;
        right: 30px;
        border: medium solid white;
        border-width: 10px 0 10px 10px;
        border-color: transparent transparent transparent var(--component-bg-color);
      }

      /* Add arrows to the right container (pointing left) */
      .wc-timeline .right::before {
        content: " ";
        height: 0;
        position: absolute;
        top: 22px;
        width: 0;
        z-index: 1;
        left: 30px;
        border: medium solid white;
        border-width: 10px 10px 10px 0;
        border-color: transparent var(--component-bg-color); transparent transparent;
      }

      /* Fix the circle for containers on the right side */
      .wc-timeline .right::after {
        left: -16px;
      }

      /* The actual content */
      .wc-timeline .card {
        padding: 20px 30px;
        background-color: var(--component-bg-color);
        color: var(--input-color);
        position: relative;
        border-radius: 6px;
      }
      /* Media queries - Responsive timeline on screens less than 600px wide */
      @media screen and (max-width: 600px) {
        /* Place the timelime to the left */
        .wc-timeline::after {
          left: 31px;
        }
        
        /* Full-width containers */
        .wc-timeline .container {
          width: 100%;
          padding-left: 70px;
          padding-right: 25px;
        }
        
        /* Make sure that all arrows are pointing leftwards */
        .wc-timeline .container::before {
          left: 60px;
          border: medium solid white;
          border-width: 10px 10px 10px 0;
          border-color: transparent white transparent transparent;
        }

        /* Make sure all circles are at the same spot */
        .wc-timeline .left::after,
        .wc-timeline .right::after {
          left: 15px;
        }
        
        /* Make all right containers behave like the left ones */
        .wc-timeline .right {
          left: 0%;
        }
      }`.trim();
    this.loadStyle('wc-timeline-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
  }

  _moveDeclarativeOptions() {
    const options = this.querySelectorAll('option');
    if (options.length > 0) {
      this._items = [];
    }
    options.forEach((option, idx) => {
      const item = {
        label: option.value,
        content: option.textContent.trim()
      };
      this._items.push(item);
    });
    Array.from(options).forEach(option => option.remove());
  }

}

customElements.define('wc-timeline', WcTimeline);
