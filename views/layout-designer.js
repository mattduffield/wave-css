// Designer State
const designerState = {
  elements: [],
  selectedElement: null,
  schema: null,
  rules: [],
  editingRuleIndex: -1
};

// Sample Schema JSON
const sampleSchema = {
  "$defs": {
    "navitem": {
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 1, "default": "" },
        "slug": { "type": "string", "minLength": 1, "default": "" },
        "suffix": { "type": "string", "default": "" },
        "url": { "type": "string", "default": "" },
        "route_prefix": { "type": "string", "default": "" }
      },
      "required": ["name", "slug"]
    }
  },
  "title": "Screen",
  "type": "object",
  "properties": {
    "name": { "type": "string", "minLength": 3, "default": "" },
    "slug": { "type": "string", "minLength": 3, "default": "" },
    "navigation_items": {
      "type": "array",
      "items": { "$ref": "#/$defs/navitem" },
      "default": []
    },
    "is_active": { "type": "boolean", "default": false }
  },
  "required": ["name", "slug"]
};

// DOM Elements
let designerSurface = null;
let containerElements = null;
let formElements = null;
let schemaFields = null;
let previewButton = null;
let renderedPreviewButton = null;
let preRenderedPreviewButton = null;
let schemaButton = null;
let previewFrame = null;
let closePreviewButton = null;
let generateJsonButton = null;
let jsonOutput = null;
let propId = null;
let propType = null;
let propLabel = null;
let propScope = null;
let propCss = null;
let propRequired = null;
let savePropertiesButton = null;
let noSelectionPanel = null;
let elementPropertiesPanel = null;
let schemaJson = null;
let loadSchemaButton = null;
let addRuleButton = null;
let rulesList = null;
let saveRuleButton = null;

let loadDesignButton = null;
let copyDesignButton = null;
let downloadDesignButton = null;

function setup() {
  // DOM Elements
  designerSurface = document.getElementById('designer-surface');
  containerElements = document.getElementById('container-elements');
  formElements = document.getElementById('form-elements');
  schemaFields = document.getElementById('schema-fields');
  previewButton = document.querySelector('button[data-label="Preview"]');
  closePreviewButton = document.querySelector('button[data-label="Canvas"]');
  renderedPreviewButton = document.querySelector('button[data-label="Preview"]');
  preRenderedPreviewButton = document.querySelector('button[data-label="Raw Preview"]');
  schemaButton = document.querySelector('button[data-label="Schema"]');
  generateJsonButton = document.querySelector('button[data-label="Layout JSON"]');
  jsonOutput = document.querySelector('wc-code-mirror[name="json-output"]');
  propId = document.getElementById('prop-id');
  propType = document.getElementById('prop-type');
  propLabel = document.getElementById('prop-label');
  propScope = document.getElementById('prop-scope');
  propCss = document.getElementById('prop-css');
  propRequired = document.getElementById('prop-required');
  savePropertiesButton = document.getElementById('save-properties');
  noSelectionPanel = document.getElementById('no-selection');
  elementPropertiesPanel = document.getElementById('element-properties');
  schemaJson = document.querySelector('wc-code-mirror[name="schema-json"]');
  loadSchemaButton = document.getElementById('load-schema');
  addRuleButton = document.getElementById('add-rule');
  rulesList = document.getElementById('rules-list');
  saveRuleButton = document.getElementById('save-rule');

  loadDesignButton = document.getElementById('load-design');
  copyDesignButton = document.getElementById('copy-design');
  downloadDesignButton = document.getElementById('download-design');
  
  init();
}

// Initialize Designer
function init() {
  initTabs();
  initDragAndDrop();
  
  // Initialize the main designer surface as a drop zone
  initDropZone(designerSurface, null);
  
  // Make the designer surface sortable
  new Sortable(designerSurface, {
    group: 'elements',
    animation: 150,
    onEnd: function(evt) {
      // Update the order of top-level elements
      updateTopLevelElementsOrder();
    }
  });
  
  initEventListeners();
  
  // Set initial schema
  // schemaJson.value = JSON.stringify(sampleSchema, null, 2);
  schemaJson.editor.setValue(JSON.stringify(sampleSchema, null, 2));
  loadSchema(sampleSchema);
}

// Update top-level elements order
function updateTopLevelElementsOrder() {
  const newOrder = [];
  const childElements = designerSurface.querySelectorAll(':scope > .designer-element');
  
  childElements.forEach(childNode => {
    const childId = childNode.getAttribute('data-id');
    const child = findElementById(childId);
    if (child) {
      newOrder.push(child);
    }
  });
  
  designerState.elements = newOrder;
}

// Initialize Tabs
function initTabs() {
  const tabHeaders = document.querySelectorAll('.tab-header');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const tabId = header.getAttribute('data-tab');
      
      // Update active tab header
      tabHeaders.forEach(h => h.classList.remove('active'));
      header.classList.add('active');
      
      // Update active tab content
      tabPanes.forEach(pane => pane.classList.add('hidden'));
      document.getElementById(`${tabId}-tab`).classList.remove('hidden');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

// Initialize Drag and Drop
function initDragAndDrop() {
  const elementItems = document.querySelectorAll('.element-item');
  
  elementItems.forEach(item => {
    item.addEventListener('dragstart', e => {
      e.dataTransfer.setData('element-type', item.getAttribute('data-element-type'));
      e.dataTransfer.setData('schema-field', item.getAttribute('data-schema-field') || '');
      e.dataTransfer.effectAllowed = 'copy';
    });
  });
}

// Initialize Drop Zone
function initDropZone(element, parentElementId = null) {
  // Add a data attribute to mark this as a drop zone
  element.setAttribute('data-drop-zone', 'true');
  
  element.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    // Add a visual indicator for valid drop target
    element.classList.add('drag-over');
  });
  
  element.addEventListener('dragleave', e => {
    // Remove visual indicator
    element.classList.remove('drag-over');
  });
  
  element.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation to prevent multiple drops
    
    // Remove visual indicator
    element.classList.remove('drag-over');
    
    const elementType = e.dataTransfer.getData('element-type');
    const schemaField = e.dataTransfer.getData('schema-field');
    
    if (elementType) {
      let scope = '';
      let label = '';
      
      if (schemaField) {
        scope = schemaField;
        
        // Format the label based on the schema field
        const parts = schemaField.split('/');
        if (parts.length > 0) {
          label = parts[parts.length - 1];
          
          // Handle nested $defs elements
          if (schemaField.includes('$defs')) {
            // For $defs items, we need to add parent prefix
            const defName = parts[2]; // The definition name
            const fieldName = parts[parts.length - 1]; // The property name
            
            // Format as parent.field if it's from a $defs
            if (defName && fieldName) {
              label = defName + '.' + fieldName;
            }
          }
        }
      } else {
        label = getDefaultLabel(elementType);
      }
      
      // Create the element object in the data model
      const newElement = {
        id: generateUniqueId(),
        type: elementType,
        label,
        scope,
        css: '',
        required: false,
        rules: [],
        elements: []
      };
      
      // Add to parent in the data model
      if (parentElementId) {
        const parentElement = findElementById(parentElementId);
        if (parentElement) {
          if (!parentElement.elements) {
            parentElement.elements = [];
          }
          parentElement.elements.push(newElement);
        }
      } else {
        designerState.elements.push(newElement);
      }
      
      // If dropping into a container, safely remove placeholder if it exists
      const placeholder = element.querySelector('.designer-element-placeholder');
      if (placeholder && placeholder.parentNode === element) {
        try {
          element.removeChild(placeholder);
        } catch (e) {
          console.log('Could not remove placeholder:', e);
        }
      }
      
      // Create the DOM element
      const elementNode = createElementNode(newElement);
      element.appendChild(elementNode);
      
      // Add a new placeholder after a short delay to ensure proper rendering
      if (element.classList.contains('designer-element-container')) {
        setTimeout(() => {
          // Only add a placeholder if there isn't one already
          if (!element.querySelector('.designer-element-placeholder')) {
            const newPlaceholder = document.createElement('div');
            newPlaceholder.className = 'designer-element-placeholder';
            newPlaceholder.textContent = 'Drop more elements here';
            element.appendChild(newPlaceholder);
          }
        }, 100);
      }
      
      // Refresh drop zone initialization for newly added containers
      if (isContainerElement(elementType)) {
        const containerElements = document.querySelectorAll('.designer-element-container:not([data-drop-zone])');
        containerElements.forEach(containerElement => {
          const containerId = containerElement.getAttribute('data-container-for');
          if (containerId) {
            initDropZone(containerElement, containerId);
          }
        });
      }
    }
  });
}

// Initialize Event Listeners
function initEventListeners() {
  // Close Preview Button
  closePreviewButton.addEventListener('click', hidePreview);

  // Rendered Preview Button
  renderedPreviewButton.addEventListener('click', renderPreview);

  // Pre Rendered Preview Button
  preRenderedPreviewButton.addEventListener('click', preRenderPreview);

  // Schema Button
  schemaButton.addEventListener('click', setSchema);

  // Generate JSON Button
  generateJsonButton.addEventListener('click', generateJson);
  
  // Save Properties Button
  savePropertiesButton.addEventListener('click', saveProperties);
  
  // Load Schema Button
  loadSchemaButton.addEventListener('click', () => {
    try {
      // const schema = JSON.parse(schemaJson.value);
      const schema = JSON.parse(schemaJson.editor.getValue());
      loadSchema(schema);
    } catch (e) {
      alert('Invalid JSON schema');
    }
  });
  
  // Add Rule Button
  addRuleButton.addEventListener('click', () => {
    designerState.editingRuleIndex = -1;
    const promptPayload = {
      focusConfirm: false,
      template: 'template#rule-template',
      didOpen: () => {
        const cnt = document.querySelector(".swal2-container");
        if (cnt) {
          if (designerState.selectedElement) {
            const src = document.getElementById('rule-src-data-id');
            src.value = designerState.selectedElement.id;
          }
          htmx.process(cnt);
          _hyperscript.processNode(cnt);
        }
      },
      preConfirm: () => {

      },
      callback: (result) => {
        console.log('rule-template - result:', result);
      }
    };
    wc.Prompt.notifyTemplate(promptPayload);
  });
  
  // Load Design Button
  loadDesignButton.addEventListener('click2', () => {
    // Show the modal
    const promptPayload = {
      focusConfirm: false,
      template: 'template#load-design-template',
      didOpen: () => {
        const cnt = document.querySelector(".swal2-container");
        if (cnt) {
          htmx.process(cnt);
          _hyperscript.processNode(cnt);
        }
      },
      callback: (result) => {
        console.log('load-design - result:', result);
        try {
          const jsonText = result.uiLayout.trim();
          if (!jsonText) {
            alert('Please paste a valid JSON layout');
            return;
          }
          const layoutData = JSON.parse(jsonText);
          loadDesign(layoutData);          
        } catch (e) {
          alert('Invalid JSON format: ' + e.message);
        }        
      }
    };
    wc.Prompt.notifyTemplate(promptPayload);
  });
  jsonOutput.editor.on('change2', async () => {
    try {
      const jsonText = jsonOutput.editor.getValue().trim();
      const layoutData = JSON.parse(jsonText);
      loadDesign(layoutData);
    } catch (e) {
      alert('Invalid JSON format: ' + e.message);
    }
  });  
  loadDesignButton.addEventListener('click', () => {
    try {
      const jsonText = jsonOutput.editor.getValue().trim();
      if (!jsonText) {
        alert('Please paste a valid JSON layout');
        return;
      }
      const layoutData = JSON.parse(jsonText);
      loadDesign(layoutData);
      wc.Prompt.toast({title: 'Load Succeeded!'});
    } catch (e) {
      alert('Invalid JSON format: ' + e.message);
    }
  });

  // Copy Design Button
  copyDesignButton.addEventListener('click', copyDesign);

  // Download Design JSON Button
  downloadDesignButton.addEventListener('click', () => {
    const jsonText = jsonOutput.editor.getValue();
    const designName = 'layout-ui-design';
    const fileName = `${designName}.json`;
    
    // Create a blob with the JSON content
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link and click it
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Create Element Object
function createElementObject({ type, label = '', scope = '', parentElement = null, css = '', id = null }) {
  const elementId = id || generateUniqueId();
  
  const element = {
    id: elementId,
    type,
    label,
    scope,
    css,
    required: false,
    rules: [],
    elements: []
  };
  
  if (parentElement) {
    const parent = findElementById(parentElement);
    if (parent) {
      parent.elements.push(element);
    }
    return element;
  } else {
    designerState.elements.push(element);
    return element;
  }
}

// Add Element to Designer
function addElementToDesigner(element, containerElement) {
  // Only remove placeholder if present
  const placeholder = containerElement.querySelector('.designer-element-placeholder');
  if (placeholder) {
    containerElement.removeChild(placeholder);
  }
  
  // Create and append the new element node
  const elementNode = createElementNode(element);
  containerElement.appendChild(elementNode);
}

// Create Element Node
function createElementNode(element) {
  const node = document.createElement('div');
  node.className = 'designer-element';
  node.setAttribute('data-id', element.id);
  node.setAttribute('data-type', element.type);
  
  // Add element type header
  const typeHeader = document.createElement('span');
  typeHeader.className = 'element-type-header';
  typeHeader.textContent = element.type;
  node.appendChild(typeHeader);
  
  // Add label if present
  if (element.label) {
    const labelElement = document.createElement('span');
    labelElement.className = 'element-label';
    labelElement.textContent = element.label;
    node.appendChild(labelElement);
    
    // Add scope if present
    if (element.scope) {
      const scopeElement = document.createElement('small');
      scopeElement.className = 'ms-2 text-muted';
      scopeElement.textContent = `(${element.scope})`;
      labelElement.appendChild(scopeElement);
    }
  }
  
  // Add element actions
  const actions = document.createElement('div');
  actions.className = 'element-actions';
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn btn-sm btn-outline-danger';
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent selection when deleting
    removeElement(element.id);
  });
  actions.appendChild(deleteButton);
  
  node.appendChild(actions);
  
  // Make the element selectable
  node.addEventListener('click', (e) => {
    e.stopPropagation();
    selectElement(element.id);
  });
  
  // Add container for child elements if needed
  if (isContainerElement(element.type)) {
    const container = document.createElement('div');
    container.className = 'designer-element-container';
    container.setAttribute('data-container-for', element.id);
    
    // If empty, add a placeholder
    if (!element.elements || element.elements.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'designer-element-placeholder';
      placeholder.textContent = 'Drop elements here';
      container.appendChild(placeholder);
    } else {
      // Add existing child elements
      element.elements.forEach(childElement => {
        const childNode = createElementNode(childElement);
        container.appendChild(childNode);
      });
    }
    
    // Make the container a drop zone
    initDropZone(container, element.id);
    
    // Initialize sortable for the container
    new Sortable(container, {
      group: 'elements',
      animation: 150,
      onEnd: function(evt) {
        updateElementsOrder(container, element.id);
      }
    });
    
    node.appendChild(container);
  }
  
  return node;
}

// Update Elements Order
function updateElementsOrder(container, parentId) {
  const parent = findElementById(parentId);
  if (!parent) return;
  
  const newOrder = [];
  const childElements = container.querySelectorAll(':scope > .designer-element');
  
  childElements.forEach(childNode => {
    const childId = childNode.getAttribute('data-id');
    const child = findElementById(childId);
    if (child) {
      newOrder.push(child);
    }
  });
  
  parent.elements = newOrder;
}

// Select Element
function selectElement(elementId) {
  // Clear previous selection
  const selectedNodes = document.querySelectorAll('.designer-element.selected');
  selectedNodes.forEach(node => node.classList.remove('selected'));
  
  // Find the element by ID
  const element = findElementById(elementId);
  if (!element) return;
  
  // Set as selected in state
  designerState.selectedElement = element;
  
  // Mark the node as selected
  const node = document.querySelector(`.designer-element[data-id="${elementId}"]`);
  if (node) {
    node.classList.add('selected');
  }
  
  // Update properties
  updateProperties(element);
  
  // Update rules panel
  updateRulesPanel(element);
  
  // Show properties panel
  noSelectionPanel.classList.add('hidden');
  elementPropertiesPanel.classList.remove('hidden');
  
  // Show rules panel
  document.getElementById('rules-no-selection').classList.add('hidden');
  document.getElementById('element-rules').classList.remove('hidden');
}

// Update Properties
function updateProperties(element) {
  propId.value = element.id;
  propType.value = element.type;
  propLabel.value = element.label || '';
  propScope.value = element.scope || '';
  propCss.value = element.css || '';
  propRequired.checked = element.required || false;
}

// Update Rules Panel
function updateRulesPanel(element) {
  rulesList.innerHTML = '';
  
  if (!element.rules || element.rules.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'text-muted text-center';
    emptyMessage.textContent = 'No rules defined';
    rulesList.appendChild(emptyMessage);
    return;
  }
  
  element.rules.forEach((rule, index) => {
    const ruleItem = document.createElement('div');
    ruleItem.className = 'rule-item';
    
    const ruleHeader = document.createElement('div');
    ruleHeader.className = 'd-flex justify-content-between align-items-center mb-2';
    
    const ruleTitle = document.createElement('h6');
    ruleTitle.textContent = `Rule: ${rule.effect}`;
    ruleHeader.appendChild(ruleTitle);
    
    const ruleActions = document.createElement('div');
    
    const editButton = document.createElement('button');
    editButton.className = 'btn btn-sm btn-outline-primary me-2';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => editRule(index));
    ruleActions.appendChild(editButton);
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-sm btn-outline-danger';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', async () => deleteRule(index));
    ruleActions.appendChild(deleteButton);
    
    ruleHeader.appendChild(ruleActions);
    ruleItem.appendChild(ruleHeader);
    
    // Rule summary
    const ruleSummary = document.createElement('div');
    ruleSummary.className = 'text-sm';
    
    const condition = document.createElement('div');
    condition.textContent = `When ${rule.condition.scope} ${getSchemaDescription(rule.condition.schema)}`;
    ruleSummary.appendChild(condition);
    
    const effect = document.createElement('div');
    effect.textContent = `${rule.effect} on ${rule.tgtDataId}`;
    ruleSummary.appendChild(effect);
    
    ruleItem.appendChild(ruleSummary);
    rulesList.appendChild(ruleItem);
  });
}

// Get Schema Description
function getSchemaDescription(schema) {
  if (!schema) return '';
  
  const descriptions = [];
  
  if (schema.const !== undefined) {
    descriptions.push(`equals "${schema.const}"`);
  }
  
  if (schema.enum) {
    descriptions.push(`is one of [${schema.enum.join(', ')}]`);
  }
  
  if (schema.minimum !== undefined) {
    descriptions.push(`>= ${schema.minimum}`);
  }
  
  if (schema.maximum !== undefined) {
    descriptions.push(`<= ${schema.maximum}`);
  }
  
  if (schema.minLength !== undefined) {
    descriptions.push(`length >= ${schema.minLength}`);
  }
  
  if (schema.maxLength !== undefined) {
    descriptions.push(`length <= ${schema.maxLength}`);
  }
  
  if (schema.pattern) {
    descriptions.push(`matches "${schema.pattern}"`);
  }
  
  return descriptions.join(' AND ');
}

// Edit Rule
function editRule(index) {
  if (!designerState.selectedElement || !designerState.selectedElement.rules) return;
  
  const rule = designerState.selectedElement.rules[index];
  if (!rule) return;
  
  designerState.editingRuleIndex = index;

  const promptPayload = {
    focusConfirm: false,
    template: 'template#rule-template',
    didOpen: () => {
      const cnt = document.querySelector(".swal2-container");
      if (cnt) {
        // Fill the form with rule data
        document.getElementById('rule-effect').value = rule.effect;
        document.getElementById('rule-condition-scope').value = rule.condition.scope || '';
        
        // Set schema values
        if (rule.condition.schema) {
          const schema = rule.condition.schema;
          let schemaType = '';
          let schemaValue = '';
          
          if (schema.minLength !== undefined) {
            schemaType = 'minLength';
            schemaValue = schema.minLength;
          } else if (schema.maxLength !== undefined) {
            schemaType = 'maxLength';
            schemaValue = schema.maxLength;
          } else if (schema.pattern !== undefined) {
            schemaType = 'pattern';
            schemaValue = schema.pattern;
          } else if (schema.minimum !== undefined) {
            schemaType = 'minimum';
            schemaValue = schema.minimum;
          } else if (schema.maximum !== undefined) {
            schemaType = 'maximum';
            schemaValue = schema.maximum;
          } else if (schema.const !== undefined) {
            schemaType = 'const';
            schemaValue = schema.const;
          } else if (schema.enum !== undefined) {
            schemaType = 'enum';
            schemaValue = schema.enum.join(',');
          }
          
          document.getElementById('rule-schema-type').value = schemaType;
          document.getElementById('rule-schema-value').value = schemaValue;
        }
        
        document.getElementById('rule-src-data-id').value = rule.condition.srcDataId || '';
        document.getElementById('rule-src-selector').value = rule.condition.srcSelector || '';
        document.getElementById('rule-src-property').value = rule.condition.srcProperty || '';
        document.getElementById('rule-tgt-data-id').value = rule.tgtDataId || '';
        document.getElementById('rule-tgt-selector').value = rule.tgtSelector || '';
        document.getElementById('rule-tgt-property').value = rule.tgtProperty || '';
        
        htmx.process(cnt);
        _hyperscript.processNode(cnt);
      }
    },
    callback: (result) => {
      console.log('rule-template - result:', result);
    }
  };
  wc.Prompt.notifyTemplate(promptPayload);
}

// Delete Rule
async function deleteRule(index) {
  if (!designerState.selectedElement || !designerState.selectedElement.rules) return;
  
  const result = await wc.Prompt.question({
    title: 'Confirm Delete',
    text: 'Are you are you want to delete this rule?',
    showCancelButton: true
  });
  if (result) {
    designerState.selectedElement.rules.splice(index, 1);
    updateRulesPanel(designerState.selectedElement);
  }
}

// Save Rule
function saveRule() {
  if (!designerState.selectedElement) return;
  
  const effect = document.getElementById('rule-effect').value;
  const conditionScope = document.getElementById('rule-condition-scope').value;
  const schemaType = document.getElementById('rule-schema-type').value;
  const schemaValue = document.getElementById('rule-schema-value').value;
  const srcDataId = document.getElementById('rule-src-data-id').value;
  const srcSelector = document.getElementById('rule-src-selector').value;
  const srcProperty = document.getElementById('rule-src-property').value;
  const tgtDataId = document.getElementById('rule-tgt-data-id').value;
  const tgtSelector = document.getElementById('rule-tgt-selector').value;
  const tgtProperty = document.getElementById('rule-tgt-property').value;
  
  // Create schema object
  const schema = {};
  
  if (schemaType && schemaValue) {
    switch (schemaType) {
      case 'minLength':
      case 'maxLength':
      case 'minimum':
      case 'maximum':
        schema[schemaType] = parseInt(schemaValue);
        break;
      case 'pattern':
        schema[schemaType] = schemaValue;
        break;
      case 'const':
        schema[schemaType] = schemaValue;
        break;
      case 'enum':
        schema[schemaType] = schemaValue.split(',').map(v => v.trim());
        break;
    }
  }
  
  // Create rule object
  const rule = {
    effect,
    condition: {
      scope: conditionScope,
      schema,
      srcDataId,
      srcSelector: srcSelector || undefined,
      srcProperty: srcProperty || undefined
    },
    tgtDataId,
    tgtSelector: tgtSelector || undefined,
    tgtProperty
  };
  
  // Save rule
  if (designerState.editingRuleIndex >= 0) {
    designerState.selectedElement.rules[designerState.editingRuleIndex] = rule;
  } else {
    if (!designerState.selectedElement.rules) {
      designerState.selectedElement.rules = [];
    }
    designerState.selectedElement.rules.push(rule);
  }
  
  // Update rules panel
  updateRulesPanel(designerState.selectedElement);
  
  // Close modal
  ruleModal.hide();
}

// Clear Rule Form
function clearRuleForm() {
  document.getElementById('rule-effect').value = 'SHOW';
  document.getElementById('rule-condition-scope').value = '';
  document.getElementById('rule-schema-type').value = 'minLength';
  document.getElementById('rule-schema-value').value = '';
  document.getElementById('rule-src-data-id').value = '';
  document.getElementById('rule-src-selector').value = 'input';
  document.getElementById('rule-src-property').value = 'value';
  document.getElementById('rule-tgt-data-id').value = '';
  document.getElementById('rule-tgt-selector').value = '';
  document.getElementById('rule-tgt-property').value = 'value';
}

// Save Properties - Fixed to apply changes correctly
function saveProperties() {
  if (!designerState.selectedElement) return;
  
  // Update element properties in the data model
  designerState.selectedElement.type = propType.value;
  designerState.selectedElement.label = propLabel.value;
  designerState.selectedElement.scope = propScope.value;
  designerState.selectedElement.css = propCss.value;
  designerState.selectedElement.required = propRequired.checked;
  
  // Refresh the designer to show the changes
  refreshDesigner();
}

// Refresh Designer
function refreshDesigner() {
  // Save the current selection
  const selectedId = designerState.selectedElement ? designerState.selectedElement.id : null;
  
  // Clear the designer surface
  designerSurface.innerHTML = '';
  
  // Re-add all top-level elements
  designerState.elements.forEach(element => {
    addElementToDesigner(element, designerSurface);
  });
  
  // Re-select the previously selected element
  if (selectedId) {
    selectElement(selectedId);
  }
}

// Remove Element
function removeElement(elementId) {
  if (!confirm('Are you sure you want to delete this element?')) return;
  
  // Find the element
  const element = findElementById(elementId);
  if (!element) return;
  
  // Find the parent element
  const parent = findParentElement(elementId);
  
  if (parent) {
    // Remove from parent
    parent.elements = parent.elements.filter(e => e.id !== elementId);
  } else {
    // Remove from top level
    designerState.elements = designerState.elements.filter(e => e.id !== elementId);
  }
  
  // Clear selection if the removed element was selected
  if (designerState.selectedElement && designerState.selectedElement.id === elementId) {
    designerState.selectedElement = null;
    noSelectionPanel.classList.remove('hidden');
    elementPropertiesPanel.classList.add('hidden');
    document.getElementById('rules-no-selection').classList.remove('hidden');
    document.getElementById('element-rules').classList.add('hidden');
  }
  
  // Refresh the designer
  refreshDesigner();
}

// Find Element By ID
function findElementById(elementId) {
  // First check top-level elements
  let found = designerState.elements.find(e => e.id === elementId);
  if (found) return found;
  
  // Check nested elements recursively
  const checkElements = (elements) => {
    if (!elements) return null;
    
    for (const element of elements) {
      if (element.id === elementId) return element;
      
      if (element.elements && element.elements.length > 0) {
        const nestedFound = checkElements(element.elements);
        if (nestedFound) return nestedFound;
      }
    }
    return null;
  };
  
  return checkElements(designerState.elements);
}

// Find Parent Element
function findParentElement(elementId) {
  const checkElements = (elements) => {
    if (!elements) return null;
    
    for (const element of elements) {
      if (element.elements && element.elements.some(e => e.id === elementId)) {
        return element;
      }
      
      if (element.elements && element.elements.length > 0) {
        const nestedFound = checkElements(element.elements);
        if (nestedFound) return nestedFound;
      }
    }
    return null;
  };
  
  return checkElements(designerState.elements);
}

// Load Schema
function loadSchema(schema) {
  designerState.schema = schema;
  
  // Populate schema fields
  schemaFields.innerHTML = '';
  
  // Process top-level properties
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, prop]) => {
      addSchemaField(`#/properties/${key}`, prop, schema.required);
    });
  }
  
  // Process definitions
  if (schema.$defs) {
    Object.entries(schema.$defs).forEach(([defName, def]) => {
      if (def.properties) {
        Object.entries(def.properties).forEach(([key, prop]) => {
          addSchemaField(`#/$defs/${defName}/${key}`, prop, def.required);
        });
      }
    });
  }
}

// Add Schema Field
function addSchemaField(path, prop, required) {
  const fieldItem = document.createElement('div');
  fieldItem.className = 'element-item';
  fieldItem.setAttribute('draggable', 'true');
  fieldItem.setAttribute('data-schema-field', path);
  
  // Set appropriate element type based on property type
  let elementType = 'wc-input';
  if (prop.type === 'boolean') {
    elementType = 'wc-input-checkbox';
  } else if (prop.type === 'array') {
    elementType = 'array';
  }
  
  fieldItem.setAttribute('data-element-type', elementType);
  
  // Field name
  const fieldName = path.split('/').pop();
  
  // Format display name based on path
  let displayName = fieldName;
  
  // If it's a $defs schema field, format it with parent.fieldName
  if (path.includes('$defs')) {
    const parts = path.split('/');
    if (parts.length >= 3) {
      const defName = parts[2]; // Get the definition name
      displayName = defName + '.' + fieldName;
    }
  }
  
  fieldItem.textContent = displayName;
  
  // Add required indicator
  if (required && required.includes(fieldName)) {
    const requiredSpan = document.createElement('span');
    requiredSpan.className = 'ms-1 text-danger';
    requiredSpan.textContent = '*';
    fieldItem.appendChild(requiredSpan);
  }
  
  // Add type indicator
  const typeSpan = document.createElement('span');
  typeSpan.className = 'ms-2 text-muted small';
  typeSpan.textContent = `(${prop.type})`;
  fieldItem.appendChild(typeSpan);
  
  // Set up drag event
  fieldItem.addEventListener('dragstart', e => {
    e.dataTransfer.setData('element-type', elementType);
    e.dataTransfer.setData('schema-field', path);
    e.dataTransfer.effectAllowed = 'copy';
  });
  
  schemaFields.appendChild(fieldItem);
}

//
// Preview
//

// Hide Preview
function hidePreview() {
  previewButton.src = '';
}

// Render Preview
function renderPreview() {
  generateJson();

  // previewFrame.src = 'http://localhost:8080';

  // 1. Create a form targeting the iframe
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'http://localhost:8080/gen/generate_dynamic_layout';
  form.target = 'rendered-preview';

  // 2. Add any parameters
  const jsonInput = document.createElement('input');
  jsonInput.type = 'hidden';
  jsonInput.name = 'JSONSchema';
  // jsonInput.value = schemaJson.value;
  jsonInput.value = schemaJson.editor.getValue();
  form.appendChild(jsonInput);

  const layoutInput = document.createElement('input');
  layoutInput.type = 'hidden';
  layoutInput.name = 'UILayout';
  layoutInput.value = jsonOutput.editor.getValue();
  form.appendChild(layoutInput);

  // 3. Add the form to the document, submit it, then remove it
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

// Pre Render Preview
function preRenderPreview() {
  generateJson();

  // 1. Create a form targeting the iframe
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'http://localhost:8080/gen/generate_pre_dynamic_layout';
  form.target = 'pre-rendered-preview';

  // 2. Add any parameters
  const jsonInput = document.createElement('input');
  jsonInput.type = 'hidden';
  jsonInput.name = 'JSONSchema';
  // jsonInput.value = schemaJson.value;
  jsonInput.value = schemaJson.editor.getValue();
  form.appendChild(jsonInput);

  const layoutInput = document.createElement('input');
  layoutInput.type = 'hidden';
  layoutInput.name = 'UILayout';
  layoutInput.value = jsonOutput.editor.getValue();
  form.appendChild(layoutInput);

  // 3. Add the form to the document, submit it, then remove it
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

// Set Schema
function setSchema() {
  schemaJson.editor.setValue(JSON.stringify(sampleSchema, null, 2));
}

// Generate JSON
function generateJson() {
  const json = {
    elements: designerState.elements
  };
  
  // Remove temporary IDs from final JSON
  const cleanJson = JSON.parse(JSON.stringify(json)); // Deep clone to avoid reference issues
  
  const cleanIds = (elements) => {
    if (!elements) return;
    
    elements.forEach(element => {
      delete element.id;
      if (element.elements) {
        cleanIds(element.elements);
      }
    });
  };
  
  cleanIds(cleanJson.elements);
  jsonOutput.editor.setValue(JSON.stringify(cleanJson.elements, null, 2));

  return cleanJson.elements;
}

// Copy Design to Clipboard
function copyDesign() {
  const textToCopy = jsonOutput.editor.getValue();
  
  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      const originalText = copyDesignButton.textContent;
      copyDesignButton.textContent = 'Copied!';
      
      setTimeout(() => {
        copyDesignButton.textContent = originalText;
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
      alert('Failed to copy JSON to clipboard');
    });
}

// Check if element type is a container
function isContainerElement(type) {
  return [
    'wc-tab', 'wc-tab-item', 'column', 'row', 'fieldset', 'array', 'wc-card', 'option',
    'wc-accordion', 'wc-split-button', 'wc-sidebar-left', 'wc-sidebar-right', 'wc-sidenav-left', 'wc-sidenav-right',
    'wc-timeline', 'wc-tabulator', 'wc-slideshow', 'wc-select', 'wc-form', 'wc-breadcrumb'

  ].includes(type);
}

// Generate Unique ID
function generateUniqueId() {
  return uuid.v4().substring(0, 12);
}

// Get Default Label for Element Type
function getDefaultLabel(type) {
  switch (type) {
    case 'wc-tab':
      return 'Tab Container';
    case 'wc-tab-item':
      return 'Tab Item';
    case 'column':
      return 'Column';
    case 'row':
      return 'Row';
    case 'fieldset':
      return 'Group';
    case 'array':
      return 'Array';
    case 'wc-card':
      return 'Card';
    case 'wc-input':
      return 'Input Field';
    case 'wc-input-checkbox':
      return 'Checkbox';
    case 'hr':
      return '';
    default:
      return type;
  }
}



function saveDesignToLocalStorage() {
  const designName = 'layout-ui-design';
  const jsonText = jsonOutput.editor.getValue();
  
  try {
    // Get existing saved designs
    let savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '{}');
    
    // Add/update this design
    savedDesigns[designName] = jsonText;
    
    // Save back to localStorage
    localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns));
    
    alert(`Design "${designName}" saved successfully`);
  } catch (e) {
    console.error('Error saving design to localStorage:', e);
    alert('Failed to save design to localStorage');
  }
}

function loadDesign(layoutData) {
  try {
    // Verify the data is an array (elements) or has an elements property
    let elements = Array.isArray(layoutData) ? layoutData : 
                  (layoutData.elements ? layoutData.elements : null);
    
    if (!elements) {
      throw new Error('Invalid layout structure. Expected an array or an object with an elements property.');
    }
    
    // Clear the current elements
    designerState.elements = [];
    
    // Recursively add IDs to all elements
    const addIds = (elements) => {
      if (!elements) return;
      
      elements.forEach(element => {
        element.id = generateUniqueId();
        if (element.elements) {
          addIds(element.elements);
        }
      });
    };
    
    // Add IDs to all elements
    addIds(elements);
    
    // Update the designer state
    designerState.elements = elements;
    
    // Rebuild the designer surface
    refreshDesigner();
    
    // Update the JSON output
    // jsonOutput.editor.setValue(JSON.stringify(generateJson(), null, 2));
    
    return true;
  } catch (e) {
    console.error('Error loading design:', e);
    alert('Failed to load design: ' + e.message);
    return false;
  }
}


// Initialize the designer
setTimeout(() => {
  setup();
}, 250);
