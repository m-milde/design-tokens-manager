figma.showUI(__html__, { width: 500, height: 400 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'export-tokens') {
    try {
      const exportedTokens = await exportDesignTokens();
      figma.ui.postMessage({ 
        type: 'export-complete', 
        data: exportedTokens 
      });
    } catch (error) {
      figma.ui.postMessage({ 
        type: 'error', 
        message: 'Error exporting tokens: ' + error.message 
      });
    }
  }
};

async function exportDesignTokens() {
  const collections = figma.variables.getLocalVariableCollections();
  
  if (collections.length === 0) {
    throw new Error('No variable collections found in this file');
  }

  // Use the first collection or find one named "Design Tokens"
  let targetCollection = collections.find(c => c.name === 'Design Tokens') || collections[0];
  
  const variables = targetCollection.variableIds.map(id => figma.variables.getVariableById(id));
  const exportData = {
    tokens: {
      primitive: [],
      base: [],
      semantic: [],
      specific: []
    }
  };

  // Group variables by category based on their names
  const categorizedVariables = {
    primitive: [],
    base: [],
    semantic: [],
    specific: [],
    other: []
  };

  // Categorize variables
  variables.forEach(variable => {
    if (!variable) return;
    
    const nameParts = variable.name.split('/');
    const category = nameParts[0].toLowerCase();
    const tokenName = nameParts.slice(1).join('/');
    
    if (categorizedVariables.hasOwnProperty(category)) {
      categorizedVariables[category].push({
        variable: variable,
        tokenName: tokenName,
        category: category
      });
    } else {
      categorizedVariables.other.push({
        variable: variable,
        tokenName: variable.name,
        category: 'other'
      });
    }
  });

  // Process each category
  for (const [category, variableList] of Object.entries(categorizedVariables)) {
    if (category === 'other' || variableList.length === 0) continue;
    
    for (const varInfo of variableList) {
      const token = await processVariable(varInfo.variable, varInfo.tokenName, targetCollection);
      if (token) {
        exportData.tokens[category].push(token);
      }
    }
  }

  // Add 'other' category if there are uncategorized variables
  if (categorizedVariables.other.length > 0) {
    exportData.tokens.other = [];
    for (const varInfo of categorizedVariables.other) {
      const token = await processVariable(varInfo.variable, varInfo.tokenName, targetCollection);
      if (token) {
        exportData.tokens.other.push(token);
      }
    }
  }

  // Clean up empty categories
  Object.keys(exportData.tokens).forEach(key => {
    if (exportData.tokens[key].length === 0) {
      delete exportData.tokens[key];
    }
  });

  return exportData;
}

async function processVariable(variable, tokenName, collection) {
  if (!variable) return null;

  const defaultMode = collection.modes[0];
  const value = variable.valuesByMode[defaultMode.modeId];
  
  let tokenValue;
  let tokenType = getTokenType(variable.resolvedType);

  if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    // This is a reference to another variable
    const referencedVariable = figma.variables.getVariableById(value.id);
    if (referencedVariable) {
      tokenValue = convertVariableToReference(referencedVariable);
    } else {
      tokenValue = '{unknown.reference}';
    }
  } else {
    // This is a literal value
    tokenValue = convertLiteralValue(value, variable.resolvedType);
  }

  return {
    name: tokenName,
    value: tokenValue,
    type: tokenType
  };
}

function convertVariableToReference(variable) {
  // Convert variable name back to reference format
  const nameParts = variable.name.split('/');
  const category = nameParts[0].toLowerCase();
  const tokenName = nameParts.slice(1).join('-').replace(/\//g, '-');
  
  return '{' + category + '.' + tokenName + '}';
}

function convertLiteralValue(value, type) {
  switch (type) {
    case 'COLOR':
      if (value && typeof value === 'object' && 'r' in value) {
        return rgbToHex(value);
      }
      return '#000000';
    case 'FLOAT':
      return typeof value === 'number' ? value : 0;
    case 'BOOLEAN':
      return typeof value === 'boolean' ? value.toString() : 'false';
    case 'STRING':
    default:
      return typeof value === 'string' ? value : '';
  }
}

function rgbToHex(rgb) {
  const r = Math.round(rgb.r * 255);
  const g = Math.round(rgb.g * 255);
  const b = Math.round(rgb.b * 255);
  
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function getTokenType(figmaType) {
  switch (figmaType) {
    case 'COLOR':
      return 'color';
    case 'FLOAT':
      return 'number';
    case 'BOOLEAN':
      return 'boolean';
    case 'STRING':
    default:
      return 'string';
  }
}