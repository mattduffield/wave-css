import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-canvas-dot-highlight')) {
  class WcCanvasDotHighlight extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class'];
    }

    constructor() {
      super();
      const compEl = this.querySelector('.wc-canvas-dot-highlight');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-canvas-dot-highlight');
        this._createElement();
        this.appendChild(this.componentElement);      
      }
    }

    async connectedCallback() {
      super.connectedCallback();

      this._wireEvents();
      this._applyStyle();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    _handleAttributeChange(attrName, newValue) {    
      if (attrName === 'items') {
        // Do nothing...
      } else {
        super._handleAttributeChange(attrName, newValue);  
      }
    }

    _createElement() {
      const parts = Array.from(this.children).filter(p => !p.matches('wc-canvas-dot-highlight') && !p.matches('.wc-canvas-dot-highlight'));
      const canvas = document.createElement('canvas');
      canvas.id = 'dotCanvas';
      this.componentElement.appendChild(canvas);
      parts.forEach(p => this.componentElement.appendChild(p));
    }

    _applyStyle() {
      const style = `
        wc-canvas-dot-highlight {
          display: contents;
        }
        .wc-canvas-dot-highlight {
          position: relative;
        }
        .wc-canvas-dot-highlight canvas {
          border-radius: 8px;
          border: 1px solid gray;
          border-radius: 10px;
          background-color: #111;
        }
      `.trim();
      this.loadStyle('wc-canvas-dot-highlight', style);
    }


    _wireEvents() {
      const canvas = this.componentElement.querySelector('#dotCanvas');
      const ctx = canvas.getContext('2d');
  
      // Set canvas size
      canvas.width = window.innerWidth * 0.95;
      canvas.height = window.innerHeight * 0.95;
  
      // Configuration
      const config = {
        dotSpacing: 20,
        dotRadius: 1.25,
        highlightRadius: 160,
        defaultColor: '#444',
        highlightColor: '#40E0D0',
        backgroundColor: '#111111',
        animationSpeed: 0.15  // Speed of highlight movement (0-1)
      };
  
      // Calculate number of dots
      const cols = Math.floor(canvas.width / config.dotSpacing);
      const rows = Math.floor(canvas.height / config.dotSpacing);
  
      // Store positions
      let mouseX = canvas.width / 2;
      let mouseY = canvas.height / 2;
      let highlightX = canvas.width / 2;
      let highlightY = canvas.height / 2;
      let isMouseOnCanvas = false;
      // let targetX = canvas.width / 2;
      //let targetY = canvas.height / 2;
      let targetX = 0;
      let targetY = 0;
  
      // Update mouse position
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        if (isMouseOnCanvas) {
          targetX = mouseX;
          targetY = mouseY;
        }
      });
  
      // Handle mouse enter/leave
      canvas.addEventListener('mouseenter', (e) => {
        isMouseOnCanvas = true;
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        targetX = mouseX;
        targetY = mouseY;
      });
  
      canvas.addEventListener('mouseleave', () => {
        isMouseOnCanvas = false;
        //targetX = canvas.width / 2;
        //targetY = canvas.height / 2;      
        targetX = 0;
        targetY = 0;
      });
  
      // Draw function
      function draw() {
        // Clear canvas
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
  
        // Animate highlight position
        highlightX += (targetX - highlightX) * config.animationSpeed;
        highlightY += (targetY - highlightY) * config.animationSpeed;
  
        // First pass: Draw all dots in default color
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = (i + 0.5) * config.dotSpacing;
            const y = (j + 0.5) * config.dotSpacing;
  
            ctx.fillStyle = config.defaultColor;
            ctx.beginPath();
            ctx.arc(x, y, config.dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
  
        // Second pass: Draw highlight dots (with gradual fade when mouse leaves)
        const distanceToTarget = Math.sqrt(
          Math.pow(highlightX - targetX, 2) + 
          Math.pow(highlightY - targetY, 2)
        );
        const isNearTarget = distanceToTarget < 1;
  
        // if (!isMouseOnCanvas && isNearTarget) {
        if (!isMouseOnCanvas) {
          // Don't draw highlight when centered and mouse is off canvas
          return requestAnimationFrame(draw);
        }
  
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = (i + 0.5) * config.dotSpacing;
            const y = (j + 0.5) * config.dotSpacing;
  
            const dx = x - highlightX;
            const dy = y - highlightY;
            const distance = Math.sqrt(dx * dx + dy * dy);
  
            if (distance < config.highlightRadius) {
              const intensity = Math.pow(1 - (distance / config.highlightRadius), 2);
              // Fade out highlight as it returns to center
              const fadeMultiplier = isMouseOnCanvas ? 1 : Math.max(0, 1 - (isNearTarget ? 1 : 0));
              ctx.fillStyle = config.highlightColor;
              ctx.globalAlpha = intensity * fadeMultiplier;
              ctx.beginPath();
              ctx.arc(x, y, config.dotRadius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        // Reset global alpha
        ctx.globalAlpha = 1;
  
        // Request next frame
        requestAnimationFrame(draw);
      }
  
      // Handle window resize
      window.addEventListener('resize', () => {
        canvas.width = window.innerWidth * 0.95;
        canvas.height = window.innerHeight * 0.95;
        // Update center position
        if (!isMouseOnCanvas) {
          targetX = canvas.width / 2;
          targetY = canvas.height / 2;
        }
      });
  
      // Start animation
      draw();      
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }

  customElements.define('wc-canvas-dot-highlight', WcCanvasDotHighlight);
}

