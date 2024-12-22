/**
 * Name: wc-script
 * Usage:
 *   <wc-script src="https://example.com/script.js"></wc-script>
 *
 * Description:
 *   The purpose of this component is to dynamically add a <script> tag to the document head
 *   if it doesn't already exist. The `src` attribute specifies the script source.
 */

if (!customElements.get('wc-script')) {
  class WcScript extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      const src = this.getAttribute('src'); // Get the script source from the attribute

      if (src) {
        const scriptId = `wc-script-${btoa(src).replace(/=/g, '')}`; // Create a unique ID based on the src

        // Check if the script is already appended
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = src;
          script.id = scriptId; // Set a unique ID to prevent duplication
          document.head.appendChild(script); // Append the script to the document head
          console.log(`Added script: ${src}`);
        } else {
          console.log(`Script already exists, skipping append: ${src}`);
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
