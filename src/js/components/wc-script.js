/**
 * 
 *  Name: wc-script
 *  Usage:
 *    <wc-script>
 * 
 *    </wc-script>
 * 
 *  Description: 
 *    The purpose of this component is to allow you to add script tags regardless if this
 *    is a standard request/response or HTMX.
 */

if (!customElements.get('wc-script')) {

  class WcScript extends HTMLElement {
    connectedCallback() {
      const scriptContent = this.textContent.trim(); // Get the JavaScript content

      if (scriptContent) {
        const scriptId = `wc-script-${this.id || this.dataset.id || crypto.randomUUID()}`;

        // Check if the script is already appended
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.textContent = scriptContent; // Set the script content
          script.id = scriptId; // Add an ID to the script to prevent duplication
          document.head.appendChild(script); // Append the script to the document head
        } else {
          console.log('Script already exists, skipping append:', scriptId);
        }
      }

      // Optionally clear the content to hide the script in the DOM
      this.textContent = '';  
    }
  }

  customElements.define('wc-script', WcScript);
}