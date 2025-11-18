/**
 * 
 *  Name: wc-input
 *  Usage:
 *    <wc-input name="gender" lbl-label="Gender" value="male"
 *      options='[{"key": "Female", "value": "female"}, {"key": "Male", "value": "male"}]'>
 *    </wc-input>
 *    <wc-input name="marital_status" lbl-label="Marital Status" value="married">
 *      <option value="single">Single</option>
 *      <option value="married">Married</option>
 *      <option value="divorced">Divorced</option>
 *      <option value="widowed">Widowed</option>
 *    </wc-input>
 * 
 *    <wc-input name="is_active"
 *      class="col"
 *      lbl-label="Is Active?"
 *      type="checkbox"
 *      checked>
 *    </wc-input>
 *    <wc-input name="is_enrolled"
 *      class="col"
 *      lbl-label="Is Enrolled?"
 *      type="checkbox">
 *    </wc-input>
 *    <wc-input name="is_eligible"
 *      class="col"
 *      lbl-label="Is Eligible?"
 *      type="checkbox"
 *      toggle-switch>
 *    </wc-input>
 * 
 * 
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

class WcInput extends WcBaseFormComponent {
  static get observedAttributes() {
    return [
      'name', 'id', 'class', 'type', 'value', 'placeholder',
      'lbl-label', 'lbl-class', 'radio-group-class',
      'checked', 'disabled', 'readonly', 'required', 'autocomplete',
      'autofocus', 'min', 'max', 'minlength', 'maxlength', 'pattern',
      'step', 'multiple', 'novalidate', 'elt-class', 'toggle-swtich',
      'list', 'auto-flex',
      'onchange', 'oninput', 'onblur', 'onfocus', 'onkeydown', 'onkeyup',
      'onkeypress', 'onclick',
      'tooltip', 'tooltip-position'
    ];
  }
  static get icons() {
    return [
      {
        name: 'email-stroke',
        icon: `
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="0.75" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"></path>
          </svg>
        `.trim()
      },
      {
        name: 'email-fill',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="CurrentColor">
            <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"/>
          </svg>
        `.trim()
      },
      {
        name: 'tel-stroke',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="0.75" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"></path>
          </svg>
        `.trim()
      },
      {
        name: 'tel-fill',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
            <path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z"/>
          </svg>
        `.trim()
      },
      {
        name: 'currency-circle',
        icon: `
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="0.75" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        `.trim()
      },
      {
        name: 'currency-symbol',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor">
            <path d="M160 0c17.7 0 32 14.3 32 32l0 35.7c1.6 .2 3.1 .4 4.7 .7c.4 .1 .7 .1 1.1 .2l48 8.8c17.4 3.2 28.9 19.9 25.7 37.2s-19.9 28.9-37.2 25.7l-47.5-8.7c-31.3-4.6-58.9-1.5-78.3 6.2s-27.2 18.3-29 28.1c-2 10.7-.5 16.7 1.2 20.4c1.8 3.9 5.5 8.3 12.8 13.2c16.3 10.7 41.3 17.7 73.7 26.3l2.9 .8c28.6 7.6 63.6 16.8 89.6 33.8c14.2 9.3 27.6 21.9 35.9 39.5c8.5 17.9 10.3 37.9 6.4 59.2c-6.9 38-33.1 63.4-65.6 76.7c-13.7 5.6-28.6 9.2-44.4 11l0 33.4c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-34.9c-.4-.1-.9-.1-1.3-.2l-.2 0s0 0 0 0c-24.4-3.8-64.5-14.3-91.5-26.3c-16.1-7.2-23.4-26.1-16.2-42.2s26.1-23.4 42.2-16.2c20.9 9.3 55.3 18.5 75.2 21.6c31.9 4.7 58.2 2 76-5.3c16.9-6.9 24.6-16.9 26.8-28.9c1.9-10.6 .4-16.7-1.3-20.4c-1.9-4-5.6-8.4-13-13.3c-16.4-10.7-41.5-17.7-74-26.3l-2.8-.7s0 0 0 0C119.4 279.3 84.4 270 58.4 253c-14.2-9.3-27.5-22-35.8-39.6c-8.4-17.9-10.1-37.9-6.1-59.2C23.7 116 52.3 91.2 84.8 78.3c13.3-5.3 27.9-8.9 43.2-11L128 32c0-17.7 14.3-32 32-32z"/>
          </svg>
        `.trim()
      },
      {
        name: 'eye',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor">
            <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"/>
          </svg>
        `.trim()
      },
      {
        name: 'eye-slash',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="currentColor">
            <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z"/>
          </svg>
        `.trim()
      },
      {
        name: 'lock',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor">
            <path d="M144 144l0 48 160 0 0-48c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192l0-48C80 64.5 144.5 0 224 0s144 64.5 144 144l0 48 16 0c35.3 0 64 28.7 64 64l0 192c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 256c0-35.3 28.7-64 64-64l16 0z"/>
          </svg>
        `.trim()
      },
      {
        name: 'lock-open',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor">
            <path d="M352 144c0-44.2 35.8-80 80-80s80 35.8 80 80l0 48c0 17.7 14.3 32 32 32s32-14.3 32-32l0-48C576 64.5 511.5 0 432 0S288 64.5 288 144l0 48L64 192c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64l-32 0 0-48z"/>
          </svg>
        `.trim()
      },
      {
        name: 'magnifying-glass',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
          </svg>
        `.trim()
      },
      {
        name: 'auto',
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <path d="M199.2 181.4L173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160C215.8 160 203.7 168.6 199.2 181.4zM103.6 260.8L138.8 160.3C152.3 121.8 188.6 96 229.4 96L410.6 96C451.4 96 487.7 121.8 501.2 160.3L536.4 260.8C559.6 270.4 576 293.3 576 320L576 512C576 529.7 561.7 544 544 544L512 544C494.3 544 480 529.7 480 512L480 480L160 480L160 512C160 529.7 145.7 544 128 544L96 544C78.3 544 64 529.7 64 512L64 320C64 293.3 80.4 270.4 103.6 260.8zM192 368C192 350.3 177.7 336 160 336C142.3 336 128 350.3 128 368C128 385.7 142.3 400 160 400C177.7 400 192 385.7 192 368zM480 400C497.7 400 512 385.7 512 368C512 350.3 497.7 336 480 336C462.3 336 448 350.3 448 368C448 385.7 462.3 400 480 400z"/>
          </svg>
        `.trim()
      },
      {
        name: 'auto-dualtone',
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <!--!Font Awesome Pro v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2025 Fonticons, Inc.-->
            <path opacity=".4" d="M64 480L64 512C64 529.7 78.3 544 96 544L128 544C145.7 544 160 529.7 160 512L160 480L64 480zM173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160C215.8 160 203.7 168.6 199.2 181.4L173.1 256zM480 480L480 512C480 529.7 494.3 544 512 544L544 544C561.7 544 576 529.7 576 512L576 480L480 480z"/><path d="M160 480L64 480L64 320C64 293.3 80.4 270.4 103.6 260.8L138.8 160.3C152.3 121.8 188.6 96 229.4 96L410.6 96C451.4 96 487.7 121.8 501.2 160.3L536.4 260.8C559.6 270.4 576 293.3 576 320L576 480L160 480zM229.4 160C215.8 160 203.7 168.6 199.2 181.4L173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160zM160 400C177.7 400 192 385.7 192 368C192 350.3 177.7 336 160 336C142.3 336 128 350.3 128 368C128 385.7 142.3 400 160 400zM512 368C512 350.3 497.7 336 480 336C462.3 336 448 350.3 448 368C448 385.7 462.3 400 480 400C497.7 400 512 385.7 512 368z"/>
          </svg>
        `.trim()
      },
      {
        name: 'motorcycle',
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
            <path d="M280 80C266.7 80 256 90.7 256 104C256 117.3 266.7 128 280 128L336.6 128L359.1 176.7L264 248C230.6 222.9 189 208 144 208L88 208C74.7 208 64 218.7 64 232C64 245.3 74.7 256 88 256L144 256C222.5 256 287.2 315.6 295.2 392L269.8 392C258.6 332.8 206.5 288 144 288C73.3 288 16 345.3 16 416C16 486.7 73.3 544 144 544C206.5 544 258.5 499.2 269.8 440L320 440C333.3 440 344 429.3 344 416L344 393.5C344 348.4 369.7 308.1 409.5 285.8L421.6 311.9C389.2 335.1 368.1 373.1 368.1 416C368.1 486.7 425.4 544 496.1 544C566.8 544 624.1 486.7 624.1 416C624.1 345.3 566.8 288 496.1 288C485.4 288 475.1 289.3 465.2 291.8L433.8 224L488 224C501.3 224 512 213.3 512 200L512 152C512 138.7 501.3 128 488 128L434.7 128C427.8 128 421 130.2 415.5 134.4L398.4 147.2L373.8 93.9C369.9 85.4 361.4 80 352 80L280 80zM445.8 364.4L474.2 426C479.8 438 494 443.3 506 437.7C518 432.1 523.3 417.9 517.7 405.9L489.2 344.3C491.4 344.1 493.6 344 495.9 344C535.7 344 567.9 376.2 567.9 416C567.9 455.8 535.7 488 495.9 488C456.1 488 423.9 455.8 423.9 416C423.9 395.8 432.2 377.5 445.7 364.4zM144 488C104.2 488 72 455.8 72 416C72 376.2 104.2 344 144 344C175.3 344 202 364 211.9 392L144 392C130.7 392 120 402.7 120 416C120 429.3 130.7 440 144 440L211.9 440C202 468 175.3 488 144 488z"/>
          </svg>
        `.trim()
      },
      {
        name: 'motorcycle-dualtone',
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <!--!Font Awesome Pro v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2025 Fonticons, Inc.-->
            <path opacity=".4" d="M16 416C16 345.3 73.3 288 144 288C206.5 288 258.5 332.8 269.8 392L211.9 392C202 364 175.3 344 144 344C104.2 344 72 376.2 72 416C72 455.8 104.2 488 144 488C175.3 488 202 468 211.9 440L269.8 440C258.6 499.2 206.5 544 144 544C73.3 544 16 486.7 16 416zM368 416C368 373.1 389.1 335.1 421.5 311.9L445.7 364.4C432.3 377.5 423.9 395.8 423.9 416C423.9 455.8 456.1 488 495.9 488C535.7 488 567.9 455.8 567.9 416C567.9 376.2 535.7 344 495.9 344C493.7 344 491.4 344.1 489.2 344.3L464.9 291.8C474.8 289.3 485.2 288 495.8 288C566.5 288 623.8 345.3 623.8 416C623.8 486.7 566.5 544 495.8 544C425.1 544 367.8 486.7 367.8 416z"/><path d="M256 104C256 90.7 266.7 80 280 80L352 80C361.4 80 369.9 85.4 373.8 93.9L398.4 147.2L415.5 134.4C421 130.2 427.8 128 434.7 128L488 128C501.3 128 512 138.7 512 152L512 200C512 213.3 501.3 224 488 224L433.8 224L517.8 405.9C523.4 417.9 518.1 432.2 506.1 437.7C494.1 443.2 479.8 438 474.3 426L409.5 285.8C369.7 308.1 344 348.4 344 393.5L344 416C344 429.3 333.3 440 320 440L144 440C130.7 440 120 429.3 120 416C120 402.7 130.7 392 144 392L295.2 392C287.2 315.6 222.6 256 144 256L88 256C74.7 256 64 245.3 64 232C64 218.7 74.7 208 88 208L144 208C189 208 230.6 222.9 264 248L359.1 176.7L336.6 128L280 128C266.7 128 256 117.3 256 104z"/>
          </svg>
        `.trim()
      }
    ];
  }

  constructor() {
    super();
    this.passThruAttributes = [
      'autocomplete', 'placeholder', 'min', 'max', 'minlength',
      'maxlength', 'pattern', 'step', 'multiple', 'list'
    ];
    this.passThruEmptyAttributes = [
      'autofocus', 'disabled', 'readonly', 'required', 'novalidate'
    ];
    this.ignoreAttributes = [
      'lbl-label', 'toggle-switch', 'tooltip', 'tooltip-position', 'select-on-focus', 'auto-flex'
    ];
    this.eventAttributes = [
      'onchange', 'oninput', 'onblur', 'onfocus', 'onkeydown', 'onkeyup',
      'onkeypress', 'onclick'
    ];    
    const compEl = this.querySelector('.wc-input');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-input', 'relative');
      this.appendChild(this.componentElement);      
    }
    // console.log('ctor:wc-input');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    // console.log('connectedCallback:wc-input');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {
    // Add this block to handle event attributes
    if (this.eventAttributes.includes(attrName)) {
      if (this.formElement) {
        if (newValue) {
          // Create a function that properly binds 'this' to the form element
          const eventHandler = new Function('event', `
            const element = event.target;
            const value = element.value;
            const checked = element.checked;
            with (element) {
              ${newValue}
            }
          `);
          // Remove 'on' prefix to get event name
          const eventName = attrName.substring(2);
          this.formElement.addEventListener(eventName, eventHandler);
        }
      }
      return;
    }    
    if (this.passThruAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, newValue);
    }
    if (this.passThruEmptyAttributes.includes(attrName)) {
      const type = this.getAttribute('type') || 'text';
      if (type === 'radio') {
        // For radio buttons, only apply 'required' to the first radio
        // This ensures proper HTML5 validation without showing asterisks on all options
        if (attrName === 'required') {
          const radios = this.querySelectorAll('input[type="radio"]');
          if (radios.length > 0) {
            radios[0].setAttribute(attrName, '');
          }
        } else {
          // For other attributes like disabled, readonly, apply to all radios
          const radios = this.querySelectorAll('input[type="radio"]');
          radios.forEach(radio => {
            radio.setAttribute(attrName, '');
          });
        }
      } else {
        this.formElement?.setAttribute(attrName, '');

        // Handle autofocus - need to explicitly call focus() for dynamic elements
        if (attrName === 'autofocus' && this.formElement) {
          // Use setTimeout to ensure DOM is ready
          setTimeout(() => {
            this.formElement?.focus();
          }, 100);
        }
      }
    }
    if (this.ignoreAttributes.includes(attrName)) {
      // Do nothing...
    }

    if (attrName === 'tooltip' || attrName === 'tooltip-position') {
      this._createTooltipElement();
      return;
    }

    if (attrName === 'lbl-class') {
      const name = this.getAttribute('name');
      const lbl = this.querySelector(`label[for="${name}"]`);
      lbl?.classList.add(newValue);
    } else if (attrName === 'radio-group-class') {
      const elt = this.querySelector('.radio-group');
      const parts = newValue.split(' ');
      parts.forEach(p => {
        if (p) {
          elt?.classList.add(p.trim());
        }
      });
      elt?.classList.add('text-2xs');
      // elt?.classList.add(newValue);
    } else if (attrName === 'type') {
      // Map custom types to their underlying HTML input types
      const customTypeMap = {
        'currency': 'number',
        'auto': 'text',
        'auto-dualtone': 'text',
        'motorcycle': 'text',
        'motorcycle-dualtone': 'text'
      };

      const actualType = customTypeMap[newValue] || newValue;
      this.formElement?.setAttribute('type', actualType);

      if (newValue === 'checkbox') {
        if (this.hasAttribute('checked')) {
          this.formElement?.setAttribute('checked', '');
          this.formElement?.setAttribute('value', 'bool:True');
        } else {
          this.formElement?.removeAttribute('checked');
          this.formElement?.setAttribute('value', 'bool:False');
        }
      }
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-input > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';

      this._createInnerElement();
    }

    // Add this: wire events after element creation
    this.eventAttributes.forEach(attr => {
      const value = this.getAttribute(attr);
      if (value) {
        this._handleAttributeChange(attr, value);
      }
    });    

    // Create tooltip after element creation
    this._createTooltipElement();

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    // console.log('_render:wc-input');
  }

  _createInnerElement() {
    const labelText = this.getAttribute('lbl-label') || '';
    const name = this.getAttribute('name');
    const type = this.getAttribute('type') || 'text';
    const isToggle = this.hasAttribute('toggle-switch');
    // const options = this.getAttribute('options') ? JSON.parse(this.getAttribute('options')) : [];

    if (labelText) {
      const lblEl = document.createElement('label');
      const value = this.getAttribute('value') || '';
      if (type === 'range' && value) {
        lblEl.textContent = `${labelText} (${value})`;
      } else {
        lblEl.textContent = labelText;
      }
      lblEl.setAttribute('for', name);
      this.componentElement.appendChild(lblEl);
    }

    this.formElement = document.createElement('input');
    this.formElement.setAttribute('form-element', '');
    this.formElement.setAttribute('type', type);
    
    // if (type === 'radio' && options.length) {
    if (type === 'radio') {
      let options = [];
      let optionList = this.querySelectorAll('option');
      optionList.forEach(f => {
        const key = f.textContent.trim();
        const value = f.value.trim();
        const flex = f.getAttribute('data-flex');
        const option = {"key": key, "value": value};
        if (flex) {
          option.flex = flex;
        }
        options.push(option);
      });
      optionList.forEach(f => f.remove());
      if (options.length == 0) {
        options = this.getAttribute('options') ? JSON.parse(this.getAttribute('options')) : [];
      }

      // Auto-calculate flex values based on text length if not explicitly set
      if (this.hasAttribute('auto-flex') && options.length > 0) {
        const lengths = options.map(opt => opt.key.length);
        const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

        options.forEach((opt, idx) => {
          if (!opt.flex) {
            // If this option is significantly longer than average, give it more flex
            const ratio = lengths[idx] / avgLength;
            if (ratio > 1.5) {
              opt.flex = '2';
            } else {
              opt.flex = '1';
            }
          }
        });
      }
      const radioContainer = document.createElement('div');
      radioContainer.classList.add('radio-group');

      options.forEach(option => {
        const radioLabel = document.createElement('label');
        radioLabel.classList.add('radio-option');
        radioLabel.textContent = option.key;

        // Apply custom flex value if provided
        if (option.flex) {
          radioLabel.style.flex = option.flex;
        }

        const radioInput = document.createElement('input');
        radioInput.setAttribute('type', 'radio');
        radioInput.setAttribute('name', name);
        radioInput.setAttribute('value', option.value);
        if (option.value === this.getAttribute('value')) {
            radioInput.setAttribute('checked', '');
        }

        // Add event wiring for radio buttons
        this.eventAttributes.forEach(attr => {
          const value = this.getAttribute(attr);
          if (value) {
            const eventName = attr.substring(2);
            const eventHandler = new Function('event', `
              const element = event.target;
              const value = element.value;
              const checked = element.checked;
              with (element) {
                ${value}
              }
            `);
            radioInput.addEventListener(eventName, eventHandler);
          }
        });

        radioLabel.prepend(radioInput);
        radioContainer.appendChild(radioLabel);
      });
      this.componentElement.appendChild(radioContainer);
    } else if (type === 'checkbox' && isToggle) {
      this.formElement.classList.add('toggle-checkbox');

      const toggleWrapper = document.createElement('div');
      toggleWrapper.classList.add('toggle-wrapper');
      toggleWrapper.appendChild(this.formElement);

      const toggleSwitch = document.createElement('span');
      toggleSwitch.classList.add('toggle-switch');
      toggleWrapper.appendChild(toggleSwitch);
      this.componentElement.appendChild(toggleWrapper);
      const hiddenCheckbox = document.createElement('input');
      hiddenCheckbox.name = name;
      hiddenCheckbox.type = 'hidden';
      hiddenCheckbox.checked = true;
      hiddenCheckbox.value = 'bool:False';
      this.componentElement.appendChild(hiddenCheckbox);
    } else if (type === 'currency') {
      this.formElement.setAttribute('type', 'number');
      const icon = document.createElement('span');
      icon.classList.add('icon');
      const iconItem = WcInput.icons.find(f => f.name === 'currency-symbol');
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === 'auto-dualtone') {
      this.formElement.setAttribute('type', 'text');
      const icon = document.createElement('span');
      icon.classList.add('icon');
      const iconItem = WcInput.icons.find(f => f.name === 'auto-dualtone');
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === 'auto') {
      this.formElement.setAttribute('type', 'text');
      const icon = document.createElement('span');
      icon.classList.add('icon');
      const iconItem = WcInput.icons.find(f => f.name === 'auto');
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === 'motorcycle-dualtone') {
      this.formElement.setAttribute('type', 'text');
      const icon = document.createElement('span');
      icon.classList.add('icon');
      const iconItem = WcInput.icons.find(f => f.name === 'motorcycle-dualtone');
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === 'motorcycle') {
      this.formElement.setAttribute('type', 'text');
      const icon = document.createElement('span');
      icon.classList.add('icon');
      const iconItem = WcInput.icons.find(f => f.name === 'motorcycle');
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === 'email') {
      const icon = document.createElement('span');
      icon.classList.add('icon');
      const iconItem = WcInput.icons.find(f => f.name === 'email-fill');
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === 'search') {
      const icon = document.createElement('span');
      icon.classList.add('icon');
      const iconItem = WcInput.icons.find(f => f.name === 'magnifying-glass');
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === 'tel') {
      const icon = document.createElement('span');
      icon.classList.add('icon');
      const iconItem = WcInput.icons.find(f => f.name === 'tel-fill');
      icon.innerHTML = iconItem.icon;
      this.formElement.setAttribute('_', `on wc:ready from document
          log "wc:ready from document!"
          call wc.MaskHub.phoneMask(event)
          me.setCustomValidity('')
        end`);
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === 'password') {
      // Left lock icon
      const lockIcon = document.createElement('span');
      lockIcon.classList.add('icon');
      const lockIconItem = WcInput.icons.find(f => f.name === 'lock');
      lockIcon.innerHTML = lockIconItem.icon;
      
      // Right eye icon
      const eyeIcon = document.createElement('span');
      eyeIcon.classList.add('icon', 'icon-right');
      const eyeIconItem = WcInput.icons.find(f => f.name === 'eye');
      eyeIcon.innerHTML = eyeIconItem.icon;
      eyeIcon.style.cursor = 'pointer';
      eyeIcon.addEventListener('click', () => this._togglePasswordVisibility());
      
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(lockIcon);
      this.componentElement.appendChild(eyeIcon);
    } else {
      this.componentElement.appendChild(this.formElement);
    }

    // Add select-on-focus functionality if attribute is present
    if (this.hasAttribute('select-on-focus') && this.formElement) {
      this.formElement.addEventListener('focus', (e) => {
        // Use setTimeout to ensure the cursor is positioned correctly
        setTimeout(() => {
          e.target.select();
        }, 0);
      });
    }
  }

  _createTooltipElement() {
    // Remove any existing tooltip
    const existingTooltip = this.querySelector('.wc-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    const tooltipText = this.getAttribute('tooltip');
    if (!tooltipText) return;

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'wc-tooltip';
    tooltip.textContent = tooltipText;
    // Don't set popover attribute yet - will be set when needed

    const position = this.getAttribute('tooltip-position') || 'top';
    tooltip.setAttribute('data-position', position);

    // Add anchor name to the form element
    if (this.formElement) {
      this.formElement.style.anchorName = `--anchor-${this.getAttribute('name')}`;
      tooltip.style.positionAnchor = `--anchor-${this.getAttribute('name')}`;
    }

    this.componentElement.appendChild(tooltip);

    // Wire up tooltip events
    this._wireTooltipEvents();
  }

  _wireTooltipEvents() {
    const tooltip = this.querySelector('.wc-tooltip');
    if (!tooltip) return;

    const showTooltip = () => {
      // Check if popover API is supported
      if ('showPopover' in HTMLElement.prototype) {
        // Set popover attribute only when showing
        if (!tooltip.hasAttribute('popover')) {
          tooltip.setAttribute('popover', 'manual');
        }

        try {
          // Check if element is connected and not already showing
          if (tooltip.isConnected && !tooltip.matches(':popover-open')) {
            tooltip.showPopover();
          }
        } catch (e) {
          // Fallback to class-based approach
          tooltip.classList.add('show');
        }
      } else {
        // Fallback for browsers without popover support
        tooltip.classList.add('show');
      }
    };

    const hideTooltip = () => {
      if ('hidePopover' in HTMLElement.prototype && tooltip.hasAttribute('popover')) {
        try {
          if (tooltip.matches(':popover-open')) {
            tooltip.hidePopover();
          }
        } catch (e) {
          tooltip.classList.remove('show');
        }
      } else {
        tooltip.classList.remove('show');
      }
    };

    // Add events to form element
    if (this.formElement) {
      this.formElement.addEventListener('mouseenter', showTooltip);
      this.formElement.addEventListener('mouseleave', hideTooltip);
      this.formElement.addEventListener('focus', showTooltip);
      this.formElement.addEventListener('blur', hideTooltip);
    }

    // For radio buttons, add to container
    if (this.getAttribute('type') === 'radio') {
      const radioGroup = this.querySelector('.radio-group');
      if (radioGroup) {
        radioGroup.addEventListener('mouseenter', showTooltip);
        radioGroup.addEventListener('mouseleave', hideTooltip);
        // Set anchor on radio group instead
        radioGroup.style.anchorName = `--anchor-${this.getAttribute('name')}`;
        tooltip.style.positionAnchor = `--anchor-${this.getAttribute('name')}`;
      }
    }
  }

  _togglePasswordVisibility() {
    if (!this.formElement) return;
    
    const currentType = this.formElement.getAttribute('type');
    const icon = this.componentElement.querySelector('.icon-right');
    
    if (currentType === 'password') {
      this.formElement.setAttribute('type', 'text');
      const eyeSlashIcon = WcInput.icons.find(f => f.name === 'eye-slash');
      icon.innerHTML = eyeSlashIcon.icon;
    } else {
      this.formElement.setAttribute('type', 'password');
      const eyeIcon = WcInput.icons.find(f => f.name === 'eye');
      icon.innerHTML = eyeIcon.icon;
    }
  }

  _applyStyle() {
    const style = `
      wc-input {
        display: contents;
      }

      /* Autofill styles to prevent dark background */
      wc-input input:-webkit-autofill,
      wc-input input:-webkit-autofill:hover,
      wc-input input:-webkit-autofill:focus,
      wc-input input:-webkit-autofill:active {
        -webkit-background-clip: text;
        -webkit-text-fill-color: var(--text-1);
        transition: background-color 5000s ease-in-out 0s;
        box-shadow: inset 0 0 20px 20px var(--surface-3);
      }
      /*
      wc-input label {
        margin-bottom: 0.250rem;
      }
      wc-input input {
        background-color: var(--surface-3);
        border: 1px solid var(--surface-4);
        border-radius: 0.375rem;
        color: var(--text-1);
        padding: 0.375rem;
        width: 100%;
      }
      wc-input input:-webkit-autofill {
        background-color: var(--surface-3);
        color: var(--surface-4);
        box-shadow: 0 0 0px 1000px var(--surface-3) inset;
        -webkit-text-fill-color: var(--text-1);
        transition: background-color 5000s ease-in-out 0s;
      }
      input:focus-visible {
        outline: var(--surface-4) solid 2px;
        outline-offset: 0px;
      }
      input:user-invalid {
        outline: solid 2px var(--invalid-color);
        outline-offset: 0px;
      }
      input[type="checkbox"],
      input[type="range"] {
        background-color: var(--component-bg-color);
        border: 1px solid var(--component-border-color);
        accent-color: var(--component-bg-color);
      }
      input[type="checkbox"]:hover,
      input[type="range"]:hover {
        accent-color: var(--primary-bg-color);
      }
      input[type="button"] {
        position: relative;
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
        border: 1px solid var(--primary-bg-color);
        border: none;
        border-radius: 0.375rem;
        padding: 0.5rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      input[type="button"]:focus-visible {
        outline: var(--primary-bg-color) solid 2px;
        outline-offset: 2px;  
      }
      input[type="button"]:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }
      input[type="button"]:hover:not(:disabled) {
        background-color: var(--primary-alt-bg-color);
      }
      */


      div.wc-input :disabled:not(.toggle-checkbox),
      div.wc-textarea :disabled,
      div.wc-select :disabled,
      div.wc-code-mirror :disabled 
      {
        cursor: not-allowed;
        opacity: 0.7;
        font-style: italic;  
      }
      div.wc-input label:has(:disabled),
      div.wc-textarea label:has(:disabled),
      div.wc-select label:has(:disabled),
      div.wc-code-mirror label:has(:disabled)
      {
        cursor: not-allowed;
      }
      div.wc-input:has(:disabled) label,
      div.wc-textarea:has(:disabled) label,
      div.wc-select:has(:disabled) label,
      div.wc-code-mirror:has(:disabled) label
      {
        opacity: 0.7;
        font-style: italic;
      }
      div.wc-input:has(:required) > label,
      div.wc-textarea:has(:required) label,
      div.wc-select:has(:required) label,
      /*div.wc-code-mirror:has(:required) label*/
      div.wc-code-mirror[required] label
      {
        font-weight: bold;
      }
      div.wc-input:has(:required) > label::after,
      div.wc-textarea:has(:required) label::after,
      div.wc-select:has(:required) label::after,
      /*div.wc-code-mirror:has(:required) label::after*/
      div.wc-code-mirror[required] label::after
      {
        content: ' *';
        font-weight: bold;
      }



      wc-input input {
        width: 100%;
      }
      wc-input .toggle-wrapper {
        position: relative;
        width: 50px;
        height: 22px;
        display: inline-block;
        margin-top: 0.25rem;
      }

      wc-input .toggle-checkbox {
        opacity: 0;
        width: 100%;
        height: 100%;
      }
      wc-input .toggle-checkbox:focus-visible + .toggle-switch {
        outline: var(--primary-bg-color) solid 2px;
        outline-offset: 0px;
      }

      wc-input .toggle-switch {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--toggle-off);
        border: 1px solid var(--component-border-color);
        border-radius: 25px;
        /* cursor: pointer; */
        transition: background-color 0.4s;
        pointer-events: none;
      }

      .xdark wc-input .toggle-switch {
        background-color: var(--toggle-off);
        border: 1px solid var(--component-border-color);
        transition: background-color 0.25s;
      }

      wc-input .toggle-switch::before {
        position: absolute;
        content: "";
        height: 15px;
        width: 15px;
        left: 2px;
        bottom: 2px;
        background-color: var(--primary-bg-color);
        border: 1px solid var(--toggle-off);
        border-radius: 50%;
        transition: transform 0.4s;
      }

      wc-input .toggle-checkbox:checked + .toggle-switch::before {
        border: 1px solid var(--toggle-on);
      }
      wc-input .toggle-checkbox:checked + .toggle-switch {
        background-color: var(--toggle-on);
      }
      .xdark wc-input .toggle-checkbox:checked + .toggle-switch {
        background-color: var(--component-bg-color);
      }

      wc-input .toggle-checkbox:checked + .toggle-switch::before {
        transform: translateX(27px);
      }

      wc-input .toggle-checkbox:disabled + .toggle-switch {
        opacity: 0.7;
      }




      wc-input .radio-group {
        min-height: 34.5px;
      }
      wc-input .radio-group:not(.row):not(.row-1):not(.col):not(.col-1) {
        display: inline-flex;
      }
      wc-input .radio-group:not(.modern) {
        gap: 0.875rem;
      }
      wc-input .radio-group .radio-option {
        display: inline-flex;
        flex: 1 1 0%;
        align-items: center;
        justify-content: center;
        position: relative;
        outline: none;
        text-align: center;
      }
      wc-input .radio-group:not(.modern) .radio-option {
        padding-left: 12px;
        align-self: center;
        justify-content: left;
      }
      wc-input .radio-group.col:not(.modern) .radio-option {
        padding-left: 12px;
        align-self: self-start;
      }
      wc-input .radio-group.modern {
        border: 1px solid var(--component-bg-color);
        border-radius: 5px;
      }
      wc-input .radio-group.modern .radio-option {
        padding: 0 0.5rem;
        background-color: var(--component-bg-color);
        color: var(--primary-color);
        border-right: 1px solid var(--radio-checked-bg);
      }
      wc-input .radio-group.modern .radio-option:first-child {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
      }
      wc-input .radio-group.modern .radio-option:last-child {
        border-right: none;
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
      }
      wc-input .radio-group .radio-option input[type="radio"] {
        opacity: 0;
        margin: 0;
      }
      wc-input .radio-group.modern .radio-option input[type="radio"] {
        position: absolute;
      }
      wc-input .radio-group.modern .radio-option:hover:not(:has(input[type="radio"]:disabled)) {
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
      }
      wc-input .radio-group.modern .radio-option:has(input[type="radio"]:checked) {
        background-color: var(--radio-checked-bg);
        color: var(--secondary-alt-color);
      }
      wc-input .radio-group.modern:has(:focus-within) {
        outline: var(--primary-bg-color) solid 2px;
        outline-offset: 0px;
        border: 1px solid transparent;
      }
      wc-input .radio-group:not(.modern) .radio-option::before {
        content: "";
        display: inline-block;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid var(--component-border-color);
        background-color: var(--white-color);
        transition: border-color 0.3s;
        position: absolute;
        left: 0;
        top: 0;
      }
      wc-input .radio-group:not(.modern) .radio-option:has(:checked)::after {
        content: "";
        display: inline-block;
        width: 10px; /* Slightly smaller than outer circle */
        height: 10px;
        border-radius: 50%;
        background-color: var(--primary-bg-color);
        position: absolute;
        left: 5px;
        top: 5px;
        transition: background-color 0.3s;
      }
      wc-input .radio-option:hover::before {
        border-color: var(--secondary-bg-color);
      }
      wc-input .radio-group:not(.modern) .radio-option:focus-within::after {
        outline: var(--primary-bg-color) solid 2px;
        outline-offset: 0px;
      }



      wc-input[type="auto"] input {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input[type="auto"] input + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }
      wc-input[type="auto-dualtone"] input {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input[type="auto-dualtone"] input + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }

      wc-input[type="motorcycle"] input {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input[type="motorcycle"] input + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }
      wc-input[type="motorcycle-dualtone"] input {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input[type="motorcycle-dualtone"] input + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }


      wc-input input[type="email"] {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input input[type="email"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }

      wc-input input[type="search"] {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input input[type="search"] + .icon {
        position: absolute;
        left: 5px;
      }
      wc-input label + input[type="search"] + .icon {
        top: 25px;
      }
      wc-input input[type="search"] + .icon {
        top: 10px;
      }

      wc-input input[type="tel"] {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input input[type="tel"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }

      wc-input[type="currency"] input[type="number"] {
        padding-left: 25px;
      }
      wc-input[type="currency"] input[type="number"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }

      wc-input input[type="password"] {
        padding-left: 25px;
        padding-right: 30px;
      }
      wc-input input[type="password"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }
      wc-input input[type="password"] ~ .icon-right {
        position: absolute;
        top: 25px;
        right: 8px;
      }
      
      /* When password is toggled to text, maintain the padding and icon positions */
      wc-input:has(.icon-right) input[type="text"] {
        padding-left: 25px;
        padding-right: 30px;
      }
      wc-input:has(.icon-right) input[type="text"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }
      wc-input input[type="text"] ~ .icon-right {
        position: absolute;
        top: 25px;
        right: 8px;
      }






    /* Tooltip styles with Anchor Positioning API */
      wc-input .wc-tooltip {
        position: absolute;
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 0.75rem;
        white-space: normal;
        word-wrap: break-word;
        pointer-events: none;
        z-index: 10000;
        max-width: 250px;
        margin: 0;
        border: 0;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, visibility 0.2s;
      }

      /* Show states */
      wc-input .wc-tooltip.show,
      wc-input .wc-tooltip:popover-open {
        opacity: 1;
        visibility: visible;
      }

      /* Popover specific resets */
      wc-input .wc-tooltip[popover] {
        inset: unset;
      }

      /* Anchor positioning when supported */
      @supports (anchor-name: --test) {
        wc-input .wc-tooltip {
          position-try-options: flip-block, flip-inline, flip-block flip-inline;
        }

        wc-input .wc-tooltip.show {
          opacity: 1;
          visibility: visible;
        }
      }

      /* Popover API styles */
      wc-input .wc-tooltip[popover] {
        margin: 0;
        border: 0;
        padding: 6px 12px;
        overflow: visible;
      }

      wc-input .wc-tooltip:popover-open {
        opacity: 1;
        visibility: visible;
      }

      /* Position variations using anchor positioning */
      wc-input .wc-tooltip[data-position="top"] {
        bottom: anchor(top);
        left: anchor(center);
        translate: -50% -8px;

        /* Fallback for position-try */
        position-try-fallbacks:
          bottom-then-top,
          snap-to-edge;
      }

      wc-input .wc-tooltip[data-position="bottom"] {
        top: anchor(bottom);
        left: anchor(center);
        translate: -50% 8px;

        position-try-fallbacks:
          top-then-bottom,
          snap-to-edge;
      }

      wc-input .wc-tooltip[data-position="left"] {
        right: anchor(left);
        top: anchor(center);
        translate: -8px -50%;

        position-try-fallbacks:
          right-then-left,
          snap-to-edge;
      }

      wc-input .wc-tooltip[data-position="right"] {
        left: anchor(right);
        top: anchor(center);
        translate: 8px -50%;

        position-try-fallbacks:
          left-then-right,
          snap-to-edge;
      }

      /* Try to keep tooltip in viewport */
      @position-try bottom-then-top {
        bottom: auto;
        top: anchor(bottom);
        translate: -50% 8px;
      }

      @position-try top-then-bottom {
        top: auto;
        bottom: anchor(top);
        translate: -50% -8px;
      }

      @position-try right-then-left {
        right: auto;
        left: anchor(right);
        translate: 8px -50%;
      }

      @position-try left-then-right {
        left: auto;
        right: anchor(left);
        translate: -8px -50%;
      }

      @position-try snap-to-edge {
        position: absolute;
        inset: auto;
        top: 0;
        left: 0;
      }

      /* Arrow styles - hidden when position changes */
      wc-input .wc-tooltip::before {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border: 6px solid transparent;
      }

      wc-input .wc-tooltip[data-position="top"]::before {
        border-top-color: rgba(0, 0, 0, 0.9);
        bottom: -12px;
        left: 50%;
        transform: translateX(-50%);
      }

      wc-input .wc-tooltip[data-position="bottom"]::before {
        border-bottom-color: rgba(0, 0, 0, 0.9);
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
      }

      wc-input .wc-tooltip[data-position="left"]::before {
        border-left-color: rgba(0, 0, 0, 0.9);
        right: -12px;
        top: 50%;
        transform: translateY(-50%);
      }

      wc-input .wc-tooltip[data-position="right"]::before {
        border-right-color: rgba(0, 0, 0, 0.9);
        left: -12px;
        top: 50%;
        transform: translateY(-50%);
      }

      /* Fallback positioning for older browsers */
      @supports not (anchor-name: --test) {
        wc-input .wc-tooltip[data-position="top"] {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
        }

        wc-input .wc-tooltip[data-position="bottom"] {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
        }

        wc-input .wc-tooltip[data-position="left"] {
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 8px;
        }

        wc-input .wc-tooltip[data-position="right"] {
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-left: 8px;
        }
      }

    `.trim();
    this.loadStyle('wc-input-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();

    // Remove tooltip element
    const tooltip = this.querySelector('.wc-tooltip');
    if (tooltip) {
      if (tooltip.popover && tooltip.matches(':popover-open')) {
        tooltip.hidePopover();
      }
      tooltip.remove();
    }

    // Clean up anchor names
    if (this.formElement) {
      this.formElement.style.anchorName = '';
    }
    const radioGroup = this.querySelector('.radio-group');
    if (radioGroup) {
      radioGroup.style.anchorName = '';
    }
  }

}

customElements.define('wc-input', WcInput);
