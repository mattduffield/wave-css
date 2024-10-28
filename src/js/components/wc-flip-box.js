/**
 * 
 *  Name: wc-flip-box
 *  Usage:
 *    <wc-flip-box class="h-40 w-40 mb-4">
 *      <div slot="front" class="theme-coral-sunset dark">
 *        <h2>Front Side</h2>
 *      </div>
 *      <div slot="back" class="theme-royal-blue light">
 *        <h2>Back Side</h2>
 *      </div>
 *    </wc-flip-box>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcFlipBox extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class'];
  }

  constructor() {
    super();
    //
    // TODO: NEED TO DOCUMENT WHAT IS HAPPENING HERE AND SEE IF WE CAN MAKE THIS A STANDARD.
    //
    const compEl = this.querySelector('.wc-flip-box');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-flip-box');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-flip-box');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('conntectCallback:wc-flip-box');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  // _handleAttributeChange(attrName, newValue) {    
  //   if (attrName === 'height') {
  //     this.height = newValue;
  //   } else if (attrName === 'width') {
  //     this.width = newValue;
  //   } else {
  //     super._handleAttributeChange(attrName, newValue);  
  //   }
  // }

  _render() {
    super._render();
    const innerEl = this.querySelector('.flip-box-inner');
    if (innerEl) {
      // Do nothing.
    } else {
      this.componentElement.innerHTML = '';

      const innerEl = this._createInnerElement();
      this.componentElement.appendChild(innerEl);      
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-flip-box');
  }

  _createInnerElement() {
    const flipBoxInner = document.createElement('div');
    flipBoxInner.classList.add('flip-box-inner');

    const front = this.querySelector('[slot="front"]');
    const back = this.querySelector('[slot="back"]');

    if (front) {
      front.classList.add('flip-box-front');
      flipBoxInner.appendChild(front);
    }

    if (back) {
      back.classList.add('flip-box-back');
      flipBoxInner.appendChild(back);
    }

    // Append the inner flip-box to the component
    this.componentElement.appendChild(flipBoxInner);

    return flipBoxInner;
  }

  _applyStyle() {
    const style = `
      /* The flip box container - set the width and height to whatever you want. We have added the border property to demonstrate that the flip itself goes out of the box on hover (remove perspective if you don't want the 3D effect */
      .wc-flip-box {
        background-color: transparent;
        /*
        width: 300px;
        height: 200px;
        */
        border: 1px solid var(--component-border-color);
        perspective: 1000px; /* Remove this if you don't want the 3D effect */
      }

      /* This container is needed to position the front and back side */
      .wc-flip-box .flip-box-inner {
        position: relative;
        width: 100%;
        height: 100%;
        text-align: center;
        transition: transform 0.8s;
        transform-style: preserve-3d;
      }

      /* Do an horizontal flip when you move the mouse over the flip box container */
      .wc-flip-box:hover .flip-box-inner {
        transform: rotateY(180deg);
      }

      /* Position the front and back side */
      .wc-flip-box .flip-box-front,
      .wc-flip-box .flip-box-back {
        position: absolute;
        width: 100%;
        height: 100%;
        -webkit-backface-visibility: hidden; /* Safari */
        backface-visibility: hidden;
      }

      /* Style the front side */
      .wc-flip-box .flip-box-front {
        background-color: var(--background-color);
        color: var(--text-color);
      }

      /* Style the back side */
      .wc-flip-box .flip-box-back {
        background-color: var(--background-color);
        color: var(--text-color);
        transform: rotateY(180deg);
      }`.trim();
    this.loadStyle('wc-flip-box-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
  }

}

customElements.define('wc-flip-box', WcFlipBox);
