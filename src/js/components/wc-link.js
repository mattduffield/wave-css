/**
 * Name: wc-link
 * Usage:
 *   <wc-link url="https://example.com/styles.css"></wc-link>
 *
 * Description:
 *   The purpose of this component is to dynamically add a <link> tag to the document head
 *   if it doesn't already exist. The `url` attribute specifies the href for the link.
 */

if (!customElements.get('wc-link')) {
  class WcLink extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      const url = this.getAttribute('url'); // Get the URL from the attribute

      if (url) {
        const linkId = `wc-link-${this.id || this.dataset.id || crypto.randomUUID()}`;
        if (!window.wc) {
          window.wc = {};
        }
        if (!window.wc.scriptsLoaded) {
          window.wc["linksLoaded"] = {};
        }
  

        // Check if the link is already appended
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = url;
          link.id = linkId; // Set a unique ID to prevent duplication

          // Listen for the load and error events
          link.onload = () => {
            console.log(`Link loaded: ${url}`);
            window.wc.linksLoaded[url] = true;
            document.body.dispatchEvent(new CustomEvent('link-loaded', {
              detail: { url },
              bubbles: true,
              composed: true
            }));
          };

          link.onerror = () => {
            console.error(`Failed to load link: ${url}`);
            document.body.dispatchEvent(new CustomEvent('link-error', {
              detail: { url },
              bubbles: true,
              composed: true
            }));
          };

          document.head.appendChild(link); // Append the link to the document head
          console.log(`Added link: ${url}`);
        } else {
          console.log(`Link already exists, skipping append: ${url}`);
          document.body.dispatchEvent(new CustomEvent('link-loaded', {
            detail: { url },
            bubbles: true,
            composed: true
          }));
        }
      } else {
        console.warn('No URL provided for wc-link component.');
      }

      // Optionally remove the component from the DOM to clean up
      this.remove();
    }
  }

  customElements.define('wc-link', WcLink);
}
