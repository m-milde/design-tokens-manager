figma.showUI(__html__, { width: 400, height: 600 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'connected') {
    figma.notify('✅ Connected to DTM App!');
  }
  
  if (msg.type === 'sync-tokens') {
    try {
      figma.notify('🔄 Syncing tokens to Figma...');
      
      // Get token data from DTM app
      const response = await fetch('http://localhost:8080/api/tokens');
      const tokenData = await response.json();
      
      // Create variable collections
      const collections = await createVariableCollections();
      
      // Create variables
      const variables = await createVariables(tokenData.tokens, collections);
      
      // Create aliases
      await createAliases(tokenData.connections, variables);
      
      figma.notify('✅ Tokens synced successfully!');
      
    } catch (error) {
      figma.notify(`❌ Error syncing tokens: ${error.message}`, { error: true });
      console.error('Sync error:', error);
    }
  }
  
  if (msg.type === 'disconnected') {
    figma.notify('❌ Disconnected from DTM App');
  }
};

async function createVariableCollections() {
  const collections = {};
  
  // Create base collection
  const baseCollection = figma.variables.createVariableCollection('DTM - Base');
  const lightMode = baseCollection.addMode('Light');
  const darkMode = baseCollection.addMode('Dark');
  
  collections.base = {
    collection: baseCollection,
    lightMode,
    darkMode
  };
  
  // Create semantic collection
  const semanticCollection = figma.variables.createVariableCollection('DTM - Semantic');
  const semanticLightMode = semanticCollection.addMode('Light');
  const semanticDarkMode = semanticCollection.addMode('Dark');
  
  collections.semantic = {
    collection: semanticCollection,
    lightMode: semanticLightMode,
    darkMode: semanticDarkMode
  };
  
  // Create specific collection
  const specificCollection = figma.variables.createVariableCollection('DTM - Specific');
  const specificLightMode = specificCollection.addMode('Light');
  const specificDarkMode = specificCollection.addMode('Dark');
  
  collections.specific = {
    collection: specificCollection,
    lightMode: specificLightMode,
    darkMode: specificDarkMode
  };
  
  return collections;
}

async function createVariables(tokens, collections) {
  const variables = {};
  
  for (const token of tokens) {
    let collection;
    
    // Determine which collection to use based on token layer
    if (token.layer === 'base') {
      collection = collections.base;
    } else if (token.layer === 'semantic') {
      collection = collections.semantic;
    } else if (token.layer === 'specific') {
      collection = collections.specific;
    } else {
      collection = collections.base; // fallback
    }
    
    // Create variable based on type
    const variable = createVariableByType(collection.collection, token);
    
    // Set values for light and dark modes
    setVariableValue(variable, token, {
      light: collection.lightMode,
      dark: collection.darkMode
    });
    
    variables[token.name] = variable;
  }
  
  return variables;
}

function createVariableByType(collection, token) {
  switch (token.type) {
    case 'COLOR':
      return collection.createVariable(token.name, 'COLOR');
    case 'FLOAT':
      return collection.createVariable(token.name, 'FLOAT');
    case 'TEXT':
      return collection.createVariable(token.name, 'TEXT');
    default:
      return collection.createVariable(token.name, 'TEXT');
  }
}

function setVariableValue(variable, token, modes) {
  if (token.value) {
    if (token.type === 'COLOR') {
      const colorValue = parseColorValue(token.value);
      if (colorValue) {
        variable.setValueForMode(modes.light.id, colorValue);
        variable.setValueForMode(modes.dark.id, colorValue);
      }
    } else {
      variable.setValueForMode(modes.light.id, token.value);
      variable.setValueForMode(modes.dark.id, token.value);
    }
  }
}

function parseColorValue(value) {
  if (typeof value !== 'string') return null;
  
  // Handle hex colors
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return { r, g, b };
  }
  
  // Handle rgb colors
  if (value.startsWith('rgb(')) {
    const match = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1]) / 255;
      const g = parseInt(match[2]) / 255;
      const b = parseInt(match[3]) / 255;
      return { r, g, b };
    }
  }
  
  // Handle hsl colors
  if (value.startsWith('hsl(')) {
    const match = value.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseInt(match[2]) / 100;
      const l = parseInt(match[3]) / 100;
      const rgb = hslToRgb(h, s, l);
      return { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 };
    }
  }
  
  return null;
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r, g, b;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

async function createAliases(connections, variables) {
  for (const connection of connections) {
    const sourceVariable = findVariableByName(connection.source, variables);
    const targetVariable = findVariableByName(connection.target, variables);
    
    if (sourceVariable && targetVariable) {
      // Set target variable to reference source variable
      targetVariable.setValueForMode(targetVariable.defaultModeId, sourceVariable);
    }
  }
}

function findVariableByName(name, variables) {
  return variables[name] || null;
}

