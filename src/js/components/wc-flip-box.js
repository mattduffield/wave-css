/**
 *
 *  Name: wc-flip-box
 *  Usage:
 *    <!-- Default hover mode -->
 *    <wc-flip-box class="h-40 w-40 mb-4">
 *      <div slot="front" class="theme-coral-sunset dark">
 *        <h2>Front Side</h2>
 *      </div>
 *      <div slot="back" class="theme-royal-blue light">
 *        <h2>Back Side</h2>
 *      </div>
 *    </wc-flip-box>
 *
 *    <!-- Click mode with button -->
 *    <wc-flip-box class="h-40 w-40 mb-4" flip-on="click">
 *      <div slot="front" class="theme-midnight dark">
 *        <h2>Front Side</h2>
 *        <p>Click the button to flip</p>
 *      </div>
 *      <div slot="back" class="theme-ocean light">
 *        <h2>Back Side</h2>
 *        <p>Click again to flip back</p>
 *      </div>
 *    </wc-flip-box>
 *
 *    <!-- Custom flip icon -->
 *    <wc-flip-box class="h-40 w-40 mb-4" flip-on="click" flip-icon="⟲">
 *      <div slot="front">...</div>
 *      <div slot="back">...</div>
 *    </wc-flip-box>
 *
 *  Attributes:
 *    - flip-on: "hover" (default) or "click"
 *    - flip-icon: Custom icon/text for flip button (default: "↻")
 *
 *  Events:
 *    - flip: Dispatched when card flips (detail: { isFlipped: boolean })
 *
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcFlipBox extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'flip-on', 'flip-icon'];
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
    this.isFlipped = false;
    // console.log('ctor:wc-flip-box');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    this._wireEvents();
    // console.log('connectedCallback:wc-flip-box');
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
    // console.log('_render:wc-flip-box');
  }

  _createInnerElement() {
    const flipBoxInner = document.createElement('div');
    flipBoxInner.classList.add('flip-box-inner');

    const front = this.querySelector('[slot="front"]');
    const back = this.querySelector('[slot="back"]');
    const flipOn = this.getAttribute('flip-on') || 'hover';

    if (front) {
      front.classList.add('flip-box-front');

      // Add flip button if flip-on="click"
      if (flipOn === 'click') {
        const flipButton = this._createFlipButton();
        front.appendChild(flipButton);
      }

      flipBoxInner.appendChild(front);
    }

    if (back) {
      back.classList.add('flip-box-back');

      // Add flip button if flip-on="click"
      if (flipOn === 'click') {
        const flipButton = this._createFlipButton();
        back.appendChild(flipButton);
      }

      flipBoxInner.appendChild(back);
    }

    // Append the inner flip-box to the component
    this.componentElement.appendChild(flipBoxInner);

    return flipBoxInner;
  }

  _createFlipButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('flip-button');

    const icon = this.getAttribute('flip-icon') || '↻';
    button.innerHTML = icon;

    return button;
  }

  _handleFlipClick(event) {
    event.stopPropagation();
    this.isFlipped = !this.isFlipped;

    const innerEl = this.querySelector('.flip-box-inner');
    if (innerEl) {
      if (this.isFlipped) {
        innerEl.classList.add('flipped');
      } else {
        innerEl.classList.remove('flipped');
      }
    }

    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('flip', {
      detail: { isFlipped: this.isFlipped },
      bubbles: true
    }));
  }

  _wireEvents() {
    const flipOn = this.getAttribute('flip-on') || 'hover';

    if (flipOn === 'click') {
      // Wire up flip button clicks
      this._boundFlipClick = this._handleFlipClick.bind(this);
      this.addEventListener('click', (e) => {
        if (e.target.classList.contains('flip-button')) {
          this._boundFlipClick(e);
        }
      });
    }
  }

  _applyStyle() {
    const style = `
      wc-flip-box {
        display: contents;
      }

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
        transition: transform 0.8s;
        transform-style: preserve-3d;
      }

      /* Do an horizontal flip when you move the mouse over the flip box container (only for hover mode) */
      .wc-flip-box:hover .flip-box-inner {
        transform: rotateY(180deg);
      }

      /* For click mode, use flipped class instead of hover */
      .wc-flip-box .flip-box-inner.flipped {
        transform: rotateY(180deg);
      }

      /* Disable hover flip when using click mode */
      wc-flip-box[flip-on="click"] .wc-flip-box:hover .flip-box-inner:not(.flipped) {
        transform: none;
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
        background-color: var(--card-bg-color);
        color: var(--text-1);
      }

      /* Style the back side */
      .wc-flip-box .flip-box-back {
        background-color: var(--card-bg-color);
        color: var(--text-1);
        transform: rotateY(180deg);
      }

      /* Flip button styling */
      .flip-button {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: background 0.2s;
        z-index: 10;
      }

      .flip-button:hover {
        background: rgba(0, 0, 0, 0.7);
      }

      .flip-button:active {
        transform: scale(0.95);
      }`.trim();
    this.loadStyle('wc-flip-box-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
  }

}

customElements.define('wc-flip-box', WcFlipBox);
