/**
 * Name: wc-cron-picker
 * Usage:
 *   <wc-cron-picker name="schedule" lbl-label="Schedule" value="0 9 * * 1"></wc-cron-picker>
 *
 * Description:
 *   Visual schedule picker that generates standard 5-field cron expressions.
 *   Provides dropdown-based frequency selection with human-readable description.
 *   Form-associated — participates in form submission with the cron expression as value.
 *
 * Events:
 *   - wccronchange — dispatched when the cron expression changes
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

if (!customElements.get('wc-cron-picker')) {
  class WcCronPicker extends WcBaseFormComponent {
    static get observedAttributes() {
      return ['id', 'class', 'name', 'value', 'lbl-label', 'lbl-class', 'disabled', 'required'];
    }

    static get is() {
      return 'wc-cron-picker';
    }

    static DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    static DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    static MINUTE_INTERVALS = [2, 3, 5, 10, 15, 20, 30];
    static HOUR_INTERVALS = [2, 3, 4, 6, 8, 12];

    constructor() {
      super();
      this._frequency = 'week';
      this._minute = 0;
      this._hour = 9;
      this._dayOfMonth = 1;
      this._dayOfWeek = 1;
      this._minuteInterval = 5;
      this._hourInterval = 2;
      this._customCron = '';

      const compEl = this.querySelector('.wc-cron-picker');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-cron-picker');
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    get value() {
      return this._value;
    }

    set value(newValue) {
      const changed = this._value !== newValue;
      this._value = newValue;
      this._internals.setFormValue(newValue);
      if (this.formElement) this.formElement.value = newValue;
      // If set programmatically with a cron string, parse and update UI
      if (changed && newValue && this._freqSelect) {
        this._parseCron(newValue);
        this._syncSelectsFromState();
        this._updateVisibility();
        this._updateDescription();
      }
    }

    _render() {
      super._render();
      const innerEl = this.querySelector('.wc-cron-picker > .cron-controls');
      if (innerEl) return;

      const initialValue = this.getAttribute('value');
      if (initialValue) {
        this._parseCron(initialValue);
      }

      this._createInnerElement();
      this._updateCron();
    }

    _createInnerElement() {
      this.componentElement.innerHTML = '';

      // Hidden input FIRST — so base class querySelector('input, select, textarea') finds it
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = this.getAttribute('name') || '';
      this.componentElement.appendChild(hiddenInput);

      // Label
      const lblLabel = this.getAttribute('lbl-label');
      if (lblLabel) {
        const label = document.createElement('label');
        label.classList.add('cron-label');
        const lblClass = this.getAttribute('lbl-class');
        if (lblClass) label.className = lblClass;
        label.textContent = lblLabel;
        this.componentElement.appendChild(label);
      }

      // Controls row
      const row = document.createElement('div');
      row.classList.add('cron-controls');

      // Frequency dropdown
      const freqWrap = this._createField('Every');
      this._freqSelect = this._createSelect('cron-frequency', [
        { value: 'minute', label: 'Minute' },
        { value: 'n-minutes', label: 'N Minutes' },
        { value: 'hour', label: 'Hour' },
        { value: 'n-hours', label: 'N Hours' },
        { value: 'day', label: 'Day' },
        { value: 'weekday', label: 'Weekday (Mon\u2013Fri)' },
        { value: 'weekend', label: 'Weekend (Sat\u2013Sun)' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'custom', label: 'Custom' },
      ], this._frequency);
      freqWrap.appendChild(this._freqSelect);
      row.appendChild(freqWrap);

      // Minute interval (for n-minutes)
      this._minIntervalWrap = this._createField('every');
      this._minIntervalSelect = this._createSelect('cron-min-interval',
        WcCronPicker.MINUTE_INTERVALS.map(n => ({ value: String(n), label: String(n) })),
        String(this._minuteInterval)
      );
      this._minIntervalWrap.appendChild(this._minIntervalSelect);
      const minSuffix = document.createElement('span');
      minSuffix.classList.add('cron-field-label');
      minSuffix.textContent = 'minutes';
      this._minIntervalWrap.appendChild(minSuffix);
      row.appendChild(this._minIntervalWrap);

      // Hour interval (for n-hours)
      this._hourIntervalWrap = this._createField('every');
      this._hourIntervalSelect = this._createSelect('cron-hour-interval',
        WcCronPicker.HOUR_INTERVALS.map(n => ({ value: String(n), label: String(n) })),
        String(this._hourInterval)
      );
      this._hourIntervalWrap.appendChild(this._hourIntervalSelect);
      const hourSuffix = document.createElement('span');
      hourSuffix.classList.add('cron-field-label');
      hourSuffix.textContent = 'hours';
      this._hourIntervalWrap.appendChild(hourSuffix);
      row.appendChild(this._hourIntervalWrap);

      // Day of week (for weekly)
      this._dowWrap = this._createField('on');
      this._dowSelect = this._createSelect('cron-dow',
        WcCronPicker.DAYS.map((d, i) => ({ value: String(i), label: d })),
        String(this._dayOfWeek)
      );
      this._dowWrap.appendChild(this._dowSelect);
      row.appendChild(this._dowWrap);

      // Day of month (for monthly)
      this._domWrap = this._createField('on day');
      this._domSelect = this._createSelect('cron-dom',
        Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
        String(this._dayOfMonth)
      );
      this._domWrap.appendChild(this._domSelect);
      row.appendChild(this._domWrap);

      // Time fields (hour:minute)
      this._timeWrap = this._createField('at');
      this._hourSelect = this._createSelect('cron-hour',
        Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: String(i).padStart(2, '0') })),
        String(this._hour)
      );
      this._timeWrap.appendChild(this._hourSelect);
      const colon = document.createElement('span');
      colon.classList.add('cron-colon');
      colon.textContent = ':';
      this._timeWrap.appendChild(colon);
      this._minuteSelect = this._createSelect('cron-minute',
        Array.from({ length: 12 }, (_, i) => ({ value: String(i * 5), label: String(i * 5).padStart(2, '0') })),
        String(this._minute)
      );
      this._timeWrap.appendChild(this._minuteSelect);
      row.appendChild(this._timeWrap);

      // Minute-only field (for hourly / n-hours)
      this._minuteOnlyWrap = this._createField('at minute');
      this._minuteOnlySelect = this._createSelect('cron-minute-only',
        Array.from({ length: 12 }, (_, i) => ({ value: String(i * 5), label: ':' + String(i * 5).padStart(2, '0') })),
        String(this._minute)
      );
      this._minuteOnlyWrap.appendChild(this._minuteOnlySelect);
      row.appendChild(this._minuteOnlyWrap);

      // Custom cron input
      this._customWrap = document.createElement('div');
      this._customWrap.classList.add('cron-field', 'cron-custom');
      this._customInput = document.createElement('input');
      this._customInput.type = 'text';
      this._customInput.classList.add('cron-custom-input');
      this._customInput.placeholder = '* * * * *';
      this._customInput.value = this._customCron || this._buildCron();
      this._customWrap.appendChild(this._customInput);
      row.appendChild(this._customWrap);

      this.componentElement.appendChild(row);

      // Description
      this._descEl = document.createElement('div');
      this._descEl.classList.add('cron-description');
      this.componentElement.appendChild(this._descEl);

      // Cron expression display
      this._cronDisplayEl = document.createElement('div');
      this._cronDisplayEl.classList.add('cron-expression');
      this.componentElement.appendChild(this._cronDisplayEl);

      // Syntax reference
      const refEl = document.createElement('details');
      refEl.classList.add('cron-reference');
      refEl.innerHTML = `<summary>Cron Syntax Reference</summary>
<pre class="cron-reference-table">
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 minute (0\u201359)
\u2502 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 hour (0\u201323)
\u2502 \u2502 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 day of month (1\u201331)
\u2502 \u2502 \u2502 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500 month (1\u201312)
\u2502 \u2502 \u2502 \u2502 \u250c\u2500\u2500\u2500\u2500\u2500 day of week (0\u20137, Sun=0 or 7)
\u2502 \u2502 \u2502 \u2502 \u2502
* * * * *

*   = any value        ,  = list (1,3,5)
-   = range (9-17)     /  = step (*/5 = every 5)

Examples:
  * * * * *       Every minute
  */15 * * * *    Every 15 minutes
  0 * * * *       Every hour
  0 */2 * * *     Every 2 hours
  0 9 * * *       Daily at 9:00 AM
  0 9 * * 1-5     Weekdays at 9:00 AM
  0 9 * * 0,6     Weekends at 9:00 AM
  0 9 * * 1       Every Monday at 9:00 AM
  0 9 1 * *       1st of month at 9:00 AM</pre>`;
      this.componentElement.appendChild(refEl);

      this._updateVisibility();
      this._updateDescription();
      this._wireCronEvents();
    }

    _createField(labelText) {
      const wrap = document.createElement('div');
      wrap.classList.add('cron-field');
      if (labelText) {
        const label = document.createElement('span');
        label.classList.add('cron-field-label');
        label.textContent = labelText;
        wrap.appendChild(label);
      }
      return wrap;
    }

    _createSelect(className, options, selectedValue) {
      const select = document.createElement('select');
      select.classList.add(className);
      for (const opt of options) {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (opt.value === selectedValue) option.selected = true;
        select.appendChild(option);
      }
      return select;
    }

    _updateVisibility() {
      const f = this._frequency;
      this._minIntervalWrap.style.display = f === 'n-minutes' ? '' : 'none';
      this._hourIntervalWrap.style.display = f === 'n-hours' ? '' : 'none';
      this._dowWrap.style.display = f === 'week' ? '' : 'none';
      this._domWrap.style.display = f === 'month' ? '' : 'none';
      this._timeWrap.style.display = ['day', 'week', 'month', 'weekday', 'weekend'].includes(f) ? '' : 'none';
      this._minuteOnlyWrap.style.display = (f === 'hour' || f === 'n-hours') ? '' : 'none';
      this._customWrap.style.display = f === 'custom' ? '' : 'none';
    }

    _buildCron() {
      switch (this._frequency) {
        case 'minute':
          return '* * * * *';
        case 'n-minutes':
          return `*/${this._minuteInterval} * * * *`;
        case 'hour':
          return `${this._minute} * * * *`;
        case 'n-hours':
          return `${this._minute} */${this._hourInterval} * * *`;
        case 'day':
          return `${this._minute} ${this._hour} * * *`;
        case 'weekday':
          return `${this._minute} ${this._hour} * * 1-5`;
        case 'weekend':
          return `${this._minute} ${this._hour} * * 0,6`;
        case 'week':
          return `${this._minute} ${this._hour} * * ${this._dayOfWeek}`;
        case 'month':
          return `${this._minute} ${this._hour} ${this._dayOfMonth} * *`;
        case 'custom':
          return this._customCron || '* * * * *';
        default:
          return '0 9 * * *';
      }
    }

    _parseCron(cron) {
      if (!cron || typeof cron !== 'string') return;
      const parts = cron.trim().split(/\s+/);
      if (parts.length !== 5) {
        this._frequency = 'custom';
        this._customCron = cron;
        return;
      }

      const [minute, hour, dom, , dow] = parts;

      // Every minute
      if (minute === '*' && hour === '*' && dom === '*' && dow === '*') {
        this._frequency = 'minute';
        return;
      }

      // Every N minutes
      if (minute.startsWith('*/') && hour === '*' && dom === '*' && dow === '*') {
        const n = parseInt(minute.substring(2));
        if (WcCronPicker.MINUTE_INTERVALS.includes(n)) {
          this._frequency = 'n-minutes';
          this._minuteInterval = n;
          return;
        }
      }

      // Every N hours
      if (hour.startsWith('*/') && dom === '*' && dow === '*') {
        const n = parseInt(hour.substring(2));
        if (WcCronPicker.HOUR_INTERVALS.includes(n)) {
          this._frequency = 'n-hours';
          this._hourInterval = n;
          this._minute = parseInt(minute) || 0;
          return;
        }
      }

      // Weekend
      if (dow === '0,6' && dom === '*' && hour !== '*') {
        this._frequency = 'weekend';
        this._minute = parseInt(minute) || 0;
        this._hour = parseInt(hour) || 9;
        return;
      }

      // Weekday
      if (dow === '1-5' && dom === '*' && hour !== '*') {
        this._frequency = 'weekday';
        this._minute = parseInt(minute) || 0;
        this._hour = parseInt(hour) || 9;
        return;
      }

      // Specific day of week
      if (dow !== '*' && dow !== '1-5' && dow !== '0,6' && dom === '*' && hour !== '*') {
        this._frequency = 'week';
        this._dayOfWeek = parseInt(dow) || 0;
        this._minute = parseInt(minute) || 0;
        this._hour = parseInt(hour) || 9;
        return;
      }

      // Monthly
      if (dom !== '*' && hour !== '*' && dow === '*') {
        this._frequency = 'month';
        this._dayOfMonth = parseInt(dom) || 1;
        this._minute = parseInt(minute) || 0;
        this._hour = parseInt(hour) || 9;
        return;
      }

      // Daily
      if (hour !== '*' && dom === '*' && dow === '*') {
        this._frequency = 'day';
        this._minute = parseInt(minute) || 0;
        this._hour = parseInt(hour) || 9;
        return;
      }

      // Hourly
      if (hour === '*' && dom === '*' && dow === '*' && !minute.includes('/')) {
        this._frequency = 'hour';
        this._minute = parseInt(minute) || 0;
        return;
      }

      // Fallback
      this._frequency = 'custom';
      this._customCron = cron;
    }

    _updateCron() {
      const cron = this._buildCron();
      this.value = cron;
    }

    _updateDescription() {
      if (!this._descEl) return;
      const cron = this._buildCron();
      this._descEl.textContent = this._describe(cron);
      if (this._cronDisplayEl) {
        this._cronDisplayEl.textContent = cron;
      }
    }

    _describe(cron) {
      const parts = cron.trim().split(/\s+/);
      if (parts.length !== 5) return cron;

      const [minute, hour, dom, , dow] = parts;
      const pad = (n) => String(n).padStart(2, '0');

      const formatTime = (h, m) => {
        const hr = parseInt(h);
        const mn = parseInt(m);
        const ampm = hr >= 12 ? 'PM' : 'AM';
        const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
        return `${hr12}:${pad(mn)} ${ampm}`;
      };

      if (minute === '*' && hour === '*' && dom === '*' && dow === '*') {
        return 'Every minute';
      }
      if (minute.startsWith('*/') && hour === '*') {
        return `Every ${minute.substring(2)} minutes`;
      }
      if (hour.startsWith('*/') && dom === '*' && dow === '*') {
        return `Every ${hour.substring(2)} hours at :${pad(parseInt(minute) || 0)}`;
      }
      if (dow === '0,6' && dom === '*' && hour !== '*') {
        return `Every weekend (Sat\u2013Sun) at ${formatTime(hour, minute)}`;
      }
      if (dow === '1-5' && dom === '*' && hour !== '*') {
        return `Every weekday (Mon\u2013Fri) at ${formatTime(hour, minute)}`;
      }
      if (dow !== '*' && dow !== '1-5' && dow !== '0,6' && dom === '*' && hour !== '*') {
        const dayName = WcCronPicker.DAYS[parseInt(dow)] || dow;
        return `Every ${dayName} at ${formatTime(hour, minute)}`;
      }
      if (dom !== '*' && hour !== '*' && dow === '*') {
        const d = parseInt(dom);
        const suffix = d === 1 || d === 21 || d === 31 ? 'st' : d === 2 || d === 22 ? 'nd' : d === 3 || d === 23 ? 'rd' : 'th';
        return `${d}${suffix} of every month at ${formatTime(hour, minute)}`;
      }
      if (hour !== '*' && dom === '*' && dow === '*') {
        return `Every day at ${formatTime(hour, minute)}`;
      }
      if (hour === '*' && dom === '*' && dow === '*') {
        return `Every hour at :${pad(parseInt(minute) || 0)}`;
      }
      return cron;
    }

    _syncSelectsFromState() {
      if (this._freqSelect) this._freqSelect.value = this._frequency;
      if (this._minIntervalSelect) this._minIntervalSelect.value = String(this._minuteInterval);
      if (this._hourIntervalSelect) this._hourIntervalSelect.value = String(this._hourInterval);
      if (this._dowSelect) this._dowSelect.value = String(this._dayOfWeek);
      if (this._domSelect) this._domSelect.value = String(this._dayOfMonth);
      if (this._hourSelect) this._hourSelect.value = String(this._hour);
      if (this._minuteSelect) this._minuteSelect.value = String(this._minute);
      if (this._minuteOnlySelect) this._minuteOnlySelect.value = String(this._minute);
      if (this._customInput) this._customInput.value = this._customCron || this._buildCron();
    }

    _onCronChanged() {
      this._updateCron();
      this._updateDescription();
      this._emitEvent('wccronchange', null, {
        bubbles: true,
        composed: true,
        detail: { value: this._value },
      });
    }

    _handleAttributeChange(attrName, newValue) {
      if (attrName === 'value') {
        this._parseCron(newValue);
        this._syncSelectsFromState();
        this._updateVisibility();
        this._updateCron();
        this._updateDescription();
      } else if (attrName === 'name') {
        if (this.formElement) this.formElement.name = newValue || '';
      } else if (attrName === 'lbl-label') {
        const label = this.componentElement?.querySelector('.cron-label');
        if (label) label.textContent = newValue || '';
      } else if (attrName === 'disabled') {
        const elts = this.componentElement?.querySelectorAll('select, .cron-custom-input');
        elts?.forEach(el => {
          if (newValue !== null) el.setAttribute('disabled', '');
          else el.removeAttribute('disabled');
        });
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _wireCronEvents() {
      this._handleFreqChange = () => {
        this._frequency = this._freqSelect.value;
        this._updateVisibility();
        if (this._frequency === 'custom') {
          this._customCron = this._customInput.value || this._buildCron();
          this._customInput.value = this._customCron;
        }
        this._onCronChanged();
      };

      this._handleMinIntervalChange = () => {
        this._minuteInterval = parseInt(this._minIntervalSelect.value);
        this._onCronChanged();
      };

      this._handleHourIntervalChange = () => {
        this._hourInterval = parseInt(this._hourIntervalSelect.value);
        this._onCronChanged();
      };

      this._handleDowChange = () => {
        this._dayOfWeek = parseInt(this._dowSelect.value);
        this._onCronChanged();
      };

      this._handleDomChange = () => {
        this._dayOfMonth = parseInt(this._domSelect.value);
        this._onCronChanged();
      };

      this._handleHourChange = () => {
        this._hour = parseInt(this._hourSelect.value);
        this._onCronChanged();
      };

      this._handleMinuteChange = () => {
        this._minute = parseInt(this._minuteSelect.value);
        if (this._minuteOnlySelect) this._minuteOnlySelect.value = String(this._minute);
        this._onCronChanged();
      };

      this._handleMinuteOnlyChange = () => {
        this._minute = parseInt(this._minuteOnlySelect.value);
        if (this._minuteSelect) this._minuteSelect.value = String(this._minute);
        this._onCronChanged();
      };

      this._handleCustomInput = () => {
        this._customCron = this._customInput.value;
        this._onCronChanged();
      };

      this._freqSelect.addEventListener('change', this._handleFreqChange);
      this._minIntervalSelect.addEventListener('change', this._handleMinIntervalChange);
      this._hourIntervalSelect.addEventListener('change', this._handleHourIntervalChange);
      this._dowSelect.addEventListener('change', this._handleDowChange);
      this._domSelect.addEventListener('change', this._handleDomChange);
      this._hourSelect.addEventListener('change', this._handleHourChange);
      this._minuteSelect.addEventListener('change', this._handleMinuteChange);
      this._minuteOnlySelect.addEventListener('change', this._handleMinuteOnlyChange);
      this._customInput.addEventListener('input', this._handleCustomInput);
    }

    _unWireEvents() {
      super._unWireEvents();
      if (this._freqSelect) this._freqSelect.removeEventListener('change', this._handleFreqChange);
      if (this._minIntervalSelect) this._minIntervalSelect.removeEventListener('change', this._handleMinIntervalChange);
      if (this._hourIntervalSelect) this._hourIntervalSelect.removeEventListener('change', this._handleHourIntervalChange);
      if (this._dowSelect) this._dowSelect.removeEventListener('change', this._handleDowChange);
      if (this._domSelect) this._domSelect.removeEventListener('change', this._handleDomChange);
      if (this._hourSelect) this._hourSelect.removeEventListener('change', this._handleHourChange);
      if (this._minuteSelect) this._minuteSelect.removeEventListener('change', this._handleMinuteChange);
      if (this._minuteOnlySelect) this._minuteOnlySelect.removeEventListener('change', this._handleMinuteOnlyChange);
      if (this._customInput) this._customInput.removeEventListener('input', this._handleCustomInput);
    }

    _applyStyle() {
      const style = `
        wc-cron-picker {
          display: contents;
        }
        .wc-cron-picker {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .cron-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-2, #ccc);
        }
        .wc-cron-picker:has(:required) > .cron-label::after {
          content: ' *';
          font-weight: bold;
          color: var(--error-color, #e53935);
        }
        .cron-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .cron-field {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .cron-field-label {
          font-size: 0.75rem;
          color: var(--text-4, #999);
          white-space: nowrap;
        }
        .cron-colon {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-2, #ccc);
        }
        .wc-cron-picker select:not(.cron-frequency) {
          padding: 0.25rem 0.375rem;
          font-size: 0.8125rem;
          background: var(--surface-3, #2a2a2a);
          color: var(--text-1, #eee);
          border: 1px solid var(--surface-5, #444);
          border-radius: 0.25rem;
          outline: none;
          cursor: pointer;
        }
        .wc-cron-picker select.cron-frequency {
          padding: 0.25rem 0.375rem;
          font-size: 0.8125rem;
          background: var(--surface-3, #2a2a2a);
          color: var(--text-1, #eee);
          border: 1px solid var(--surface-5, #444);
          border-radius: 0.25rem;
          outline: none;
          cursor: pointer;
        }
        .wc-cron-picker select:focus {
          border-color: var(--primary-color, #3b97e3);
        }
        .wc-cron-picker select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cron-custom-input {
          padding: 0.25rem 0.5rem;
          font-size: 0.8125rem;
          font-family: monospace;
          background: var(--surface-3, #2a2a2a);
          color: var(--text-1, #eee);
          border: 1px solid var(--surface-5, #444);
          border-radius: 0.25rem;
          outline: none;
          width: 10rem;
        }
        .cron-custom-input:focus {
          border-color: var(--primary-color, #3b97e3);
        }
        .cron-custom-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cron-description {
          font-size: 0.75rem;
          color: var(--text-4, #999);
          font-style: italic;
        }
        .cron-expression {
          font-size: 0.75rem;
          font-family: monospace;
          color: var(--primary-color, #3b97e3);
          letter-spacing: 0.05em;
        }
        .cron-reference {
          font-size: 0.6875rem;
          color: var(--text-6, #666);
          margin-top: 0.25rem;
        }
        .cron-reference summary {
          cursor: pointer;
          user-select: none;
          color: var(--text-4, #999);
        }
        .cron-reference summary:hover {
          color: var(--text-2, #ccc);
        }
        .cron-reference-table {
          margin: 0.375rem 0 0 0;
          padding: 0.5rem;
          background: var(--surface-2, #1e1e1e);
          border: 1px solid var(--surface-5, #444);
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.6875rem;
          line-height: 1.4;
          white-space: pre;
          overflow-x: auto;
        }
      `.trim();
      this.loadStyle('wc-cron-picker-style', style);
    }
  }

  customElements.define('wc-cron-picker', WcCronPicker);
}
