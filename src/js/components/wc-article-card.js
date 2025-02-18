import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-article-card')) {
  class WcArticleCard extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'url', 'img-url', 'article-type'];
    }

    constructor() {
      super();
      this.imgUrl = '';
      this.articleTypes = {
        'news': 'https://images.pexels.com/photos/1755683/pexels-photo-1755683.jpeg?auto=compress&cs=tinysrgb&w=768',
        'css': 'https://miro.medium.com/v2/da:true/resize:fit:768/0*1YrO9YLbwHnzExsO',
        'technology': 'https://images.pexels.com/photos/2653362/pexels-photo-2653362.jpeg?auto=compress&cs=tinysrgb&w=768',
        'programming': 'https://images.pexels.com/photos/6424591/pexels-photo-6424591.jpeg?auto=compress&cs=tinysrgb&w=768'
      };
      this.articleData = null;
      this.articleType = 'news';
      const compEl = this.querySelector('.wc-article-card');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-article-card');
        this._createElement();
        this.appendChild(this.componentElement);      
      }
    }

    async connectedCallback() {
      super.connectedCallback();

      if (this.getAttribute('url')) {
        this.fetchArticleData(this.getAttribute('url'));
      }

      await this._applyStyle();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    _handleAttributeChange(attrName, newValue) {    
      if (attrName === 'url') {
        // await this.fetchArticleData(newValue);
      } else if (attrName === 'img-url') {
        this.imgUrl = newValue;
      } else if (attrName === 'article-type') {
        this.imgUrl = this.articleTypes[newValue] || this.articleTypes['news'];
      } else {
        super._handleAttributeChange(attrName, newValue);  
      }
    }


    // async attributeChangedCallback(name, oldValue, newValue) {
    //   if (name === 'url' && oldValue !== newValue) {
    //     await this.fetchArticleData(newValue);
    //   }
    // }

    async fetchArticleData(url) {
      try {
        const response = await fetch(`/api/article-metadata?url=${encodeURIComponent(url)}`);
        this.articleData = await response.json();
        this._createElement();
      } catch (error) {
        console.error('Error fetching article data:', error);
      }
    }

    _createElement() {
      if (!this.articleData) return;

      const url = this.getAttribute('url');
      let { title, description, imageUrl, publishDate, domain } = this.articleData;
      if (this.imgUrl) {
        imageUrl = this.imgUrl;
      }

      this.componentElement.innerHTML = `
        <div class="article-card-image">
          <img src="${imageUrl ? imageUrl: ''}" alt="${title}">
        </div>
        <div class="article-card-content">
          <a class="article-card-title" href="${url}" target="_blank">${title}</a>
          <p class="article-card-description">${description}</p>
          <div class="article-card-meta">
            <span class="article-card-domain">${domain}</span>
            <span class="article-card-date">${new Date(publishDate).toLocaleDateString()}</span>
          </div>
        </div>
      `.trim();
    }

    _applyStyle() {
      const style = `
        wc-article-card {
          display: contents;
        }
        .articles-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          padding: 20px;
        }
        .wc-article-card {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          box-shadow: var(--card-shadow);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .wc-article-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }
        .wc-article-card .article-card-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          background: #e5e7eb;
        }
        .wc-article-card .article-card-content {
          padding: 16px;
        }
        .wc-article-card .article-card-title {
          margin: 0 0 8px 0;
          font-size: 1.25rem;
          color: var(--swatch-1);
          text-decoration: none;
        }
        .wc-article-card a.article-card-title:hover {
          text-shadow: var(--swatch-3) 1px 0 10px;
        }
        .wc-article-card .article-card-description {
          margin: 0 0 16px 0;
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--swatch-2);
        }
        .wc-article-card .article-card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--swatch-3);
        }
        .wc-article-card .article-card-source {
          font-weight: 500;
        }
      `.trim();
      this.loadStyle('wc-article-card', style);
    }

    _unWireEvents() {
      super._unWireEvents();
    }
  }

  customElements.define('wc-article-card', WcArticleCard);
}
