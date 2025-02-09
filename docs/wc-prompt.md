# WC-Prompt Web Component

`wc-prompt` is a versatile notification and prompt component that integrates SweetAlert2 and notie libraries to provide a comprehensive suite of user notifications, alerts, and prompts.

## Features

- Multiple notification types (banner, toast, modal)
- Theme support
- Customizable prompts
- Async/await support
- Event-driven architecture
- Template-based notifications

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

```javascript
import './wc-prompt.js';
// The component self-registers if not already defined
```

## Basic Usage

```html
<!-- Add the prompt component to your page (only once) -->
<wc-prompt></wc-prompt>

<!-- Access via window.wc.Prompt or through events -->
<script>
  // Direct usage
  window.wc.Prompt.toast({ 
    title: 'Success!', 
    icon: 'success' 
  });

  // Event-based usage
  wc.EventHub.broadcast('wc-prompt:toast', '', '', {
    title: 'Success!',
    icon: 'success'
  });
</script>
```

## Notification Types

### 1. Banner Messages
Top-aligned notifications using notie library.

```javascript
// Configuration options
const bannerConfig = {
  text: 'Operation completed',
  type: 'success',     // success, warning, error, info
  stay: false,         // persist notification
  time: 3,            // display duration in seconds
  position: 'top'     // notification position
};

// Usage
window.wc.Prompt.banner(bannerConfig);

// Or via event
wc.EventHub.broadcast('wc-prompt:banner', '', '', bannerConfig);
```

### 2. Toast Notifications
Quick, non-intrusive notifications.

```javascript
const toastConfig = {
  title: 'File saved',
  icon: 'success',      // success, error, warning, info, question
  position: 'top-end'   // top-start, top-end, bottom-start, bottom-end
};

window.wc.Prompt.toast(toastConfig);
```

### 3. Modal Dialogs
Full featured modal dialogs with various types.

```javascript
// Success Modal
const successConfig = {
  title: 'Great job!',
  text: 'Operation completed successfully',
  footer: '<a href="#">Need help?</a>',
  callback: (result) => {
    if (result) {
      // Handle confirmation
    }
  }
};
window.wc.Prompt.success(successConfig);

// Question Modal
const questionConfig = {
  title: 'Are you sure?',
  text: 'This action cannot be undone',
  showCancelButton: true,
  callback: (result) => {
    if (result) {
      // Handle confirmation
    }
  }
};
window.wc.Prompt.question(questionConfig);
```

### 4. Custom Notifications
Advanced notifications with custom input and templates.

```javascript
// Custom Input Notification
const inputConfig = {
  icon: 'question',
  title: 'Enter your name',
  input: 'text',
  inputPlaceholder: 'Name',
  callback: (result) => {
    if (result) {
      console.log('Name entered:', result);
    }
  }
};
window.wc.Prompt.notify(inputConfig);

// Template-based Notification
const templateConfig = {
  template: `
    <div class="custom-template">
      <h2>Custom Content</h2>
      <p>This is a custom template notification</p>
    </div>
  `,
  callback: (result) => {
    // Handle result
  }
};
window.wc.Prompt.notifyTemplate(templateConfig);
```

## Event API

All notifications can be triggered via events:

```javascript
// Event names:
// - wc-prompt:banner
// - wc-prompt:toast
// - wc-prompt:success
// - wc-prompt:error
// - wc-prompt:warning
// - wc-prompt:info
// - wc-prompt:question
// - wc-prompt:notify
// - wc-prompt:notify-template

// Example usage
wc.EventHub.broadcast('wc-prompt:success', '', '', {
  title: 'Success!',
  text: 'Operation completed',
  callback: (result) => {
    // Handle result
  }
});
```

## Theming

The component supports CSS variables for theming:

```css
:root {
  --secondary-bg-color: #ffffff;
  --secondary-color: #000000;
  --primary-bg-color: #007bff;
  --component-bg-color: #f8f9fa;
  --component-border-color: #dee2e6;
  --component-color: #212529;
}
```

## Examples

### Form Submission Feedback
```javascript
async function handleSubmit() {
  try {
    await saveData();
    window.wc.Prompt.success({
      title: 'Saved!',
      text: 'Your changes have been saved.'
    });
  } catch (error) {
    window.wc.Prompt.error({
      title: 'Error',
      text: 'Failed to save changes.'
    });
  }
}
```

### Delete Confirmation
```javascript
async function handleDelete() {
  const result = await window.wc.Prompt.question({
    title: 'Delete Item?',
    text: 'This cannot be undone',
    showCancelButton: true,
    callback: (confirmed) => confirmed
  });

  if (result) {
    // Proceed with deletion
  }
}
```

### User Input Collection
```javascript
async function getUserInput() {
  const result = await window.wc.Prompt.notify({
    title: 'User Information',
    input: 'text',
    inputPlaceholder: 'Enter your name',
    callback: (value) => value
  });

  if (result) {
    console.log('User input:', result);
  }
}
```

## Best Practices

1. Single Instance
```html
<!-- Include only once per page -->
<wc-prompt></wc-prompt>
```

2. Handle Async Operations
```javascript
async function performAction() {
  const result = await window.wc.Prompt.question({
    title: 'Proceed?',
    callback: (r) => r
  });
  
  if (result) {
    // Handle confirmation
  }
}
```

3. Use Appropriate Notification Types
```javascript
// Quick feedback
window.wc.Prompt.toast({ title: 'Saved' });

// Important warnings
window.wc.Prompt.warning({
  title: 'Warning',
  text: 'Critical battery level'
});

// User confirmation
window.wc.Prompt.question({
  title: 'Confirm action'
});
```

## Technical Notes

- Dependencies: SweetAlert2 and notie libraries
- Automatic theme integration
- Event-based architecture
- Async/await support
- Template support
- Callback handling

## Browser Support

Requires browsers that support:
- Custom Elements v1
- ES6 Classes and Modules
- Promises
- CustomEvent API
- SweetAlert2 and notie compatibility

