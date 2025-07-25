/**
 * 
 *  Name: wc-slideshow
 *  Usage:
 *    <wc-slideshow class="mb-4" autoplay autoplay-interval="3000">
 *      <wc-slideshow-image
 *        url="https://www.w3schools.com/howto/img_nature_wide.jpg"
 *        caption="Caption 1"></wc-slideshow-image>
 *      <wc-slideshow-image
 *        url="https://www.w3schools.com/howto/img_snow_wide.jpg"
 *        caption="Caption 2"></wc-slideshow-image>
 *      <wc-slideshow-image
 *        url="https://www.w3schools.com/howto/img_lights_wide.jpg"
 *        caption="Caption 3"></wc-slideshow-image>
 *      <wc-slideshow-image
 *        url="https://www.w3schools.com/howto/img_mountains_wide.jpg"
 *        caption="Caption 4"></wc-slideshow-image>
 *    </wc-slideshow>
 * 
 *  API:
 *    wc.EventHub.broadcast('wc-slideshow:next', ['[data-wc-id="0982-a544-98da-b3da"]'])
 *    wc.EventHub.broadcast('wc-slideshow:prev', ['[data-wc-id="0982-a544-98da-b3da"]'])
 *    wc.EventHub.broadcast('wc-slideshow:start', ['[data-wc-id="0982-a544-98da-b3da"]'])
 *    wc.EventHub.broadcast('wc-slideshow:stop', ['[data-wc-id="0982-a544-98da-b3da"]'])
 */


import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-slideshow')) {
  class WcSlideshow extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'max-image-height', 'autoplay', 'autoplay-interval'];
    }

    constructor() {
      super();
      this.slides = [];
      this.slideshowInterval = null;
      this.isPaused = false;
      this.slideIndex = 1;
      this.childComponentSelector = 'wc-slideshow-image'; // We wait until the child component renders...
      const compEl = this.querySelector('.wc-slideshow');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-slideshow', 'container');
        this.appendChild(this.componentElement);      
      }
      // console.log('ctor:wc-slideshow');
    }

    async connectedCallback() {
      super.connectedCallback();

      this._applyStyle();
      this._wireEvents();
      // console.log('connectedCallback:wc-slideshow');
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
      const wcSlideshowImages = this.querySelectorAll('wc-slideshow-image');
      wcSlideshowImages.forEach((w, idx) => {
        w.setAttribute('numbertext', `${idx + 1} / ${wcSlideshowImages.length}`);
        const imgs = w.querySelectorAll('img');
        imgs.forEach(i => i.style.maxHeight = this.getAttribute('max-image-height') || '300px');
      });
      this.slides = this.querySelectorAll('.wc-slideshow-image.slide');
      const innerEl = this.querySelector('.wc-slideshow > *');
      if (innerEl) {
        this.slideIndex = parseInt(this.dataset.slideIndex || 1);
      } else {
        this.componentElement.innerHTML = '';
        this._createInnerElement();
      }

      // console.log('_render:wc-slideshow');
    }

    _createInnerElement() {
      const els = this.querySelectorAll('wc-slideshow > *:not(.wc-slideshow)');
      els.forEach(el => {
        this.componentElement.appendChild(el);
      });
      const prev = document.createElement('a');
      prev.classList.add('prev');
      prev.textContent = '\u276E';
      const next = document.createElement('a');
      next.textContent = '\u276F';
      next.classList.add('next');
      const play = document.createElement('a');
      play.classList.add('play');
      play.textContent = '\u25B6';
      const pause = document.createElement('a');
      pause.classList.add('pause');
      pause.textContent = '\u23F8';
      this.componentElement.appendChild(prev);
      this.componentElement.appendChild(next);
      this.componentElement.appendChild(play);
      this.componentElement.appendChild(pause);
    }

    _handleHelper(event, mode='next') {
      const {detail} = event;
      const {selector = this} = detail;
      const isArray = Array.isArray(selector);
      if (typeof selector === 'string' || isArray) {
        const tgts = document.querySelectorAll(selector);
        tgts.forEach(tgt => {
          if (tgt === this) {
            if (mode === 'next') {
              this._nextSlide({target: this});
            } else if (mode === 'prev') {
              this._prevSlide({target: this});
            } else if (mode === 'start') {
              this.setAttribute('autoplay', '');
              this.isPaused = false;
              this.componentElement.classList.add('is-playing');
              this._startSlideshow();
            } else if (mode === 'stop') {
              this.removeAttribute('autoplay');
              this.isPaused = true;
              this.componentElement.classList.remove('is-playing');
              clearInterval(this.slideshowInterval);
            }
          }
        });
      } else {
        if (selector === this) {
          if (mode === 'next') {
            this._nextSlide({target: this});
          } else if (mode === 'prev') {
            this._prevSlide({target: this});
          } else if (mode === 'start') {
            this.setAttribute('autoplay', '');
            this.isPaused = false;
            this.componentElement.classList.add('is-playing');
            this._startSlideshow();
          } else if (mode === 'stop') {
            this.removeAttribute('autoplay');
            this.isPaused = true;
            this.componentElement.classList.remove('is-playing');
            clearInterval(this.slideshowInterval);          
          }
        }
      }
    }

    _handleNext(event) {
      this._handleHelper(event, 'next');
    }

    _handlePrev(event) {
      this._handleHelper(event, 'prev');
    }

    _handleStart(event) {
      this._handleHelper(event, 'start');
    }

    _handleStop(event) {
      this._handleHelper(event, 'stop');
    }


    _prevSlide(event) {
      if (event?.target) {
        this.isPaused = true;
        this.componentElement.classList.remove('is-playing');
        clearInterval(this.slideshowInterval);
      }
      this.slideIndex -= 1;
      this._showSlide();
    }

    _nextSlide(event) {
      if (event?.target) {
        this.isPaused = true;
        this.componentElement.classList.remove('is-playing');
        clearInterval(this.slideshowInterval);
      }
      this.slideIndex += 1;
      this._showSlide();
    }

    _showSlide() {
      if (this.slideIndex > this.slides.length) {
        this.slideIndex = 1;
      }
      if (this.slideIndex < 1) {
        this.slideIndex = this.slides.length;
      }
      this.slides.forEach(s => s.style.display = 'none');
      this.slides[this.slideIndex - 1].style.display = 'block';
      this.dataset.slideIndex = this.slideIndex;
    }

    _startSlideshow() {
      if (this.hasAttribute('autoplay') && !this.isPaused) {
        const interval = parseInt(this.getAttribute('autoplay-interval')) || 5000;
        this.slideshowInterval = setInterval(() => this._nextSlide(), interval);
        this.componentElement.classList.add('is-playing');
      }
      this._showSlide();
    }

    _handleVisibilityChange() {
      if (document.hidden) {
        this.isPaused = true;
        this.componentElement.classList.remove('is-playing');
        clearInterval(this.slideshowInterval);
      } else {
        this.isPaused = false;
        this._startSlideshow();
      }
    }

    _applyStyle() {
      const style = `
        wc-slideshow {
          display: contents;
        }
        .wc-slideshow {

        }
        .wc-slideshow .play,
        .wc-slideshow .pause {
          cursor: pointer;
          position: absolute;
          top: calc(50% - 36px);
          left: calc(50% - 30px);
          width: auto;
          padding: 16px;
          color: white;
          font-weight: bold;
          font-size: 36px;
          transition: 0.6s ease;
          border-radius: 0 3px 3px 0;
          user-select: none;

          display: none;
        }
        .wc-slideshow.is-playing:hover .pause {
          display: block;
        }
        .wc-slideshow:not(.is-playing):hover .play {
          display: block;
        }
        /* Slideshow container */
        .wc-slideshow.container {
          max-width: 1000px;
          position: relative;
          margin: auto;
        }

        /* Hide the images by default */
        .wc-slideshow .slide {
          display: none;
        }

        /* Next & previous buttons */
        .wc-slideshow .prev,
        .wc-slideshow .next {
          cursor: pointer;
          position: absolute;
          top: 50%;
          width: auto;
          margin-top: -22px;
          padding: 16px;
          color: white;
          font-weight: bold;
          font-size: 18px;
          transition: 0.6s ease;
          border-radius: 0 3px 3px 0;
          user-select: none;
        }

        /* Position the "next button" to the right */
        .wc-slideshow .next {
          right: 16px;
          border-radius: 3px 0 0 3px;
        }

        /* On hover, add a black background color with a little bit see-through */
        .wc-slideshow .prev:hover,
        .wc-slideshow .next:hover {
          background-color: rgba(0,0,0,0.8);
        }

        .wc-slideshow .active {
          background-color: #717171;
        }

        /* Fading animation */
        .wc-slideshow .fade {
          animation-name: slideshow-fade;
          animation-duration: 1.5s;
        }

        @keyframes slideshow-fade {
          from {
            opacity: .4;
          }
          to {
            opacity: 1;
          }
        }
  `.trim();
      this.loadStyle('wc-slideshow-style', style);
    }

    _wireEvents() {
      super._wireEvents();
      const isWired = this.hasAttribute('data-wired');
      if (isWired) return;
      this.setAttribute('data-wired', true);
      setTimeout(() => {
        const prev = this.querySelector('.prev');
        const next = this.querySelector('.next');
        const play = this.querySelector('.play');
        const pause = this.querySelector('.pause');
        prev.addEventListener('click', this._prevSlide.bind(this));
        next.addEventListener('click', this._nextSlide.bind(this));  
        play.addEventListener('click', this._handleStart.bind(this));  
        pause.addEventListener('click', this._handleStop.bind(this));  
        this._startSlideshow();
      }, 50);
      document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
      document.body.addEventListener('wc-slideshow:next', this._handleNext.bind(this));
      document.body.addEventListener('wc-slideshow:prev', this._handlePrev.bind(this));
      document.body.addEventListener('wc-slideshow:start', this._handleStart.bind(this));
      document.body.addEventListener('wc-slideshow:stop', this._handleStop.bind(this));
    }

    _unWireEvents() {
      super._unWireEvents();
      document.removeEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
      document.body.removeEventListener('wc-slideshow:next', this._handleNext.bind(this));
      document.body.removeEventListener('wc-slideshow:prev', this._handlePrev.bind(this));
      document.body.removeEventListener('wc-slideshow:start', this._handleStart.bind(this));
      document.body.removeEventListener('wc-slideshow:stop', this._handleStop.bind(this));
      const prev = this.querySelector('.prev');
      const next = this.querySelector('.next');
      const play = this.querySelector('.play');
      const pause = this.querySelector('.pause');
      prev?.removeEventListener('click', this._prevSlide.bind(this));
      next?.removeEventListener('click', this._nextSlide.bind(this));
      play?.removeEventListener('click', this._handleStart.bind(this));
      pause?.removeEventListener('click', this._handleStop.bind(this));  
    }

  }

  customElements.define('wc-slideshow', WcSlideshow);
}