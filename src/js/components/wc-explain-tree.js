/**
 * Name: wc-explain-tree
 * Usage:
 *
 *   <wc-explain-tree
 *     data='{"queryPlanner":{"winningPlan":{"stage":"FETCH","inputStage":{"stage":"IXSCAN","indexName":"status_1"}}}}'
 *     height="100%">
 *   </wc-explain-tree>
 *
 * Renders MongoDB explain plan output as a visual stage-by-stage flow diagram.
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-explain-tree')) {

  const STAGE_COLORS = {
    COLLSCAN:           { border: '#ef4444', bg: 'rgba(239,68,68,0.1)',  label: 'danger' },
    IXSCAN:             { border: '#22c55e', bg: 'rgba(34,197,94,0.1)',  label: 'good' },
    FETCH:              { border: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'info' },
    SORT:               { border: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'warn' },
    SORT_KEY_GENERATOR: { border: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'warn' },
    SORT_MERGE:         { border: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'warn' },
    PROJECTION:         { border: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'neutral' },
    PROJECTION_COVERED: { border: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'neutral' },
    PROJECTION_SIMPLE:  { border: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'neutral' },
    LIMIT:              { border: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'neutral' },
    SKIP:               { border: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'neutral' },
    COUNT:              { border: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'neutral' },
    COUNT_SCAN:         { border: '#22c55e', bg: 'rgba(34,197,94,0.1)',  label: 'good' },
    SHARDING_FILTER:    { border: '#a855f7', bg: 'rgba(168,85,247,0.1)', label: 'shard' },
    SHARD_MERGE:        { border: '#a855f7', bg: 'rgba(168,85,247,0.1)', label: 'shard' },
    OR:                 { border: '#f97316', bg: 'rgba(249,115,22,0.1)', label: 'branch' },
    AND_HASH:           { border: '#f97316', bg: 'rgba(249,115,22,0.1)', label: 'branch' },
    AND_SORTED:         { border: '#f97316', bg: 'rgba(249,115,22,0.1)', label: 'branch' },
    SUBPLAN:            { border: '#f97316', bg: 'rgba(249,115,22,0.1)', label: 'branch' },
    EOF:                { border: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'neutral' },
  };

  const DEFAULT_COLOR = { border: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'neutral' };

  // Aggregation pipeline stage colors
  const AGG_COLORS = {
    '$match':    { border: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    '$group':    { border: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    '$sort':     { border: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    '$project':  { border: '#64748b', bg: 'rgba(100,116,139,0.1)' },
    '$lookup':   { border: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    '$unwind':   { border: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    '$limit':    { border: '#64748b', bg: 'rgba(100,116,139,0.1)' },
    '$skip':     { border: '#64748b', bg: 'rgba(100,116,139,0.1)' },
    '$addFields':{ border: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    '$set':      { border: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    '$count':    { border: '#64748b', bg: 'rgba(100,116,139,0.1)' },
    '$out':      { border: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    '$merge':    { border: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    '$bucket':   { border: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    '$facet':    { border: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    '$replaceRoot': { border: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  };

  const AGG_DEFAULT = { border: '#64748b', bg: 'rgba(100,116,139,0.1)' };

  class WcExplainTree extends WcBaseComponent {
    static get is() { return 'wc-explain-tree'; }

    static get observedAttributes() {
      return ['id', 'class', 'data', 'height'];
    }

    constructor() {
      super();
      this._data = null;
      this._expandedStage = null;

      const compEl = this.querySelector('.wc-explain-tree');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-explain-tree');
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      this._parseData();
      this._buildUI();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
    }

    _render() {
      super._render();
    }

    async _handleAttributeChange(attrName, newValue) {
      if (attrName === 'data') {
        this._parseData();
        this._buildUI();
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    // ── Data parsing ──────────────────────────────────────────────────────────

    _parseData() {
      const raw = this.getAttribute('data');
      if (!raw) { this._data = null; return; }
      try {
        this._data = JSON.parse(raw);
      } catch (e) {
        this._data = null;
      }
    }

    _isAggregation() {
      if (!this._data) return false;
      // Aggregation explains have stages array or $cursor
      return !!(this._data.stages || (this._data.queryPlanner && this._data.queryPlanner.winningPlan && this._data.queryPlanner.winningPlan.stage === undefined));
    }

    _getExecutionStages() {
      if (!this._data) return null;
      if (this._data.executionStats && this._data.executionStats.executionStages) {
        return this._data.executionStats.executionStages;
      }
      if (this._data.queryPlanner && this._data.queryPlanner.winningPlan) {
        return this._data.queryPlanner.winningPlan;
      }
      return null;
    }

    _getExecutionStats() {
      if (!this._data) return null;
      return this._data.executionStats || null;
    }

    _getAggStages() {
      if (!this._data) return null;
      if (this._data.stages) return this._data.stages;
      return null;
    }

    // ── UI building ───────────────────────────────────────────────────────────

    _buildUI() {
      this.componentElement.innerHTML = '';
      this._expandedStage = null;

      const height = this.getAttribute('height');
      if (height) this.componentElement.style.height = height;

      if (!this._data) {
        this.componentElement.innerHTML = '<div class="explain-empty">No explain data. Run a query with <code>.explain("executionStats")</code>.</div>';
        return;
      }

      // Summary bar
      this.componentElement.appendChild(this._buildSummary());

      // Stage tree
      const treeArea = document.createElement('div');
      treeArea.classList.add('explain-tree-area');

      const aggStages = this._getAggStages();
      if (aggStages) {
        treeArea.appendChild(this._buildAggPipeline(aggStages));
      } else {
        const root = this._getExecutionStages();
        if (root) {
          treeArea.appendChild(this._buildStageTree(root));
        }
      }

      this.componentElement.appendChild(treeArea);
    }

    // ── Summary bar ───────────────────────────────────────────────────────────

    _buildSummary() {
      const bar = document.createElement('div');
      bar.classList.add('explain-summary');

      const stats = this._getExecutionStats();
      const root = this._getExecutionStages();

      if (!stats && !root) {
        bar.textContent = 'Query plan (no execution stats)';
        bar.classList.add('explain-summary-neutral');
        return bar;
      }

      const nReturned = stats?.nReturned ?? root?.nReturned ?? '?';
      const docsExamined = stats?.totalDocsExamined ?? '?';
      const keysExamined = stats?.totalKeysExamined ?? '?';
      const timeMs = stats?.executionTimeMillis ?? '?';
      const success = stats?.executionSuccess !== false;

      // Detect COLLSCAN
      const hasCollScan = this._hasStage(root, 'COLLSCAN');
      // Find index name
      const indexName = this._findIndexName(root);

      // Determine severity
      let severity = 'good';
      if (hasCollScan) {
        severity = 'danger';
      } else if (typeof docsExamined === 'number' && typeof nReturned === 'number' && docsExamined > nReturned * 2) {
        severity = 'warn';
      }

      bar.classList.add(`explain-summary-${severity}`);

      const icon = severity === 'danger' ? '⚠' : severity === 'warn' ? '⚠' : '✓';
      const parts = [];
      if (hasCollScan) parts.push('Collection scan');
      else if (success) parts.push('Execution successful');
      parts.push(`${this._fmt(nReturned)} returned`);
      if (docsExamined !== '?') parts.push(`${this._fmt(docsExamined)} docs examined`);
      if (keysExamined !== '?' && keysExamined > 0) parts.push(`${this._fmt(keysExamined)} keys examined`);
      parts.push(`${timeMs}ms`);
      if (indexName) parts.push(`Index: ${indexName}`);
      else if (hasCollScan) parts.push('No index used');

      bar.innerHTML = `<span class="explain-summary-icon">${icon}</span> ${parts.join(' &middot; ')}`;

      return bar;
    }

    _hasStage(stage, name) {
      if (!stage) return false;
      if (stage.stage === name) return true;
      if (stage.inputStage) return this._hasStage(stage.inputStage, name);
      if (stage.inputStages) return stage.inputStages.some(s => this._hasStage(s, name));
      return false;
    }

    _findIndexName(stage) {
      if (!stage) return null;
      if (stage.indexName) return stage.indexName;
      if (stage.inputStage) return this._findIndexName(stage.inputStage);
      if (stage.inputStages) {
        for (const s of stage.inputStages) {
          const name = this._findIndexName(s);
          if (name) return name;
        }
      }
      return null;
    }

    _fmt(n) {
      if (typeof n !== 'number') return n;
      return n.toLocaleString();
    }

    // ── Stage tree rendering ──────────────────────────────────────────────────

    _buildStageTree(stage) {
      const container = document.createElement('div');
      container.classList.add('explain-flow');

      // Build bottom-up: input stages first, then this stage
      if (stage.inputStages && stage.inputStages.length > 0) {
        const branches = document.createElement('div');
        branches.classList.add('explain-branches');
        stage.inputStages.forEach(s => {
          const branch = document.createElement('div');
          branch.classList.add('explain-branch');
          branch.appendChild(this._buildStageTree(s));
          branches.appendChild(branch);
        });
        container.appendChild(branches);
        container.appendChild(this._buildConnector());
      } else if (stage.inputStage) {
        container.appendChild(this._buildStageTree(stage.inputStage));
        container.appendChild(this._buildConnector());
      }

      container.appendChild(this._buildStageNode(stage));
      return container;
    }

    _buildStageNode(stage) {
      const colors = STAGE_COLORS[stage.stage] || DEFAULT_COLOR;
      const node = document.createElement('div');
      node.classList.add('explain-node');
      node.style.borderLeftColor = colors.border;
      node.style.backgroundColor = colors.bg;

      // Header
      const header = document.createElement('div');
      header.classList.add('explain-node-header');
      const dot = document.createElement('span');
      dot.classList.add('explain-node-dot');
      dot.style.backgroundColor = colors.border;
      header.appendChild(dot);
      const name = document.createElement('span');
      name.classList.add('explain-node-name');
      name.textContent = stage.stage;
      header.appendChild(name);
      node.appendChild(header);

      // Metrics
      const metrics = document.createElement('div');
      metrics.classList.add('explain-node-metrics');

      if (stage.nReturned !== undefined) this._addMetric(metrics, 'Returned', this._fmt(stage.nReturned));
      if (stage.docsExamined !== undefined) this._addMetric(metrics, 'Docs examined', this._fmt(stage.docsExamined));
      if (stage.keysExamined !== undefined) this._addMetric(metrics, 'Keys examined', this._fmt(stage.keysExamined));
      if (stage.executionTimeMillisEstimate !== undefined) this._addMetric(metrics, 'Time', stage.executionTimeMillisEstimate + 'ms');
      if (stage.indexName) this._addMetric(metrics, 'Index', stage.indexName);
      if (stage.keyPattern) this._addMetric(metrics, 'Key pattern', JSON.stringify(stage.keyPattern));
      if (stage.direction) this._addMetric(metrics, 'Direction', stage.direction);
      if (stage.sortPattern) this._addMetric(metrics, 'Sort', JSON.stringify(stage.sortPattern));
      if (stage.filter) this._addMetric(metrics, 'Filter', JSON.stringify(stage.filter));
      if (stage.isMultiKey !== undefined) this._addMetric(metrics, 'Multi-key', String(stage.isMultiKey));

      node.appendChild(metrics);

      // Click to expand raw JSON
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleDetail(node, stage);
      });
      node.title = 'Click to view raw JSON';

      return node;
    }

    _addMetric(container, label, value) {
      const row = document.createElement('div');
      row.classList.add('explain-metric');
      row.innerHTML = `<span class="explain-metric-label">${label}:</span> <span class="explain-metric-value">${value}</span>`;
      container.appendChild(row);
    }

    _buildConnector() {
      const conn = document.createElement('div');
      conn.classList.add('explain-connector');
      conn.innerHTML = '<span class="explain-arrow">▲</span>';
      return conn;
    }

    // ── Aggregation pipeline ──────────────────────────────────────────────────

    _buildAggPipeline(stages) {
      const container = document.createElement('div');
      container.classList.add('explain-flow');

      stages.forEach((stageObj, idx) => {
        if (idx > 0) {
          container.appendChild(this._buildConnector());
        }

        // Each agg stage is { "$match": { ... } } or { "$cursor": { ... } }
        const keys = Object.keys(stageObj);
        const stageName = keys[0] || 'unknown';
        const stageData = stageObj[stageName] || {};

        const colors = AGG_COLORS[stageName] || AGG_DEFAULT;
        const node = document.createElement('div');
        node.classList.add('explain-node');
        node.style.borderLeftColor = colors.border;
        node.style.backgroundColor = colors.bg;

        const header = document.createElement('div');
        header.classList.add('explain-node-header');
        const dot = document.createElement('span');
        dot.classList.add('explain-node-dot');
        dot.style.backgroundColor = colors.border;
        header.appendChild(dot);
        const name = document.createElement('span');
        name.classList.add('explain-node-name');
        name.textContent = stageName;
        header.appendChild(name);
        node.appendChild(header);

        const metrics = document.createElement('div');
        metrics.classList.add('explain-node-metrics');

        // Show key info based on stage type
        if (stageName === '$cursor' && stageData.queryPlanner) {
          const wp = stageData.queryPlanner.winningPlan;
          if (wp) this._addMetric(metrics, 'Plan', wp.stage || 'unknown');
          if (stageData.executionStats) {
            this._addMetric(metrics, 'Returned', this._fmt(stageData.executionStats.nReturned));
            this._addMetric(metrics, 'Time', stageData.executionStats.executionTimeMillis + 'ms');
          }
        } else if (typeof stageData === 'object' && stageData !== null) {
          // Show first few fields as metrics
          const entries = Object.entries(stageData).slice(0, 4);
          entries.forEach(([k, v]) => {
            const display = typeof v === 'object' ? JSON.stringify(v) : String(v);
            this._addMetric(metrics, k, display.length > 50 ? display.substring(0, 47) + '...' : display);
          });
        }

        node.appendChild(metrics);

        node.addEventListener('click', (e) => {
          e.stopPropagation();
          this._toggleDetail(node, stageObj);
        });
        node.title = 'Click to view raw JSON';

        container.appendChild(node);
      });

      return container;
    }

    // ── Detail panel ──────────────────────────────────────────────────────────

    _toggleDetail(node, stageData) {
      const existing = node.querySelector('.explain-detail');
      if (existing) {
        existing.classList.add('explain-detail-closing');
        existing.addEventListener('animationend', () => existing.remove(), { once: true });
        return;
      }

      // Close any other open detail
      this.componentElement.querySelectorAll('.explain-detail').forEach(d => d.remove());

      const detail = document.createElement('div');
      detail.classList.add('explain-detail');

      // Remove inputStage/inputStages from display to reduce noise
      const display = { ...stageData };
      delete display.inputStage;
      delete display.inputStages;

      const pre = document.createElement('pre');
      pre.classList.add('explain-detail-json');
      pre.textContent = JSON.stringify(display, null, 2);
      detail.appendChild(pre);

      node.appendChild(detail);
    }

    // ── Styles ────────────────────────────────────────────────────────────────

    _applyStyle() {
      const style = `
        .wc-explain-tree {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          font-size: 0.75rem;
        }

        /* Summary bar */
        .explain-summary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          font-weight: 500;
          flex-shrink: 0;
        }
        .explain-summary-icon {
          font-size: 1rem;
        }
        .explain-summary-good {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }
        .explain-summary-warn {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }
        .explain-summary-danger {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        .explain-summary-neutral {
          background: var(--card-bg-color, #1e1e2e);
          border: 1px solid var(--card-border-color, #444);
          color: var(--text-color, #ccc);
        }

        /* Tree area */
        .explain-tree-area {
          flex: 1;
          overflow: auto;
          padding: 0.5rem;
        }

        /* Flow container */
        .explain-flow {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        /* Branches (for $or / inputStages) */
        .explain-branches {
          display: flex;
          flex-direction: row;
          gap: 1rem;
          justify-content: center;
        }
        .explain-branch {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Connector line + arrow */
        .explain-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.375rem 0;
          color: var(--text-6, #666);
          font-size: 0.625rem;
          line-height: 1;
        }
        .explain-arrow {
          opacity: 0.5;
        }

        /* Stage node */
        .explain-node {
          width: 260px;
          border-left: 4px solid var(--card-border-color, #444);
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          transition: box-shadow 0.15s, transform 0.15s;
          position: relative;
          background: var(--card-bg-color, #1e1e2e);
          border-top: 1px solid var(--card-border-color, #333);
          border-right: 1px solid var(--card-border-color, #333);
          border-bottom: 1px solid var(--card-border-color, #333);
        }
        .explain-node:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transform: translateY(-1px);
        }

        /* Node header */
        .explain-node-header {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-bottom: 0.25rem;
        }
        .explain-node-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .explain-node-name {
          font-weight: 700;
          font-size: 0.8125rem;
          color: var(--text-color, #e0e0e0);
          letter-spacing: 0.02em;
        }

        /* Metrics */
        .explain-node-metrics {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .explain-metric {
          display: flex;
          gap: 0.375rem;
          line-height: 1.4;
        }
        .explain-metric-label {
          color: var(--text-6, #888);
          flex-shrink: 0;
        }
        .explain-metric-value {
          color: var(--text-color, #ccc);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Detail panel */
        .explain-detail {
          margin-top: 0.5rem;
          border-top: 1px solid var(--card-border-color, #444);
          padding-top: 0.5rem;
          animation: explainDetailOpen 0.2s ease-out;
        }
        .explain-detail-closing {
          animation: explainDetailClose 0.15s ease-in forwards;
        }
        @keyframes explainDetailOpen {
          from { max-height: 0; opacity: 0; }
          to { max-height: 300px; opacity: 1; }
        }
        @keyframes explainDetailClose {
          from { max-height: 300px; opacity: 1; }
          to { max-height: 0; opacity: 0; }
        }
        .explain-detail-json {
          font-size: 0.625rem;
          font-family: monospace;
          color: var(--text-color, #ccc);
          background: rgba(0,0,0,0.2);
          border-radius: 4px;
          padding: 0.5rem;
          max-height: 250px;
          overflow: auto;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }

        /* Empty state */
        .explain-empty {
          padding: 2rem;
          text-align: center;
          color: var(--text-6, #888);
          font-size: 0.875rem;
        }
        .explain-empty code {
          background: var(--surface-bg-color, #2a2a3e);
          padding: 0.125rem 0.375rem;
          border-radius: 3px;
          font-size: 0.8125rem;
        }
      `.trim();
      this.loadStyle('wc-explain-tree-style', style);
    }
  }

  customElements.define('wc-explain-tree', WcExplainTree);
}
