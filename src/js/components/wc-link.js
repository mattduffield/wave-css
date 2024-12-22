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
    }

    connectedCallback() {
      const url = this.getAttribute('url'); // Get the URL from the attribute

      if (url) {
        const linkId = `wc-link-${btoa(url).replace(/=/g, '')}`; // Create a unique ID based on the URL

        // Check if the link is already appended
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = url;
          link.id = linkId; // Set a unique ID to prevent duplication
          document.head.appendChild(link); // Append the link to the document head
          console.log(`Added link: ${url}`);
        } else {
          console.log(`Link already exists, skipping append: ${url}`);
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
