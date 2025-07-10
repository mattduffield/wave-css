import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-hf-bot')) {
  // Global Transformers.js management
  let transformersModule = null;
  let markedModule = null;
  const loadedModels = new Map(); // Share models between bot instances
  const modelLoadingPromises = new Map(); // Prevent duplicate model loads
  
  class WcHfBot extends WcBaseComponent {
    static get observedAttributes() {
      return [
        'bot-id',
        'model',
        'system-prompt',
        'title',
        'placeholder',
        'theme',
        'position',
        'auto-open',
        'max-height',
        'temperature',
        'max-tokens',
        'debug',
        'check-gpu-compatibility',
        'force-enable'
      ];
    }

    // Known hardware configurations (same as wc-ai-bot)
    static KNOWN_CAPABLE_CONFIGS = [
      // Apple Silicon - excellent support
      { gpu: /Apple M[1-4]/, capability: 'high', name: 'Apple Silicon' },
      
      // High-end NVIDIA GPUs (RTX 30/40 series)
      { gpu: /RTX [34]0[6-9]0/, capability: 'high', name: 'NVIDIA RTX High-end' },
      { gpu: /RTX [34]0[7-8]0/, capability: 'high', name: 'NVIDIA RTX High-end' },
      
      // Mid-range NVIDIA GPUs
      { gpu: /RTX [34]0[5-6]0/, capability: 'medium', name: 'NVIDIA RTX Mid-range' },
      { gpu: /RTX 20[7-8]0/, capability: 'medium', name: 'NVIDIA RTX 20 Series' },
      { gpu: /GTX 16[6-8]0/, capability: 'low', name: 'NVIDIA GTX 16 Series' },
      
      // AMD GPUs (limited WebGPU support)
      { gpu: /Radeon RX 6[7-9]00/, capability: 'medium', name: 'AMD Radeon RX 6000' },
      { gpu: /Radeon RX 7[7-9]00/, capability: 'medium', name: 'AMD Radeon RX 7000' },
      
      // Known problematic hardware
      { gpu: /Intel.*HD Graphics/, capability: 'none', name: 'Intel HD Graphics' },
      { gpu: /Intel.*UHD Graphics/, capability: 'none', name: 'Intel UHD Graphics' },
      { gpu: /Intel.*Iris/, capability: 'low', name: 'Intel Iris' },
      { gpu: /Radeon Vega/, capability: 'low', name: 'AMD Radeon Vega' },
      { gpu: /GeForce MX/, capability: 'none', name: 'NVIDIA GeForce MX' }
    ];

    constructor() {
      super();
      
      // Internal state
      this._messages = [];
      this._isLoading = false;
      this._isModelReady = false;
      this._isMinimized = true;
      this._error = null;
      this._tokenizer = null;
      this._model = null;
      this._modelProgress = 0;
      this._isUnsupported = false;
      this._unsupportedReason = '';
      this._currentMessageId = null;
      this._currentResponse = '';
      
      // Bind methods
      this._handleSend = this._handleSend.bind(this);
      this._handleKeydown = this._handleKeydown.bind(this);
      this._handleToggle = this._handleToggle.bind(this);
      this._handleClose = this._handleClose.bind(this);
    }

    static get is() {
      return 'wc-hf-bot';
    }

    async _render() {
      this.classList.add('contents');
      
      // Check system capabilities before rendering
      const checkGPU = this.getAttribute('check-gpu-compatibility') !== 'false';
      if (checkGPU && !(await this._checkSystemCapabilities())) {
        // System doesn't meet requirements - render minimal fallback UI
        this._renderUnsupportedUI();
        return;
      }
      
      const title = this.getAttribute('title') || 'HF Assistant';
      const placeholder = this.getAttribute('placeholder') || 'Type your message...';
      
      // Create bot container
      this._container = document.createElement('div');
      this._container.className = 'wc-hf-bot-container';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'wc-hf-bot-header';
      header.innerHTML = `
        <div class="wc-hf-bot-header-title">
          <wc-fa-icon name="robot" icon-style="solid" size="1.2rem" class="mr-2"></wc-fa-icon>
          <span>${title}</span>
        </div>
        <div class="wc-hf-bot-header-actions">
          <button class="wc-hf-bot-toggle" aria-label="Toggle chat">
            <wc-fa-icon name="minus" icon-style="solid" size="1rem"></wc-fa-icon>
          </button>
          <button class="wc-hf-bot-close" aria-label="Close chat">
            <wc-fa-icon name="xmark" icon-style="solid" size="1rem"></wc-fa-icon>
          </button>
        </div>
      `;
      
      // Create messages container
      this._messagesContainer = document.createElement('div');
      this._messagesContainer.className = 'wc-hf-bot-messages';
      
      // Create input container
      const inputContainer = document.createElement('div');
      inputContainer.className = 'wc-hf-bot-input-container';
      
      this._input = document.createElement('textarea');
      this._input.className = 'wc-hf-bot-input';
      this._input.placeholder = placeholder;
      this._input.rows = 2;
      
      this._sendButton = document.createElement('button');
      this._sendButton.className = 'wc-hf-bot-send';
      this._sendButton.innerHTML = '<wc-fa-icon name="paper-plane" icon-style="solid" size="1rem"></wc-fa-icon>';
      this._sendButton.disabled = true;
      
      inputContainer.appendChild(this._input);
      inputContainer.appendChild(this._sendButton);
      
      // Assemble container
      this._container.appendChild(header);
      this._container.appendChild(this._messagesContainer);
      this._container.appendChild(inputContainer);
      
      // Add status bar for model loading
      this._statusBar = document.createElement('div');
      this._statusBar.className = 'wc-hf-bot-status';
      this._container.appendChild(this._statusBar);
      
      this.appendChild(this._container);
      
      // Create FAB button for bubble theme
      if (this.getAttribute('theme') === 'bubble' || !this.getAttribute('theme')) {
        this._fab = document.createElement('button');
        this._fab.className = 'wc-hf-bot-fab';
        this._fab.setAttribute('aria-label', 'Open chat');
        this._fab.innerHTML = '<wc-fa-icon name="message" icon-style="solid" size="1.5rem"></wc-fa-icon>';
        this._fab.addEventListener('click', () => {
          this._isMinimized = false;
          this.classList.add('wc-hf-bot--open');
          this._fab.style.display = 'none';
          setTimeout(() => this._input.focus(), 100);
        });
        this.appendChild(this._fab);
      }
      
      // Apply styles
      this._applyStyles();
      
      // Add event listeners
      this._sendButton.addEventListener('click', this._handleSend);
      this._input.addEventListener('keydown', this._handleKeydown);
      this._input.addEventListener('input', () => this._adjustInputHeight());
      
      const toggleBtn = this._container.querySelector('.wc-hf-bot-toggle');
      if (toggleBtn) toggleBtn.addEventListener('click', this._handleToggle);
      
      const closeBtn = this._container.querySelector('.wc-hf-bot-close');
      if (closeBtn) closeBtn.addEventListener('click', this._handleClose);
      
      // Initialize model
      await this._initializeModel();
      
      // Load marked for markdown parsing
      if (!markedModule) {
        try {
          const module = await import('https://cdn.jsdelivr.net/npm/marked@4/lib/marked.esm.js');
          markedModule = module;
          console.log('[wc-hf-bot] Marked module loaded successfully');
        } catch (error) {
          console.error('[wc-hf-bot] Failed to load marked module:', error);
        }
      }
      
      // Auto-open if specified
      if (this.getAttribute('auto-open') === 'true') {
        this._isMinimized = false;
        this.classList.add('wc-hf-bot--open');
        if (this._fab) {
          this._fab.style.display = 'none';
        }
      }
      
      // Add initial message
      this._addMessage('bot', this._getWelcomeMessage());
    }

    _applyStyles() {
      const style = `
        wc-hf-bot {
          display: contents;
        }

        /* Base container styles */
        .wc-hf-bot-container {
          display: flex;
          flex-direction: column;
          background: var(--component-bg-color);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        /* Header styles */
        .wc-hf-bot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--primary-bg-color);
          color: var(--primary-color);
        }

        .wc-hf-bot-header-title {
          display: flex;
          align-items: center;
          font-weight: 600;
        }

        .wc-hf-bot-header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .wc-hf-bot-header button {
          background: transparent;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: opacity 0.2s;
        }

        .wc-hf-bot-header button:hover {
          opacity: 0.8;
        }

        /* Messages container */
        .wc-hf-bot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          min-height: 200px;
          max-height: 400px;
          background: var(--component-bg-color);
        }

        /* Message styles */
        .wc-hf-bot-message {
          margin-bottom: 1rem;
          display: flex;
        }

        .wc-hf-bot-message--user {
          justify-content: flex-end;
        }

        .wc-hf-bot-message--bot {
          justify-content: flex-start;
        }

        .wc-hf-bot-message-bubble {
          max-width: 80%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .wc-hf-bot-message--user .wc-hf-bot-message-bubble {
          background: var(--primary-color);
          color: var(--primary-bg-color);
        }

        .wc-hf-bot-message--bot .wc-hf-bot-message-bubble {
          background: var(--primary-bg-color);
          color: var(--primary-color);
        }

        /* Markdown content styling */
        .wc-hf-bot-message-bubble p {
          margin: 0 0 0.5rem 0;
        }
        
        .wc-hf-bot-message-bubble p:last-child {
          margin-bottom: 0;
        }
        
        .wc-hf-bot-message-bubble ul,
        .wc-hf-bot-message-bubble ol {
          margin: 0 0 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        .wc-hf-bot-message-bubble li {
          margin-bottom: 0.25rem;
        }
        
        .wc-hf-bot-message-bubble pre {
          background: var(--code-bg-color, rgba(0,0,0,0.1));
          padding: 0.5rem;
          border-radius: 0.25rem;
          overflow-x: auto;
          margin: 0.5rem 0;
        }
        
        .wc-hf-bot-message-bubble code {
          background: var(--code-bg-color, rgba(0,0,0,0.1));
          padding: 0.125rem 0.25rem;
          border-radius: 0.125rem;
          font-size: 0.875em;
        }
        
        .wc-hf-bot-message-bubble pre code {
          background: none;
          padding: 0;
        }

        /* Transparent background for loading bubbles */
        .wc-hf-bot-message-bubble--loading {
          background: transparent !important;
          padding: 0 !important;
          display: flex;
          flex: 1 1 0%;
          justify-content: center;
          align-items: center;
          min-width: 100px;
          min-height: 60px;
        }

        /* Input container */
        .wc-hf-bot-input-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 0 1rem 1rem;
          border-top: 1px solid var(--border-color);
          background: var(--component-bg-color);
        }

        .wc-hf-bot-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          background: var(--input-bg-color);
          color: var(--input-color);
          resize: none;
          font-family: inherit;
          font-size: 0.875rem;
          line-height: 1.25rem;
          min-height: 3.5rem;
          max-height: 120px;
        }

        .wc-hf-bot-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-color-alpha);
        }

        .wc-hf-bot-send {
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: center;
          flex-shrink: 0;
          height: 2.5rem;
        }

        .wc-hf-bot-send:hover:not(:disabled) {
          opacity: 0.9;
        }

        .wc-hf-bot-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Status bar */
        .wc-hf-bot-status {
          display: none;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          background: var(--primary-bg-color);
          color: var(--primary-color);
          border-top: 1px solid var(--border-color);
        }

        .wc-hf-bot-status--error {
          background: var(--danger-color);
          color: var(--danger-contrast-color);
        }

        .wc-hf-bot-status--warning {
          background: var(--warning-color, #f59e0b);
          color: var(--warning-contrast-color, white);
        }

        /* FAB Button */
        .wc-hf-bot-fab {
          position: fixed;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--primary-bg-color);
          color: var(--primary-color);
          border: none;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wc-hf-bot-fab:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
        }

        /* FAB positions based on bot position */
        .wc-hf-bot--bubble.wc-hf-bot--bottom-right .wc-hf-bot-fab {
          bottom: 1rem;
          right: 1rem;
        }

        .wc-hf-bot--bubble.wc-hf-bot--bottom-left .wc-hf-bot-fab {
          bottom: 1rem;
          left: 1rem;
        }

        .wc-hf-bot--bubble.wc-hf-bot--top-right .wc-hf-bot-fab {
          top: 1rem;
          right: 1rem;
        }

        .wc-hf-bot--bubble.wc-hf-bot--top-left .wc-hf-bot-fab {
          top: 1rem;
          left: 1rem;
        }

        /* Hide FAB for non-bubble themes */
        .wc-hf-bot--minimal .wc-hf-bot-fab,
        .wc-hf-bot--sidebar .wc-hf-bot-fab {
          display: none !important;
        }

        /* Theme: Bubble */
        .wc-hf-bot--bubble .wc-hf-bot-container {
          position: fixed;
          width: 350px;
          height: 500px;
          z-index: 1000;
          transition: opacity 0.3s, transform 0.3s;
          opacity: 0;
          transform: scale(0.95);
          pointer-events: none;
        }

        .wc-hf-bot--bubble.wc-hf-bot--open .wc-hf-bot-container {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }

        /* Bubble positions */
        .wc-hf-bot--bubble.wc-hf-bot--bottom-right .wc-hf-bot-container {
          bottom: 1rem;
          right: 1rem;
        }

        .wc-hf-bot--bubble.wc-hf-bot--bottom-left .wc-hf-bot-container {
          bottom: 1rem;
          left: 1rem;
        }

        .wc-hf-bot--bubble.wc-hf-bot--top-right .wc-hf-bot-container {
          top: 1rem;
          right: 1rem;
        }

        .wc-hf-bot--bubble.wc-hf-bot--top-left .wc-hf-bot-container {
          top: 1rem;
          left: 1rem;
        }

        /* Theme: Minimal */
        .wc-hf-bot--minimal .wc-hf-bot-container {
          width: 100%;
          height: 100%;
          border-radius: 0;
          box-shadow: none;
        }

        .wc-hf-bot--minimal .wc-hf-bot-header {
          background: transparent;
          color: var(--color);
          border-bottom: 1px solid var(--border-color);
        }

        .wc-hf-bot--minimal .wc-hf-bot-header button {
          color: var(--color);
        }

        /* Theme: Sidebar */
        .wc-hf-bot--sidebar .wc-hf-bot-container {
          width: 100%;
          height: 100%;
          border-radius: 0;
        }

        .wc-hf-bot--sidebar .wc-hf-bot-messages {
          max-height: none;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .wc-hf-bot--bubble .wc-hf-bot-container {
            width: calc(100vw - 2rem);
            height: calc(100vh - 2rem);
            max-width: 350px;
            max-height: 500px;
          }
        }

        /* Unsupported UI */
        .wc-hf-bot-container--unsupported {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .wc-hf-bot-unsupported {
          text-align: center;
          padding: 2rem;
          max-width: 400px;
        }

        .wc-hf-bot-unsupported-icon {
          color: var(--warning-color, #f59e0b);
          margin-bottom: 1rem;
        }

        .wc-hf-bot-unsupported-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--color);
        }

        .wc-hf-bot-unsupported-message {
          color: var(--muted-color);
          margin-bottom: 1rem;
        }

        .wc-hf-bot-unsupported-help {
          font-size: 0.875rem;
          color: var(--muted-color);
        }
      `.trim();
      
      this.loadStyle('wc-hf-bot-style', style);
      
      // Handle dynamic theme changes
      const theme = this.getAttribute('theme') || 'bubble';
      const position = this.getAttribute('position') || 'bottom-right';
      const maxHeight = this.getAttribute('max-height');
      
      // Remove all theme classes first
      this.classList.remove('wc-hf-bot--bubble', 'wc-hf-bot--minimal', 'wc-hf-bot--sidebar');
      this.classList.remove('wc-hf-bot--bottom-right', 'wc-hf-bot--bottom-left', 
                           'wc-hf-bot--top-right', 'wc-hf-bot--top-left');
      
      // Add theme class
      this.classList.add(`wc-hf-bot--${theme}`);
      
      // Add position class for bubble theme
      if (theme === 'bubble' && position) {
        this.classList.add(`wc-hf-bot--${position}`);
      }
      
      // Apply max-height if specified and not bubble theme
      if (maxHeight && theme !== 'bubble' && this._container) {
        this._container.style.maxHeight = maxHeight;
      } else if (this._container) {
        this._container.style.maxHeight = '';
      }
      
      // Show/hide toggle button based on theme
      if (this._container) {
        const toggleBtn = this._container.querySelector('.wc-hf-bot-toggle');
        if (toggleBtn) {
          toggleBtn.style.display = theme === 'bubble' ? 'block' : 'none';
        }
      }
    }

    async _initializeModel() {
      let modelName = this.getAttribute('model');
      
      // Auto-select model based on detected capability if not specified
      if (!modelName && this._detectedCapability) {
        if (this._detectedCapability === 'high' || this._detectedCapability === 'medium') {
          modelName = 'Xenova/gpt2'; // Classic GPT-2 for better hardware
        } else {
          modelName = 'Xenova/distilgpt2'; // Smaller distilled GPT-2
        }
        
        if (this.getAttribute('debug') === 'true') {
          console.log(`[wc-hf-bot] Auto-selected model ${modelName} based on ${this._detectedCapability} capability`);
        }
      }
      
      // Default if still not set
      if (!modelName) {
        modelName = 'Xenova/distilgpt2';
      }
      
      const botId = this.getAttribute('bot-id') || 'default';
      
      try {
        this._updateStatus('Initializing AI model...');
        
        // Load Transformers.js module if not already loaded
        if (!transformersModule) {
          this._updateStatus('Loading Transformers.js...');
          transformersModule = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.0');
        }
        
        // Check if model is already loaded
        if (loadedModels.has(modelName)) {
          const cached = loadedModels.get(modelName);
          this._tokenizer = cached.tokenizer;
          this._model = cached.model;
          this._isModelReady = true;
          this._sendButton.disabled = false;
          this._updateStatus('');
          this._emitEvent('bot:ready', { botId, model: modelName });
          return;
        }
        
        // Check if model is currently loading
        if (modelLoadingPromises.has(modelName)) {
          this._updateStatus('Waiting for model to load...');
          const cached = await modelLoadingPromises.get(modelName);
          this._tokenizer = cached.tokenizer;
          this._model = cached.model;
          this._isModelReady = true;
          this._sendButton.disabled = false;
          this._updateStatus('');
          this._emitEvent('bot:ready', { botId, model: modelName });
          return;
        }
        
        // Load the model
        const loadPromise = this._loadModel(modelName);
        modelLoadingPromises.set(modelName, loadPromise);
        
        const loaded = await loadPromise;
        this._tokenizer = loaded.tokenizer;
        this._model = loaded.model;
        loadedModels.set(modelName, loaded);
        modelLoadingPromises.delete(modelName);
        
        this._isModelReady = true;
        this._sendButton.disabled = false;
        this._updateStatus('');
        this._emitEvent('bot:ready', { botId, model: modelName });
        
        // Mark success in localStorage
        localStorage.setItem('wc-hf-bot-success', 'true');
        
      } catch (error) {
        console.error('[wc-hf-bot] Failed to initialize model:', error);
        this._error = error.message;
        this._updateStatus(`Error: ${error.message}`, 'error');
        this._emitEvent('bot:error', { botId, error: error.message });
        
        // Mark failure in localStorage (unless force-enabled)
        if (this.getAttribute('force-enable') !== 'true') {
          localStorage.setItem('wc-hf-bot-failure', 'true');
        }
      }
    }

    async _loadModel(modelName) {
      const { AutoTokenizer, AutoModelForCausalLM, TextStreamer, InterruptableStoppingCriteria, env } = transformersModule;
      
      // No special env configuration needed for v3
      
      // Set up progress callback
      const progressCallback = (progress) => {
        if (progress.status === 'progress' && progress.file) {
          const percentage = Math.round((progress.progress || 0) * 100);
          this._modelProgress = percentage;
          this._updateStatus(`Downloading ${progress.file}: ${percentage}%`);
        } else if (progress.status === 'done') {
          this._updateStatus('Model loaded, initializing...');
        }
      };
      
      try {
        // Load tokenizer
        this._updateStatus('Loading tokenizer...');
        const tokenizer = await AutoTokenizer.from_pretrained(modelName, {
          progress_callback: progressCallback
        });
        
        // Load model with appropriate configuration
        this._updateStatus('Loading model...');
        
        // Check capabilities
        const hasWebGPU = 'gpu' in navigator;
        const hasFloat16 = typeof Float16Array !== 'undefined';
        
        // Build model options
        const modelOptions = {
          progress_callback: progressCallback
        };
        
        // Only use WebGPU and float16 if available
        if (hasWebGPU && hasFloat16) {
          modelOptions.dtype = 'q4f16';
          modelOptions.device = 'webgpu';
        } else if (hasWebGPU) {
          // WebGPU but no float16
          modelOptions.dtype = 'q4';
          modelOptions.device = 'webgpu';
        } else {
          // Fallback to CPU/WebGL
          modelOptions.dtype = 'q4';
        }
        
        if (this.getAttribute('debug') === 'true') {
          console.log('[wc-hf-bot] Model loading config:', {
            hasWebGPU,
            hasFloat16,
            modelOptions
          });
        }
        
        const model = await AutoModelForCausalLM.from_pretrained(modelName, modelOptions);
        
        return { tokenizer, model };
      } catch (error) {
        throw error;
      }
    }

    _handleAttributeChange(name, newValue, oldValue) {
      if (name === 'system-prompt' && this._isModelReady) {
        // System prompt changes can be applied to next conversation
        // We'll use it in the next message
      } else if (name === 'theme' || name === 'position' || name === 'max-height') {
        // Re-apply styles
        this._applyStyles();
      } else if (name === 'title' && this._container) {
        // Update title dynamically
        const titleEl = this._container.querySelector('.wc-hf-bot-header-title span');
        if (titleEl) titleEl.textContent = newValue;
      } else if (name === 'placeholder' && this._input) {
        this._input.placeholder = newValue || 'Type your message...';
      }
    }

    _handleSend() {
      const message = this._input.value.trim();
      if (!message || !this._isModelReady || this._isLoading) return;
      
      this._sendMessage(message);
    }

    _handleKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    }

    _handleToggle() {
      this._isMinimized = !this._isMinimized;
      this.classList.toggle('wc-hf-bot--open', !this._isMinimized);
      
      if (!this._isMinimized) {
        this._input.focus();
        if (this._fab) {
          this._fab.style.display = 'none';
        }
      } else {
        if (this._fab) {
          this._fab.style.display = 'flex';
        }
      }
    }

    _handleClose() {
      if (this.getAttribute('theme') === 'bubble') {
        this._isMinimized = true;
        this.classList.remove('wc-hf-bot--open');
        if (this._fab) {
          this._fab.style.display = 'flex';
        }
      } else {
        // For embedded bots, emit close event
        this._emitEvent('bot:closed', { botId: this.getAttribute('bot-id') });
      }
    }

    async _sendMessage(message) {
      const botId = this.getAttribute('bot-id') || 'default';
      
      // Add user message
      this._addMessage('user', message);
      this._input.value = '';
      this._adjustInputHeight();
      
      // Emit message sent event
      this._emitEvent('bot:message-sent', { botId, message });
      
      // Show loading state
      this._isLoading = true;
      this._sendButton.disabled = true;
      const loadingId = this._addMessage('bot', '...', true);
      this._currentMessageId = loadingId;
      this._currentResponse = '';
      
      try {
        // Prepare messages for the model
        const messages = this._prepareMessages(message);
        
        // Use the tokenizer's chat template if available
        let inputs;
        if (this._tokenizer.apply_chat_template) {
          // For models with chat templates (like Llama)
          const text = this._tokenizer.apply_chat_template(messages, {
            tokenize: false,
            add_generation_prompt: true,
          });
          inputs = await this._tokenizer(text);
        } else {
          // Fallback for models without chat templates
          const recentMessages = messages.slice(-5);
          const text = recentMessages.map(m => {
            if (m.role === 'system') return m.content;
            if (m.role === 'user') return `User: ${m.content}`;
            return `Assistant: ${m.content}`;
          }).join('\n') + '\nAssistant:';
          inputs = await this._tokenizer(text);
        }
        
        // Get generation parameters
        const temperature = parseFloat(this.getAttribute('temperature') || '0.7');
        const maxTokens = parseInt(this.getAttribute('max-tokens') || '1000');
        
        // Create TextStreamer from the v3 API
        const { TextStreamer } = transformersModule;
        
        // Create streamer with callback
        const streamer = new TextStreamer(this._tokenizer, {
          skip_prompt: true,
          skip_special_tokens: true,
          callback_function: (text) => {
            // Accumulate the response
            this._currentResponse += text;
            // Update the message display
            this._updateMessage(this._currentMessageId, this._currentResponse);
          }
        });
        
        // Generate response with streaming
        const output = await this._model.generate({
          ...inputs,
          max_new_tokens: maxTokens,
          temperature: temperature,
          do_sample: temperature > 0,
          streamer,
          return_dict_in_generate: true
        });
        
        // Log raw response to console if debug mode is enabled
        if (this.getAttribute('debug') === 'true') {
          console.log('[wc-hf-bot] Raw response:', this._currentResponse);
        }
        
        // Emit response received event
        this._emitEvent('bot:response-received', { botId, response: this._currentResponse });
        
      } catch (error) {
        console.error('[wc-hf-bot] Failed to get response:', error);
        this._updateMessage(loadingId, `Error: ${error.message}`);
        this._emitEvent('bot:error', { botId, error: error.message });
      } finally {
        this._isLoading = false;
        this._sendButton.disabled = false;
        this._input.focus();
      }
    }

    _prepareMessages(userMessage) {
      const systemPrompt = this.getAttribute('system-prompt') || 
        'You are a helpful AI assistant. Be concise and friendly in your responses.';
      
      const messages = [
        { role: 'system', content: systemPrompt }
      ];
      
      // Add conversation history (last 10 messages for context)
      const history = this._messages.slice(-10);
      history.forEach(msg => {
        if (msg.role !== 'system') {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      });
      
      // Add current message
      messages.push({ role: 'user', content: userMessage });
      
      return messages;
    }

    _addMessage(role, content, isLoading = false) {
      const messageId = Date.now().toString();
      const message = { id: messageId, role, content, timestamp: new Date(), isLoading };
      this._messages.push(message);
      
      const messageEl = document.createElement('div');
      messageEl.className = `wc-hf-bot-message wc-hf-bot-message--${role}`;
      messageEl.dataset.messageId = messageId;
      
      const bubbleEl = document.createElement('div');
      bubbleEl.className = 'wc-hf-bot-message-bubble';
      
      if (isLoading) {
        bubbleEl.classList.add('wc-hf-bot-message-bubble--loading');
        bubbleEl.innerHTML = '<wc-loader size="90px" speed="1s" thickness="12px"></wc-loader>';
      } else {
        // Use markdown for bot messages, plain text for user messages
        if (role === 'bot' && markedModule && markedModule.marked) {
          const html = markedModule.marked.parse(content);
          bubbleEl.innerHTML = html;
          if (this.getAttribute('debug') === 'true') {
            console.log('[wc-hf-bot] Parsed HTML:', html);
          }
        } else {
          bubbleEl.textContent = content;
        }
      }
      
      messageEl.appendChild(bubbleEl);
      this._messagesContainer.appendChild(messageEl);
      
      // Scroll to bottom
      this._messagesContainer.scrollTop = this._messagesContainer.scrollHeight;
      
      return messageId;
    }

    _updateMessage(messageId, content) {
      const messageEl = this._messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
      if (messageEl) {
        const bubbleEl = messageEl.querySelector('.wc-hf-bot-message-bubble');
        if (bubbleEl) {
          // Remove loading class when updating content
          bubbleEl.classList.remove('wc-hf-bot-message-bubble--loading');
          
          // Use markdown parser for bot messages
          if (markedModule && markedModule.marked) {
            const html = markedModule.marked.parse(content);
            bubbleEl.innerHTML = html;
            if (this.getAttribute('debug') === 'true') {
              console.log('[wc-hf-bot] Updated HTML:', html);
            }
          } else {
            bubbleEl.textContent = content;
          }
        }
      }
      
      // Update in messages array
      const message = this._messages.find(m => m.id === messageId);
      if (message) {
        message.content = content;
        message.isLoading = false;
      }
      
      // Scroll to bottom
      this._messagesContainer.scrollTop = this._messagesContainer.scrollHeight;
    }

    _updateStatus(status, type = 'info') {
      if (this._statusBar) {
        this._statusBar.textContent = status;
        this._statusBar.className = `wc-hf-bot-status wc-hf-bot-status--${type}`;
        this._statusBar.style.display = status ? 'block' : 'none';
      }
    }

    _adjustInputHeight() {
      this._input.style.height = 'auto';
      this._input.style.height = Math.min(this._input.scrollHeight, 120) + 'px';
    }

    _getWelcomeMessage() {
      const title = this.getAttribute('title') || 'HF Assistant';
      return `Hello! I'm ${title} powered by Hugging Face. How can I help you today?`;
    }

    _emitEvent(eventName, detail) {
      this.dispatchEvent(new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true
      }));
      
      // Also emit via EventHub
      const botId = this.getAttribute('bot-id');
      if (botId && window.wc && window.wc.EventHub) {
        window.wc.EventHub.broadcast(eventName, [`[bot-id="${botId}"]`], detail);
      }
    }

    async _checkSystemCapabilities() {
      try {
        // Allow force-enable for testing
        if (this.getAttribute('force-enable') === 'true') {
          console.warn('[wc-hf-bot] Force-enabled, skipping capability checks');
          return true;
        }
        
        // Check if user has previously succeeded or failed
        const previousSuccess = localStorage.getItem('wc-hf-bot-success');
        const previousFailure = localStorage.getItem('wc-hf-bot-failure');
        
        if (previousFailure === 'true' && previousSuccess !== 'true') {
          this._unsupportedReason = 'AI models previously failed to load on this device. Use force-enable="true" to retry.';
          return false;
        }
        
        // Check basic requirements
        const hasWebGPU = 'gpu' in navigator;
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        const hasWebGL = !!gl;
        
        if (!hasWebGPU && !hasWebGL) {
          this._unsupportedReason = 'WebGPU and WebGL are not available. A modern browser with GPU support is required.';
          return false;
        }
        
        // Get GPU renderer info
        let renderer = 'unknown';
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
        
        // Check against known configurations
        let detectedConfig = null;
        for (const config of WcHfBot.KNOWN_CAPABLE_CONFIGS) {
          if (config.gpu.test(renderer)) {
            detectedConfig = config;
            break;
          }
        }
        
        // Log detection results
        if (this.getAttribute('debug') === 'true') {
          console.log('[wc-hf-bot] Hardware detection:', {
            renderer,
            detectedConfig,
            hasWebGPU,
            hasWebGL,
            previousSuccess,
            previousFailure
          });
        }
        
        // Make decision based on hardware
        if (detectedConfig) {
          if (detectedConfig.capability === 'none') {
            this._unsupportedReason = `${detectedConfig.name} is not capable of running AI models efficiently. This would cause your browser to freeze.`;
            return false;
          }
          
          if (detectedConfig.capability === 'low') {
            // For HF models, we'll allow low capability hardware but with warnings
            console.warn('[wc-hf-bot] Low capability hardware detected. Performance may be poor.');
          }
          
          // Store capability for model selection
          this._detectedCapability = detectedConfig.capability;
          return true;
        }
        
        // Unknown hardware - check if user wants to proceed
        if (previousSuccess === 'true') {
          // User has successfully used it before on this hardware
          return true;
        }
        
        // For unknown hardware, be conservative
        this._unsupportedReason = `Unable to verify GPU compatibility (${renderer}). To protect your browsing experience, AI models are disabled. Add force-enable="true" to try anyway.`;
        return false;
        
      } catch (error) {
        console.error('[wc-hf-bot] Error checking system capabilities:', error);
        this._unsupportedReason = 'Error detecting system capabilities. AI models are disabled for safety.';
        return false;
      }
    }

    _renderUnsupportedUI() {
      this._isUnsupported = true;
      
      const theme = this.getAttribute('theme') || 'bubble';
      const title = this.getAttribute('title') || 'HF Assistant';
      
      // For bubble theme, don't show anything
      if (theme === 'bubble') {
        this.style.display = 'none';
        this._emitEvent('bot:unsupported', { 
          botId: this.getAttribute('bot-id'),
          reason: this._unsupportedReason
        });
        return;
      }
      
      // For embedded themes, show a message
      this._container = document.createElement('div');
      this._container.className = 'wc-hf-bot-container wc-hf-bot-container--unsupported';
      this._container.innerHTML = `
        <div class="wc-hf-bot-unsupported">
          <div class="wc-hf-bot-unsupported-icon">
            <wc-fa-icon name="triangle-exclamation" icon-style="solid" size="2rem"></wc-fa-icon>
          </div>
          <h3 class="wc-hf-bot-unsupported-title">${title} Unavailable</h3>
          <p class="wc-hf-bot-unsupported-message">${this._unsupportedReason}</p>
          <p class="wc-hf-bot-unsupported-help">
            For the best experience, please use a modern browser on a device with GPU support.
          </p>
        </div>
      `;
      
      this.appendChild(this._container);
      this._applyStyles();
      
      this._emitEvent('bot:unsupported', { 
        botId: this.getAttribute('bot-id'),
        reason: this._unsupportedReason
      });
    }

    // Public methods
    async sendMessage(text) {
      if (this._isModelReady && !this._isLoading) {
        this._input.value = text;
        await this._sendMessage(text);
      }
    }

    static async getAvailableModels() {
      // Load Transformers.js module if not already loaded
      if (!transformersModule) {
        transformersModule = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      }
      
      // Common Hugging Face models that work with Transformers.js v2
      // Models must be in ONNX format and compatible with current version
      return [
        { model_id: 'Xenova/distilgpt2', description: 'DistilGPT2 - Tiny model for testing (~250MB)' },
        { model_id: 'Xenova/gpt2', description: 'GPT-2 Small - Classic model (~500MB)' },
        { model_id: 'Xenova/gpt2-medium', description: 'GPT-2 Medium - Better quality (~1.5GB)' },
        { model_id: 'Xenova/DialoGPT-small', description: 'DialoGPT - Optimized for conversations (~350MB)' },
        { model_id: 'Xenova/DialoGPT-medium', description: 'DialoGPT Medium - Better conversations (~1.5GB)' },
        { model_id: 'Xenova/bloom-560m', description: 'BLOOM 560M - Multilingual model (~1.1GB)' },
      ];
    }

    static async checkSystemSupport() {
      try {
        // Check previous results
        const previousSuccess = localStorage.getItem('wc-hf-bot-success') === 'true';
        const previousFailure = localStorage.getItem('wc-hf-bot-failure') === 'true';
        
        // Basic capability checks
        const hasWebGPU = 'gpu' in navigator;
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        const hasWebGL = !!gl;
        
        if (!hasWebGPU && !hasWebGL) {
          return {
            supported: false,
            reason: 'No WebGPU or WebGL support',
            hasWebGPU,
            hasWebGL
          };
        }
        
        // Get GPU info
        let renderer = 'unknown';
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
        
        // Check against known configs
        let detectedConfig = null;
        for (const config of WcHfBot.KNOWN_CAPABLE_CONFIGS) {
          if (config.gpu.test(renderer)) {
            detectedConfig = config;
            break;
          }
        }
        
        // Build response
        const result = {
          renderer,
          hasWebGPU,
          hasWebGL,
          previousSuccess,
          previousFailure
        };
        
        if (detectedConfig) {
          result.hardware = detectedConfig.name;
          result.capability = detectedConfig.capability;
          result.supported = detectedConfig.capability !== 'none';
          
          if (detectedConfig.capability === 'high') {
            result.recommendation = 'Excellent hardware for AI models. Can run large models smoothly.';
            result.suggestedModel = 'Xenova/gpt2-medium';
          } else if (detectedConfig.capability === 'medium') {
            result.recommendation = 'Good hardware for AI models. Suitable for medium-sized models.';
            result.suggestedModel = 'Xenova/gpt2';
          } else if (detectedConfig.capability === 'low') {
            result.recommendation = 'Limited hardware. Only small AI models recommended.';
            result.suggestedModel = 'Xenova/distilgpt2';
          } else {
            result.recommendation = 'This hardware cannot run AI models efficiently.';
            result.suggestedModel = null;
          }
        } else {
          // Unknown hardware
          result.hardware = 'Unknown';
          result.capability = 'unknown';
          result.supported = previousSuccess && !previousFailure;
          result.recommendation = previousSuccess ? 
            'This hardware has successfully run AI models before.' :
            'Unknown hardware. Use force-enable="true" to try at your own risk.';
        }
        
        return result;
      } catch (error) {
        return {
          supported: false,
          error: error.message,
          recommendation: 'Error detecting hardware capabilities.'
        };
      }
    }

    static clearStoredPreferences() {
      localStorage.removeItem('wc-hf-bot-success');
      localStorage.removeItem('wc-hf-bot-failure');
    }

    clearConversation() {
      this._messages = [];
      this._messagesContainer.innerHTML = '';
      this._addMessage('bot', this._getWelcomeMessage());
      this._emitEvent('bot:conversation-cleared', { 
        botId: this.getAttribute('bot-id') 
      });
    }

    exportConversation() {
      return {
        botId: this.getAttribute('bot-id'),
        model: this.getAttribute('model'),
        messages: this._messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        }))
      };
    }

    setContext(context) {
      this.setAttribute('system-prompt', context);
    }

    toggleMinimize() {
      if (this.getAttribute('theme') === 'bubble') {
        this._handleToggle();
      }
    }
  }
  
  customElements.define(WcHfBot.is, WcHfBot);
}