figma.showUI(__html__, { width: 400, height: 600 });

// Check API availability
console.log('Figma plugin loaded');
console.log('Variables API available:', !!figma.variables);
console.log('UI API available:', !!figma.ui);
console.log('Available APIs:', Object.keys(figma).filter(key => key !== 'ui' && key !== 'variables'));

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'connected') {
    figma.notify('✅ Connected to DTM App!');
  }
  
  if (msg.type === 'sync-tokens') {
    try {
      figma.notify('🔄 Syncing tokens to Figma...');
      
      // For local development, we'll create sample tokens directly
      // In production, this would fetch from your DTM app
      const sampleTokens = createSampleTokens();
      console.log('Sample tokens created:', sampleTokens);
      
      // Create variable collections
      const collections = await createVariableCollections();
      console.log('Collections created:', collections);
      
      // Create variables
      const variables = await createVariables(sampleTokens.tokens, collections);
      console.log('Variables created:', variables);
      
      // Create aliases
      await createAliases(sampleTokens.connections, variables);
      console.log('Aliases created');
      
      figma.notify('✅ Tokens synced successfully!');
      
    } catch (error) {
      figma.notify('❌ Error syncing tokens: ' + error.message, { error: true });
      console.error('Sync error:', error);
    }
  }
  
  if (msg.type === 'disconnected') {
    figma.notify('❌ Disconnected from DTM App');
  }
  
  if (msg.type === 'simple-test') {
    try {
      figma.notify('🧪 Running simple test...');
      
      // First, just check if we can access Figma object
      console.log('Figma object:', figma);
      console.log('Figma type:', typeof figma);
      
      // Check if variables API is available
      if (!figma.variables) {
        throw new Error('Variables API not available');
      }
      
      console.log('Variables API available:', figma.variables);
      console.log('Variables API type:', typeof figma.variables);
      
      // Try to access methods directly instead of using Object.keys
      console.log('=== DIRECT METHOD ACCESS ===');
      console.log('createVariableCollection exists:', typeof figma.variables.createVariableCollection);
      console.log('getLocalVariables exists:', typeof figma.variables.getLocalVariables);
      console.log('getVariableById exists:', typeof figma.variables.getVariableById);
      
      // Check if createVariableCollection method exists
      if (typeof figma.variables.createVariableCollection !== 'function') {
        console.log('createVariableCollection not found, trying alternative methods...');
        
        // Try alternative method names that might exist
        const possibleMethods = [
          'createCollection',
          'createVariableCollection',
          'addCollection',
          'newCollection'
        ];
        
        for (let i = 0; i < possibleMethods.length; i++) {
          const methodName = possibleMethods[i];
          if (figma.variables[methodName]) {
            console.log('Found alternative method: ' + methodName);
            break;
          }
        }
        
        throw new Error('createVariableCollection method not available');
      }
      
      // Create a simple test collection
      const testCollection = figma.variables.createVariableCollection('DTM Test');
      console.log('Test collection created:', testCollection);
      
      const lightMode = testCollection.addMode('Light');
      console.log('Light mode added:', lightMode);
      
      // Create a simple color variable
      const testVariable = testCollection.createVariable('test-color', 'COLOR');
      console.log('Test variable created:', testVariable);
      
      // Set the color value (RGB values between 0 and 1)
      const colorValue = { r: 0.2, g: 0.5, b: 1.0 };
      testVariable.setValueForMode(lightMode.id, colorValue);
      console.log('Color value set:', colorValue);
      
      figma.notify('✅ Simple test successful! Check Variables panel.');
      
    } catch (error) {
      figma.notify('❌ Simple test failed: ' + error.message, { error: true });
      console.error('Simple test error:', error);
      
      // Log more details about the error
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        figmaVariables: !!figma.variables,
        createVariableCollection: figma.variables && typeof figma.variables.createVariableCollection,
        getLocalVariables: figma.variables && typeof figma.variables.getLocalVariables
      });
    }
  }
  
  if (msg.type === 'test-local-connection') {
    try {
      figma.notify('🔄 Testing local connection...');
      
      // Try to fetch from localhost (this might work in some cases)
      const response = await fetch('http://localhost:8080/api/tokens');
      const data = await response.json();
      
      figma.notify('✅ Local connection successful!');
      
      // Now sync the real tokens
      const collections = await createVariableCollections();
      const variables = await createVariables(data.tokens, collections);
      await createAliases(data.connections, variables);
      
      figma.notify('✅ Real tokens synced successfully!');
      
    } catch (error) {
      figma.notify('❌ Local connection failed: ' + error.message, { error: true });
      console.error('Local connection error:', error);
      
      // Fallback to sample tokens
      figma.notify('🔄 Falling back to sample tokens...');
      const sampleTokens = createSampleTokens();
      const collections = await createVariableCollections();
      const variables = await createVariables(sampleTokens.tokens, collections);
      await createAliases(sampleTokens.connections, variables);
      figma.notify('✅ Sample tokens synced successfully!');
    }
  }
};

function createSampleTokens() {
  return {
    tokens: {
      base: [
        { id: "token_base_1", name: "color-primary", value: "#3b82f6", type: "COLOR", layer: "base" },
        { id: "token_base_2", name: "color-secondary", value: "#6b7280", type: "COLOR", layer: "base" },
        { id: "token_base_3", name: "spacing-xs", value: 4, type: "FLOAT", layer: "base" },
        { id: "token_base_4", name: "spacing-sm", value: 8, type: "FLOAT", layer: "base" }
      ],
      semantic: [
        { id: "token_semantic_1", name: "color-primary-default", value: "#3b82f6", type: "COLOR", layer: "semantic" },
        { id: "token_semantic_2", name: "color-primary-hover", value: "#1d4ed8", type: "COLOR", layer: "semantic" },
        { id: "token_semantic_3", name: "spacing-card", value: 8, type: "FLOAT", layer: "semantic" }
      ],
      specific: [
        { id: "token_specific_1", name: "button-primary-bg", value: "#3b82f6", type: "COLOR", layer: "specific" },
        { id: "token_specific_2", name: "button-primary-padding", value: 8, type: "FLOAT", layer: "specific" }
      ]
    },
    connections: [
      { source: "color-primary", target: "color-primary-default" },
      { source: "color-primary", target: "button-primary-bg" },
      { source: "spacing-sm", target: "button-primary-padding" }
    ]
  };
}

async function createVariableCollections() {
  const collections = {};
  
  // Create base collection
  const baseCollection = figma.variables.createVariableCollection('DTM - Base');
  console.log('Base collection created:', baseCollection);
  console.log('Base collection methods:', Object.keys(baseCollection));
  console.log('Base collection prototype:', Object.getPrototypeOf(baseCollection));
  
  const lightMode = baseCollection.addMode('Light');
  const darkMode = baseCollection.addMode('Dark');
  
  collections.base = {
    collection: baseCollection,
    lightMode,
    darkMode
  };
  
  // Create semantic collection
  const semanticCollection = figma.variables.createVariableCollection('DTM - Semantic');
  console.log('Semantic collection created:', semanticCollection);
  console.log('Semantic collection methods:', Object.keys(semanticCollection));
  
  const semanticLightMode = semanticCollection.addMode('Light');
  const semanticDarkMode = semanticCollection.addMode('Dark');
  
  collections.semantic = {
    collection: semanticCollection,
    lightMode: semanticLightMode,
    darkMode: semanticDarkMode
  };
  
  // Create specific collection
  const specificCollection = figma.variables.createVariableCollection('DTM - Specific');
  console.log('Specific collection created:', specificCollection);
  console.log('Specific collection methods:', Object.keys(specificCollection));
  
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
  
  // Flatten all tokens from all layers
  const allTokens = [
    ...tokens.base || [],
    ...tokens.semantic || [],
    ...tokens.specific || []
  ];
  
  console.log('All tokens to process:', allTokens);
  
  for (let i = 0; i < allTokens.length; i++) {
    const token = allTokens[i];
    try {
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
      
      console.log('Processing token: ' + token.name + ' (' + token.layer + ')');
      
      // Create variable based on type
      const variable = createVariableByType(collection.collection, token);
      console.log('Variable created for ' + token.name + ':', variable);
      
      // Set values for light and dark modes
      setVariableValue(variable, token, {
        light: collection.lightMode,
        dark: collection.darkMode
      });
      
      variables[token.name] = variable;
      console.log('Variable ' + token.name + ' added to variables object');
      
    } catch (error) {
      console.error('Error processing token ' + token.name + ':', error);
      figma.notify('❌ Error creating variable for ' + token.name + ': ' + error.message, { error: true });
    }
  }
  
  console.log('Final variables object:', variables);
  return variables;
}

function createVariableByType(collection, token) {
  console.log('=== CREATE VARIABLE DEBUG ===');
  console.log('Collection object:', collection);
  console.log('Collection type:', typeof collection);
  console.log('Collection methods:', Object.keys(collection));
  console.log('Collection prototype:', Object.getPrototypeOf(collection));
  
  // The collection object seems to be missing methods, let's try using figma.variables directly
  console.log('Trying figma.variables.createVariable...');
  
  if (typeof figma.variables.createVariable === 'function') {
    console.log('Using figma.variables.createVariable');
    console.log('Collection object:', collection);
    console.log('Collection type:', typeof collection);
    
    // The error message says: "Please pass the collection node instead"
    // So we should pass the collection object, not the ID
    try {
      // Pass the collection object directly
      switch (token.type) {
        case 'COLOR':
          return figma.variables.createVariable(token.name, 'COLOR', collection);
        case 'FLOAT':
          return figma.variables.createVariable(token.name, 'FLOAT', collection);
        case 'TEXT':
          return figma.variables.createVariable(token.name, 'TEXT', collection);
        default:
          return figma.variables.createVariable(token.name, 'TEXT', collection);
      }
    } catch (error) {
      console.log('Creating with collection object failed:', error.message);
      
      // Try without collection parameter (maybe it's not needed)
      try {
        console.log('Trying without collection parameter...');
        switch (token.type) {
          case 'COLOR':
            return figma.variables.createVariable(token.name, 'COLOR');
          case 'FLOAT':
            return figma.variables.createVariable(token.name, 'FLOAT');
          case 'TEXT':
            return figma.variables.createVariable(token.name, 'TEXT');
          default:
            return figma.variables.createVariable(token.name, 'TEXT');
        }
      } catch (error2) {
        console.log('Creating without collection parameter also failed:', error2.message);
        throw error2;
      }
    }
  }
  
  // If that doesn't work, try alternative approaches
  console.log('figma.variables.createVariable not available, trying alternatives...');
  
  // Check what methods are available on figma.variables
  console.log('Available figma.variables methods:', Object.keys(figma.variables));
  
  // Try to find any method that might create variables
  const possibleMethods = ['createVariable', 'addVariable', 'newVariable', 'create'];
  for (let i = 0; i < possibleMethods.length; i++) {
    const methodName = possibleMethods[i];
    if (figma.variables[methodName]) {
      console.log('Found alternative method: ' + methodName);
      try {
        return figma.variables[methodName](token.name, 'COLOR', collection);
      } catch (e) {
        console.log('Method ' + methodName + ' failed:', e);
      }
    }
  }
  
  throw new Error('No method found to create variables. Collection methods: ' + Object.keys(collection).join(', ') + '. Figma.variables methods: ' + Object.keys(figma.variables).join(', '));
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
  if (value.indexOf('#') === 0) {
    const hex = value.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return { r, g, b };
  }
  
  // Handle rgb colors
  if (value.indexOf('rgb(') === 0) {
    const match = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1]) / 255;
      const g = parseInt(match[2]) / 255;
      const b = parseInt(match[3]) / 255;
      return { r, g, b };
    }
  }
  
  // Handle hsl colors
  if (value.indexOf('hsl(') === 0) {
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
  for (let i = 0; i < connections.length; i++) {
    const connection = connections[i];
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
