/**
 * Name: wc-script
 * Usage:
 *   <wc-script src="https://example.com/script.js"></wc-script>
 *
 * Description:
 *   The purpose of this component is to dynamically add a <script> tag to the document head
 *   if it doesn't already exist. The `src` attribute specifies the script source.
 *   It also dispatches a custom event when the script is loaded or fails to load.
 */

if (!customElements.get('wc-script')) {
  class WcScript extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      const src = this.getAttribute('src'); // Get the script source from the attribute
      if (!window.wc) {
        window.wc = {};
      }
      if (!window.wc.scriptsLoaded) {
        window.wc["scriptsLoaded"] = {};
      }

      if (src) {
        const scriptId = `wc-script-${this.id || this.dataset.id || crypto.randomUUID()}`;

        // Check if the script is already appended
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = src;
          script.id = scriptId; // Set a unique ID to prevent duplication

          // Listen for the load and error events
          script.onload = () => {
            console.log(`Script loaded: ${src}`);
            window.wc.scriptsLoaded[src] = true;
            document.body.dispatchEvent(new CustomEvent('script-loaded', {
              detail: { src },
              bubbles: true,
              composed: true
            }));
          };

          script.onerror = () => {
            console.error(`Failed to load script: ${src}`);
            document.body.dispatchEvent(new CustomEvent('script-error', {
              detail: { src },
              bubbles: true,
              composed: true
            }));
          };

          document.head.appendChild(script); // Append the script to the document head
          console.log(`Added script: ${src}`);
        } else {
          console.log(`Script already exists, skipping append: ${src}`);
          document.body.dispatchEvent(new CustomEvent('script-loaded', {
            detail: { src },
            bubbles: true,
            composed: true
          }));
        }
      } else {
        console.warn('No src provided for wc-script component.');
      }

      // Optionally remove the component from the DOM to clean up
      this.remove();
    }
  }

  customElements.define('wc-script', WcScript);
}
