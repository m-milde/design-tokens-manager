// This plugin creates variables from design tokens JSON

figma.showUI(__html__, { width: 320, height: 500 });

// Store references for token relationships
const tokenReferences = new Map();
const createdVariables = new Map();

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import-tokens') {
    try {
      await importTokens(msg.tokens);
      figma.ui.postMessage({
        pluginMessage: {
          type: 'import-result',
          success: true,
          message: 'Tokens imported successfully!'
        }
      });
    } catch (error) {
      console.error('Error importing tokens:', error);
      figma.ui.postMessage({
        pluginMessage: {
          type: 'import-result',
          success: false,
          message: `Error importing tokens: ${error.message}`
        }
      });
    }
  }
};

async function importTokens(tokensData) {
  // Create or get the local variable collection
  let collection = figma.variables.getLocalVariableCollections()[0];
  
  if (!collection) {
    collection = figma.variables.createVariableCollection('Design Tokens');
  }

  // Create default mode if it doesn't exist
  let mode = collection.modes[0];
  if (!mode) {
    mode = collection.modes[0];
  }

  // Process tokens recursively
  await processTokens(tokensData, collection, mode.modeId, '');
  
  // Resolve token references after all variables are created
  await resolveTokenReferences(mode.modeId);
}

async function processTokens(tokens, collection, modeId, prefix = '') {
  for (const [key, value] of Object.entries(tokens)) {
    const tokenPath = prefix ? `${prefix}/${key}` : key;
    
    if (isTokenValue(value)) {
      // This is a token with a value
      await createVariable(tokenPath, value, collection, modeId);
    } else if (typeof value === 'object' && value !== null) {
      // This is a group of tokens, process recursively
      await processTokens(value, collection, modeId, tokenPath);
    }
  }
}

function isTokenValue(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value.hasOwnProperty('$value') || value.hasOwnProperty('value'))
  );
}

async function createVariable(name, tokenData, collection, modeId) {
  try {
    const value = tokenData.$value || tokenData.value;
    const type = tokenData.$type || tokenData.type || inferType(value);
    const description = tokenData.$description || tokenData.description || '';
    
    // Determine variable type
    let variableType;
    let processedValue = value;
    
    switch (type) {
      case 'color':
        variableType = 'COLOR';
        processedValue = parseColor(value);
        break;
      case 'dimension':
      case 'spacing':
      case 'size':
      case 'number':
        variableType = 'FLOAT';
        processedValue = parseNumber(value);
        break;
      case 'fontFamily':
      case 'fontWeight':
      case 'string':
        variableType = 'STRING';
        processedValue = String(value);
        break;
      case 'boolean':
        variableType = 'BOOLEAN';
        processedValue = Boolean(value);
        break;
      default:
        // Try to infer from value
        if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb'))) {
          variableType = 'COLOR';
          processedValue = parseColor(value);
        } else if (typeof value === 'number') {
          variableType = 'FLOAT';
          processedValue = value;
        } else if (typeof value === 'boolean') {
          variableType = 'BOOLEAN';
          processedValue = value;
        } else {
          variableType = 'STRING';
          processedValue = String(value);
        }
    }

    // Create variable
    const variable = figma.variables.createVariable(name, collection.id, variableType);
    
    if (description) {
      variable.description = description;
    }

    // Check if value is a reference to another token
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      // This is a reference - store it for later resolution
      const referencePath = value.slice(1, -1); // Remove { }
      tokenReferences.set(variable.id, { referencePath, modeId });
    } else {
      // Set the value directly
      variable.setValueForMode(modeId, processedValue);
    }

    createdVariables.set(name, variable);
    
  } catch (error) {
    console.error(`Error creating variable ${name}:`, error);
    throw error;
  }
}

async function resolveTokenReferences(modeId) {
  for (const [variableId, { referencePath }] of tokenReferences) {
    try {
      const variable = figma.variables.getVariableById(variableId);
      const referencedVariable = findVariableByPath(referencePath);
      
      if (referencedVariable) {
        // Create alias to the referenced variable
        const alias = figma.variables.createVariableAlias(referencedVariable);
        variable.setValueForMode(modeId, alias);
      } else {
        console.warn(`Could not find referenced variable: ${referencePath}`);
      }
    } catch (error) {
      console.error(`Error resolving reference for variable ${variableId}:`, error);
    }
  }
}

function findVariableByPath(path) {
  // Convert path to variable name format
  const variableName = path.replace(/\./g, '/');
  return createdVariables.get(variableName);
}

function inferType(value) {
  if (typeof value === 'string') {
    if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
      return 'color';
    }
    if (value.match(/^\d+(\.\d+)?(px|rem|em|%|pt)$/)) {
      return 'dimension';
    }
    return 'string';
  } else if (typeof value === 'number') {
    return 'number';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  }
  return 'string';
}

function parseColor(colorValue) {
  if (typeof colorValue !== 'string') return { r: 0, g: 0, b: 0 };

  // Handle hex colors
  if (colorValue.startsWith('#')) {
    const hex = colorValue.slice(1);
    let r, g, b;
    
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return { r: 0, g: 0, b: 0 };
    }
    
    return { r: r / 255, g: g / 255, b: b / 255 };
  }

  // Handle rgb() colors
  if (colorValue.startsWith('rgb(')) {
    const match = colorValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]) / 255,
        g: parseInt(match[2]) / 255,
        b: parseInt(match[3]) / 255
      };
    }
  }

  // Default to black if can't parse
  return { r: 0, g: 0, b: 0 };
}

function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove units and parse as float
    const numericValue = parseFloat(value.replace(/[a-zA-Z%]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
  }
  return 0;
}