# DTMC - Technical Implementation Guide

## 🔧 **System Architecture Overview**

### **Core Components**
- **HTML5 Canvas**: High-performance 2D rendering engine
- **Event-Driven Architecture**: Mouse, keyboard, and canvas event handling
- **State Management**: Centralized state with real-time synchronization
- **Modal System**: Dynamic token creation interface

### **Data Flow**
```
User Action → Event Handler → State Update → Render → Visual Feedback
```

## 📊 **State Management**

### **Global State Variables**
```javascript
// Core data structures
let nodes = [];                    // Canvas node objects
let connections = [];              // Connection objects
let tokens = {                     // Token storage by layer
    primitive: [],
    base: [],
    semantic: [],
    specific: []
};

// UI state
let selectedNode = null;           // Currently selected node
let selectedConnection = null;     // Currently selected connection
let isDragging = false;           // Node dragging state
let isPanning = false;            // Canvas panning state
let isConnecting = false;         // Connection creation state

// Canvas state
let panOffset = { x: 0, y: 0 };   // Pan position
let lastMousePos = { x: 0, y: 0 }; // Last mouse position

// Modal state
let selectedTokenType = 'color';   // Current token type
let selectedLayer = null;          // Current layer
let undoStack = [];               // Undo history
```

## 🎯 **Connection Node Management System**

### **Connection Selection & Deletion**

#### **1. Connection Detection**
```javascript
function getConnectionAtPoint(x, y) {
    const CLICK_TOLERANCE = 8; // 8px tolerance for clicking
    
    for (const connection of connections) {
        const startPoint = getSocketPosition(connection.startNode, connection.startSocket);
        const endPoint = getSocketPosition(connection.endNode, connection.endSocket);
        
        // Calculate distance from point to line segment
        const distance = distanceToLineSegment(x, y, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
        
        if (distance <= CLICK_TOLERANCE) {
            return connection;
        }
    }
    return null;
}
```

#### **2. Line Segment Distance Calculation**
```javascript
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
        return Math.sqrt(A * A + B * B); // Point is at start
    }
    
    let param = dot / lenSq;
    
    if (param < 0) {
        return Math.sqrt(A * A + B * B); // Closest to start point
    } else if (param > 1) {
        return Math.sqrt((px - x2) * (px - x2) + (py - y2) * (py - y2)); // Closest to end point
    } else {
        // Closest point is on the line segment
        const x = x1 + param * C;
        const y = y1 + param * D;
        return Math.sqrt((px - x) * (px - x) + (py - y) * (py - y));
    }
}
```

#### **3. Connection Selection**
```javascript
// In handleMouseDown function
const clickedConnection = getConnectionAtPoint(x, y);
if (clickedConnection) {
    console.log('Clicked on connection:', clickedConnection);
    
    // Select the connection (will be drawn in red)
    selectedConnection = clickedConnection;
    selectedNode = null; // Deselect any selected node
    
    // Re-render to show selected connection
    render();
    return;
}
```

#### **4. Visual Feedback for Selected Connections**
```javascript
function drawConnection(startNode, endNode, startSocket, endSocket) {
    const startPoint = getSocketPosition(startNode, startSocket);
    const endPoint = getSocketPosition(endNode, endSocket);
    
    // Check if this connection is selected
    const isSelected = selectedConnection && 
        selectedConnection.startNode.id === startNode.id && 
        selectedConnection.endNode.id === endNode.id &&
        selectedConnection.startSocket === startSocket && 
        selectedConnection.endSocket === endSocket;
    
    // Draw selected connections in red, normal ones in blue
    if (isSelected) {
        ctx.strokeStyle = '#dc2626'; // Red for selected
        ctx.lineWidth = 5; // Thicker for selected
    } else {
        ctx.strokeStyle = '#3b82f6'; // Blue for normal
        ctx.lineWidth = 3;
    }
    
    // Create curved connection with Bezier curves
    const controlPoint1 = {
        x: startPoint.x + (endPoint.x - startPoint.x) * 0.5,
        y: startPoint.y
    };
    
    const controlPoint2 = {
        x: startPoint.x + (endPoint.x - startPoint.x) * 0.5,
        y: endPoint.y
    };
    
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.bezierCurveTo(
        controlPoint1.x, controlPoint1.y,
        controlPoint2.x, controlPoint2.y,
        endPoint.x, endPoint.y
    );
    ctx.stroke();
}
```

### **Cursor Management**
```javascript
function updateCursor(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / 1;
    const y = (e.clientY - rect.top - panOffset.y) / 1;
    
    // Check if hovering over a connection
    const connectionUnderMouse = getConnectionAtPoint(x, y);
    if (connectionUnderMouse) {
        canvas.style.cursor = 'pointer'; // Hand cursor for connections
    } else {
        canvas.style.cursor = 'grab'; // Grab cursor for canvas
    }
}
```

## 💾 **Original Value Preservation System**

### **Value Storage Strategy**

#### **1. When Creating Nodes**
```javascript
// In canvas drop handler
const newNode = {
    id: Date.now(),
    x: x - NODE_WIDTH / 2,
    y: y - NODE_HEIGHT / 2,
    name: draggedToken.name,
    value: draggedToken.value,
    type: draggedToken.type,
    layer: draggedToken.layer,
    originalValue: draggedToken.value // Store original value for restoration
};
```

#### **2. When Making Connections**
```javascript
// Store original value if not already stored
if (!socketInfo.node.originalValue) {
    socketInfo.node.originalValue = socketInfo.node.value;
    console.log(`Stored original value for ${socketInfo.node.name}: ${socketInfo.node.originalValue}`);
}

// Then update the value to reference path
const referencePath = `{${connectionStart.layer}.${connectionStart.name}}`;
socketInfo.node.value = referencePath;
```

#### **3. Value Restoration on Connection Deletion**
```javascript
function deleteSelectedConnection() {
    if (!selectedConnection) return;
    
    const startName = selectedConnection.startNode.name;
    const endName = selectedConnection.endNode.name;
    
    console.log(`Deleting connection from ${startName} to ${endName}`);
    console.log(`Target node ${endName} current value: ${selectedConnection.endNode.value}`);
    console.log(`Target node ${endName} original value: ${selectedConnection.endNode.originalValue}`);
    
    // Remove the connection
    const connectionIndex = connections.findIndex(conn => 
        conn.startNode.id === selectedConnection.startNode.id && 
        conn.endNode.id === selectedConnection.endNode.id &&
        conn.startSocket === selectedConnection.startSocket && 
        conn.endSocket === selectedConnection.endSocket
    );
    
    if (connectionIndex !== -1) {
        connections.splice(connectionIndex, 1);
        console.log(`Removed connection`);
    }
    
    // Restore the original value of the target node
    const targetNode = selectedConnection.endNode;
    
    // Find the original token value from the tokens object
    const targetLayer = targetNode.layer;
    const targetToken = tokens[targetLayer]?.find(t => t.name === targetNode.name);
    
    if (targetToken && targetNode.originalValue) {
        // Restore the node's value to its original value
        const oldValue = targetNode.value;
        targetNode.value = targetNode.originalValue;
        
        // Also restore the corresponding token in the tokens object
        targetToken.value = targetNode.originalValue;
        console.log(`Restored token ${targetLayer}.${targetNode.name}: ${oldValue} → ${targetNode.originalValue}`);
        
        // Update sidebar
        renderSidebar();
    } else {
        console.warn(`No original value found for node ${targetNode.name}, cannot restore`);
    }
    
    // Clear selection and re-render
    selectedConnection = null;
    saveState();
    render();
    
    console.log(`Successfully deleted connection from ${startName} to ${endName}`);
}
```

## ⌨️ **Keyboard Event Handling**

### **Connection Deletion with Confirmation**
```javascript
function handleKeyDown(e) {
    // Only handle Delete or Backspace keys
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    
    // Only proceed if a connection is selected
    if (!selectedConnection) return;
    
    e.preventDefault(); // Prevent default browser behavior
    
    console.log(`Delete key pressed for connection`);
    
    // Show confirmation dialog
    const startName = selectedConnection.startNode.name;
    const endName = selectedConnection.endNode.name;
    const confirmMessage = `Are you sure you want to delete the connection from "${startName}" to "${endName}"?\n\nThis will restore the original value of "${endName}".`;
    
    if (confirm(confirmMessage)) {
        console.log(`User confirmed deletion of connection`);
        deleteSelectedConnection();
    } else {
        console.log(`User cancelled deletion of connection`);
    }
}
```

## 🎨 **Enhanced Modal System**

### **Dynamic Interface Sections**
```javascript
function showAppropriateValueSection() {
    const colorSection = document.getElementById('color-token-section');
    const referenceSection = document.getElementById('reference-token-section');
    const simpleSection = document.getElementById('simple-value-section');
    
    // Hide all sections first
    colorSection.style.display = 'none';
    referenceSection.style.display = 'none';
    simpleSection.style.display = 'none';
    
    if (selectedTokenType === 'color' && selectedLayer === 'primitive') {
        // Color tokens in primitive layer show color palette
        colorSection.style.display = 'block';
    } else if (selectedLayer !== 'primitive') {
        // Non-primitive layers show reference dropdown
        referenceSection.style.display = 'block';
    } else {
        // Other token types show simple input
        simpleSection.style.display = 'block';
    }
}
```

### **Reference Dropdown Population**
```javascript
function populateReferenceDropdown() {
    const dropdown = document.getElementById('token-reference-dropdown');
    const countSpan = document.getElementById('available-tokens-count');
    
    // Clear existing options
    dropdown.innerHTML = '<option value="">Select from existing tokens...</option>';
    
    let availableTokens = [];
    
    // Collect tokens from all layers except the current one
    Object.keys(tokens).forEach(layer => {
        if (layer !== selectedLayer) {
            tokens[layer].forEach(token => {
                availableTokens.push({
                    layer: layer,
                    name: token.name,
                    value: token.value,
                    displayText: `${layer}.${token.name} (${token.value})`
                });
            });
        }
    });
    
    // Add options to dropdown
    availableTokens.forEach(token => {
        const option = document.createElement('option');
        option.value = JSON.stringify(token);
        option.textContent = token.displayText;
        dropdown.appendChild(option);
    });
    
    // Update count
    countSpan.textContent = `${availableTokens.length} tokens available`;
    
    // Add change event listener
    dropdown.onchange = function() {
        const selectedValue = this.value;
        if (selectedValue) {
            const tokenData = JSON.parse(selectedValue);
            document.getElementById('token-value-custom').value = `{${tokenData.layer}.${tokenData.name}}`;
        }
    };
}
```

## 🔄 **Event System Architecture**

### **Mouse Event Flow**
```javascript
// Mouse down event flow
handleMouseDown(e) → 
    getSocketAtPoint(x, y) → 
    getConnectionAtPoint(x, y) → 
    getNodeAtPoint(x, y) → 
    updateCursor(e) → 
    render()

// Mouse move event flow
handleMouseMove(e) → 
    updateCursor(e) → 
    render() (if dragging/connecting)

// Mouse up event flow
handleMouseUp(e) → 
    createConnection() → 
    updateTokenValues() → 
    renderSidebar() → 
    saveState() → 
    render()
```

### **Keyboard Event Flow**
```javascript
handleKeyDown(e) → 
    checkKey() → 
    showConfirmation() → 
    deleteSelectedConnection() → 
    restoreValues() → 
    updateUI() → 
    render()
```

## 📊 **Performance Optimizations**

### **Rendering Optimizations**
- **Selective Rendering**: Only re-render when necessary
- **Canvas State Management**: Proper save/restore of canvas context
- **Event Throttling**: Cursor updates are optimized for smooth performance

### **Memory Management**
- **Object References**: Efficient connection tracking without deep cloning
- **State Cleanup**: Proper cleanup of event listeners and references
- **Undo Stack Limiting**: Maximum 20 undo states to prevent memory bloat

## 🔍 **Debugging & Logging**

### **Console Logging System**
```javascript
// Connection creation logging
console.log(`Stored original value for ${socketInfo.node.name}: ${socketInfo.node.originalValue}`);
console.log(`Updated token ${targetLayer}.${socketInfo.node.name} to: ${referencePath}`);
console.log(`Reference created: ${connectionStart.name} → ${socketInfo.node.name} with path: ${referencePath}`);

// Connection deletion logging
console.log(`Deleting connection from ${startName} to ${endName}`);
console.log(`Target node ${endName} current value: ${selectedConnection.endNode.value}`);
console.log(`Target node ${endName} original value: ${selectedConnection.endNode.originalValue}`);
console.log(`Restored token ${targetLayer}.${targetNode.name}: ${oldValue} → ${targetNode.originalValue}`);
```

### **State Inspection**
```javascript
// Debug current state
console.log('Current nodes:', nodes);
console.log('Current connections:', connections);
console.log('Current tokens:', tokens);
console.log('Selected connection:', selectedConnection);
```

## 🚀 **Future Technical Enhancements**

### **Planned Improvements**
- **Zoom System**: Canvas zoom with mouse wheel and pinch gestures
- **Connection Types**: Different connection styles and validation rules
- **Token Validation**: Real-time reference validation and circular dependency detection
- **Performance**: Large token set optimization with virtual scrolling
- **Accessibility**: Screen reader support and keyboard navigation

### **Architecture Improvements**
- **Modular System**: Split into separate modules for better maintainability
- **State Management**: Implement proper state management library
- **Testing Framework**: Unit and integration tests
- **Build System**: Modern build tools and bundling
- **TypeScript**: Add type safety and better IDE support

---

**DTMC v4.0 Technical Implementation** - Advanced connection management with value preservation
