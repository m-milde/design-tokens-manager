const createdVariables = new Map();

figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import-tokens') {
    try {
      const tokenData = JSON.parse(msg.jsonData);
      await importDesignTokens(tokenData);
      figma.ui.postMessage({ type: 'success', message: 'Design tokens imported successfully!' });
    } catch (error) {
      figma.ui.postMessage({ type: 'error', message: 'Error importing tokens: ' + error.message });
    }
  }
};

async function importDesignTokens(tokenData) {
  // Clear the variable map for fresh import
  createdVariables.clear();
  
  // Get or create a local variable collection
  let collection = figma.variables.getLocalVariableCollections()[0];
  
  if (!collection) {
    collection = figma.variables.createVariableCollection('Design Tokens');
  }

  const categories = Object.keys(tokenData.tokens);
  const tokenOrder = ['primitive', 'base', 'semantic', 'specific'];
  
  // Sort categories by dependency order
  const sortedCategories = categories.sort((a, b) => {
    const aIndex = tokenOrder.indexOf(a);
    const bIndex = tokenOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  // Process tokens in dependency order
  for (const category of sortedCategories) {
    const tokens = tokenData.tokens[category];
    
    for (const token of tokens) {
      await createVariable(token, category, collection);
    }
  }
}

function createVariable(token, category, collection) {
  const variableName = category + '/' + token.name;
  
  // Determine variable type based on token type
  let variableType;
  switch (token.type.toLowerCase()) {
    case 'color':
      variableType = 'COLOR';
      break;
    case 'number':
    case 'dimension':
    case 'spacing':
      variableType = 'FLOAT';
      break;
    case 'string':
    case 'fontfamily':
      variableType = 'STRING';
      break;
    case 'boolean':
      variableType = 'BOOLEAN';
      break;
    default:
      variableType = 'STRING';
  }

  // Create the variable
  const variable = figma.variables.createVariable(variableName, collection, variableType);
  
  // Store the variable for reference resolution
  const referenceKey = category + '.' + token.name;
  createdVariables.set(referenceKey, variable);

  // Get default mode
  const defaultMode = collection.modes[0];

  // Set the variable value
  if (isReference(token.value)) {
    // Handle reference value
    const referencedVariable = resolveReference(token.value);
    if (referencedVariable) {
      const alias = {
        type: 'VARIABLE_ALIAS',
        id: referencedVariable.id
      };
      variable.setValueForMode(defaultMode.modeId, alias);
    } else {
      console.warn('Could not resolve reference: ' + token.value + ' for ' + variableName);
      // Set a fallback value
      variable.setValueForMode(defaultMode.modeId, getFallbackValue(variableType));
    }
  } else {
    // Handle literal value
    const resolvedValue = resolveLiteralValue(token.value, variableType);
    variable.setValueForMode(defaultMode.modeId, resolvedValue);
  }
}

function isReference(value) {
  return typeof value === 'string' && value.startsWith('{') && value.endsWith('}');
}

function resolveReference(reference) {
  // Remove curly braces and get the reference path
  const referencePath = reference.slice(1, -1);
  return createdVariables.get(referencePath) || null;
}

function resolveLiteralValue(value, type) {
  switch (type) {
    case 'COLOR':
      return hexToRgb(value);
    case 'FLOAT':
      return parseFloat(value);
    case 'BOOLEAN':
      return value.toLowerCase() === 'true';
    case 'STRING':
    default:
      return value;
  }
}

function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  return { r: r, g: g, b: b };
}

function getFallbackValue(type) {
  switch (type) {
    case 'COLOR':
      return { r: 0, g: 0, b: 0 };
    case 'FLOAT':
      return 0;
    case 'BOOLEAN':
      return false;
    case 'STRING':
    default:
      return '';
  }
}