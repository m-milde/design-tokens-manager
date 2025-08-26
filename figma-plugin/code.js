figma.showUI(__html__, { width: 400, height: 600 });

// Check API availability
console.log('Figma plugin loaded');
console.log('Variables API available:', !!figma.variables);
console.log('UI API available:', !!figma.ui);
console.log('Available APIs:', Object.keys(figma).filter(key => key !== 'ui' && key !== 'variables'));

figma.ui.onmessage = async (msg) => {
  console.log('Plugin received message:', msg);
  
  if (msg.type === 'connected') {
    figma.notify('✅ Connected to DTM App!');
  }
  
  if (msg.type === 'sync-manual-data') {
    try {
      figma.notify('🔄 Syncing manual data to Figma...');
      
      const tokenData = msg.data;
      console.log('Manual data received:', tokenData);
      
      // Normalize the data structure for different formats (SD, DTCG, etc.)
      const normalizedData = normalizeTokenData(tokenData);
      console.log('Normalized data:', normalizedData);
      
      // Create variable collections
      const collections = await createVariableCollections();
      console.log('Collections created:', collections);
      
      // Create variables
      const variables = await createVariables(normalizedData.tokens, collections);
      console.log('Variables created:', variables);
      
      // Debug: Check if variables were actually created
      console.log('Variables object keys:', Object.keys(variables));
      console.log('Variables object values:', variables);
      
      // Create aliases
      if (normalizedData.connections && normalizedData.connections.length > 0) {
        await createAliases(normalizedData.connections, variables);
        console.log('Aliases created');
      }
      
      figma.notify('✅ Manual data synced successfully!');
      
    } catch (error) {
      figma.notify('❌ Error syncing manual data: ' + error.message, { error: true });
      console.error('Manual sync error:', error);
    }
  }
  
  if (msg.type === 'test-connection') {
    try {
      figma.notify('🔄 Testing connection to DTM App...');
      
      const response = await fetch('http://localhost:8080/api/tokens');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      figma.notify('✅ Connection successful! Found ' + (data.tokens ? Object.keys(data.tokens).length : 0) + ' token layers');
      
      // Send success message back to UI
      figma.ui.postMessage({ type: 'connection-success', data });
      
    } catch (error) {
      figma.notify('❌ Connection failed: ' + error.message, { error: true });
      console.error('Connection test error:', error);
      
      // Send error message back to UI
      figma.ui.postMessage({ type: 'connection-error', error: error.message });
    }
  }
  
  if (msg.type === 'create-test-token') {
    try {
      figma.notify('🧪 Creating test token...');
      
      // Create a simple test collection and token
      const testCollection = figma.variables.createVariableCollection('DTM Test');
      console.log('Test collection created:', testCollection);
      console.log('Test collection type:', typeof testCollection);
      console.log('Test collection keys:', Object.keys(testCollection));
      
      const lightMode = testCollection.addMode('Light');
      const darkMode = testCollection.addMode('Dark');
      
      // Create a test color variable
      console.log('About to create test variable in collection:', testCollection);
      const testVariable = figma.variables.createVariable('test-color', 'COLOR', testCollection);
      console.log('Test variable created:', testVariable);
      
      // Set values for both modes
      const lightColor = { r: 0.2, g: 0.5, b: 1.0 };
      const darkColor = { r: 0.8, g: 0.9, b: 1.0 };
      
      testVariable.setValueForMode(lightMode.id, lightColor);
      testVariable.setValueForMode(darkMode.id, darkColor);
      
      figma.notify('✅ Test token created successfully! Check Variables panel.');
      
      // Send success message back to UI
      figma.ui.postMessage({ type: 'test-token-created' });
      
    } catch (error) {
      figma.notify('❌ Failed to create test token: ' + error.message, { error: true });
      console.error('Test token creation error:', error);
      
      // Send error message back to UI
      figma.ui.postMessage({ type: 'test-token-error', error: error.message });
    }
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
      const testVariable = figma.variables.createVariable('test-color', 'COLOR');
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

// Normalize token data from different formats (SD, DTCG, etc.)
function normalizeTokenData(data) {
  console.log('Normalizing token data:', data);
  
  // Handle different data structures
  if (data.tokens) {
    // Standard format - already normalized
    return data;
  }
  
  // Handle SD format (if different structure)
  if (data.designTokens || data.values) {
    // Convert SD format to our standard format
    return convertSDFormat(data);
  }
  
  // Handle DTCG format (if different structure)
  if (data.$schema && data.$schema.includes('dtcg')) {
    // Convert DTCG format to our standard format
    return convertDTCGFormat(data);
  }
  
  // Fallback: assume it's already in the right format
  return data;
}

function convertSDFormat(data) {
  // Convert SD format to our standard format
  // This is a placeholder - adjust based on your actual SD format
  return {
    tokens: {
      base: data.values || data.designTokens || [],
      semantic: [],
      specific: []
    },
    connections: []
  };
}

function convertDTCGFormat(data) {
  // Convert DTCG format to our standard format
  // This is a placeholder - adjust based on your actual DTCG format
  return {
    tokens: {
      base: data.tokens || data.values || [],
      semantic: [],
      specific: []
    },
    connections: data.connections || []
  };
}

function createSampleTokens() {
  return {
    tokens: {
      base: [
        { id: "token_base_1", name: "color-primary", value: "#3b82f6", type: "color", layer: "base" },
        { id: "token_base_2", name: "color-secondary", value: "#6b7280", type: "color", layer: "base" },
        { id: "token_base_3", name: "spacing-xs", value: 4, type: "spacing", layer: "base" },
        { id: "token_base_4", name: "spacing-sm", value: 8, type: "spacing", layer: "base" }
      ],
      semantic: [
        { id: "token_semantic_1", name: "color-primary-default", value: "#3b82f6", type: "color", layer: "semantic" },
        { id: "token_semantic_2", name: "color-primary-hover", value: "#1d4ed8", type: "color", layer: "semantic" },
        { id: "token_semantic_3", name: "spacing-card", value: 8, type: "spacing", layer: "semantic" }
      ],
      specific: [
        { id: "token_specific_1", name: "button-primary-bg", value: "#3b82f6", type: "color", layer: "specific" },
        { id: "token_specific_2", name: "button-primary-padding", value: 8, type: "spacing", layer: "specific" }
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
      console.log('About to call createVariableByType with:', {
        collection: collection.collection,
        collectionType: typeof collection.collection,
        collectionKeys: Object.keys(collection.collection || {}),
        token: token
      });
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
  console.log('Variables object length:', Object.keys(variables).length);
  console.log('Variables object keys:', Object.keys(variables));
  return variables;
}

function createVariableByType(collection, token) {
  console.log('=== CREATE VARIABLE DEBUG ===');
  console.log('Token:', token);
  console.log('Collection object:', collection);
  console.log('Collection type:', typeof collection);
  console.log('Collection keys:', Object.keys(collection || {}));
  console.log('Collection id:', collection && collection.id);
  console.log('Collection name:', collection && collection.name);
  
  // Normalize token type to match Figma's expected format
  let normalizedType = token.type;
  if (typeof normalizedType === 'string') {
    normalizedType = normalizedType.toLowerCase();
  }
  
  // Map DTM types to Figma types
  const typeMapping = {
    // DTM types -> Figma types
    'color': 'COLOR',
    'text': 'STRING',      // DTM Text -> Figma String
    'spacing': 'FLOAT',    // DTM Spacing -> Figma Number
    'boolean': 'BOOLEAN',
    'string': 'STRING',
    'number': 'FLOAT',
    
    // Also handle uppercase versions
    'COLOR': 'COLOR',
    'TEXT': 'STRING',
    'SPACING': 'FLOAT',
    'BOOLEAN': 'BOOLEAN',
    'STRING': 'STRING',
    'NUMBER': 'FLOAT',
    
    // Handle legacy types
    'borderRadius': 'FLOAT',
    'BORDERRADIUS': 'FLOAT'
  };
  
  const figmaType = typeMapping[normalizedType] || 'STRING';
  console.log(`Token type: ${token.type} -> Normalized: ${figmaType}`);
  
  // Create variable WITHIN the collection to avoid ID issues
  try {
    console.log('Creating variable within collection object:', collection);
    const variable = figma.variables.createVariable(token.name, figmaType, collection);
    console.log('Variable created successfully:', variable);
    return variable;
  } catch (error) {
    console.error('Failed to create variable:', error);
    throw new Error(`Failed to create variable: ${error.message}`);
  }
}

function setVariableValue(variable, token, modes) {
  if (token.value) {
    if (token.type === 'COLOR' || token.type === 'color') {
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
    
    // Handle both connection formats (source/target and from/to)
    const sourceName = connection.source || connection.from;
    const targetName = connection.target || connection.to;
    
    const sourceVariable = findVariableByName(sourceName, variables);
    const targetVariable = findVariableByName(targetName, variables);
    
    if (sourceVariable && targetVariable) {
      // Set target variable to reference source variable
      targetVariable.setValueForMode(targetVariable.defaultModeId, sourceVariable);
    }
  }
}

function findVariableByName(name, variables) {
  return variables[name] || null;
} 
