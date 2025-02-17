class WcArticleCard extends HTMLElement {
  constructor() {
    super();
    this.articleData = null;
  }

  static get observedAttributes() {
    return ['url'];
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'url' && oldValue !== newValue) {
      await this.fetchArticleData(newValue);
    }
  }

  async fetchArticleData(url) {
    try {
      const response = await fetch(`/api/article-metadata?url=${encodeURIComponent(url)}`);
      this.articleData = await response.json();
      this.render();
    } catch (error) {
      console.error('Error fetching article data:', error);
    }
  }

  connectedCallback() {
    if (this.getAttribute('url')) {
      this.fetchArticleData(this.getAttribute('url'));
    }
  }

  render() {
    if (!this.articleData) return;

    const { title, description, imageUrl, publishDate, domain } = this.articleData;
    
    this.innerHTML = `
      <div class="wc-article-card">
        <div class="article-image">
          <img src="${imageUrl ? imageUrl: ''}" alt="${title}">
        </div>
        <div class="article-content">
          <h2 class="article-title">${title}</h2>
          <p class="article-description">${description}</p>
          <div class="article-meta">
            <span class="article-domain">${domain}</span>
            <span class="article-date">${new Date(publishDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('wc-article-card', WcArticleCard);