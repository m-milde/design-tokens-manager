# DTMC - Enhanced Design Tokens Map Creator

A powerful, interactive web-based tool for creating, managing, and visualizing design token systems with hierarchical relationships and visual connections.

## ✨ **Latest Features (v4.1)**

### **🔍 Advanced Navigation & Zoom**
- **Canvas Zoom**: Mouse wheel zoom with smooth scaling (50% - 300%)
- **Zoom Controls**: Dedicated zoom in/out buttons with percentage display
- **Reset Zoom**: One-click reset to 100% zoom and center position
- **Keyboard Shortcuts**: Ctrl+0 for reset zoom, Ctrl+M for mini-map toggle

### **🗺️ Mini-Map Navigation System**
- **Overview Map**: Real-time mini-map showing all nodes and connections
- **Click Navigation**: Click anywhere on mini-map to center viewport
- **Viewport Indicator**: Yellow rectangle shows current view area
- **Toggle Control**: Show/hide mini-map with button or Ctrl+M shortcut

### **🏷️ Enhanced Connection Visualization**
- **Connection Labels**: Clear labels showing source → target relationships
- **Visual Feedback**: Selected connections turn red with thicker lines
- **Smart Cursors**: Pointer cursor over connections, grab cursor over canvas
- **Professional Styling**: Semi-transparent labels with dark backgrounds

### **🔗 Connection Node Management (v4.0)**
- **Hover Detection**: Mouse cursor changes to pointer when hovering over connection lines
- **Click Selection**: Click on blue connection lines to select them (turns red)
- **Keyboard Deletion**: Press Delete/Backspace to remove selected connections
- **Value Restoration**: Automatically restores original token values when connections are deleted
- **Confirmation Dialogs**: Prevents accidental deletion with user confirmation

### **💾 Smart Value Preservation System (v4.0)**
- **Original Value Tracking**: Stores original values when connections are first made
- **No Generic Defaults**: Preserves real token values instead of using placeholder defaults
- **Automatic Cleanup**: Removes connections and restores values seamlessly
- **Real-time Updates**: Sidebar and canvas update immediately after changes

### **🎨 Enhanced User Experience (v4.0)**
- **Visual Feedback**: Selected connections turn red with thicker lines
- **Smooth Interactions**: Proper cursor changes and visual states
- **Professional UI**: Dark theme with smooth transitions and modern design

## 🚀 **Core Features**

### **🎨 Enhanced Token Creation Modal**
- **Dynamic Interface**: Different input sections based on token type and layer
- **Color Palette**: 16 predefined colors + custom hex input for color tokens
- **Reference System**: Dropdown to select from existing tokens in other layers
- **Smart Validation**: Ensures proper input before token creation

### **🔗 Visual Connection System**
- **Socket-based Connections**: Input (red) and Output (green) sockets on nodes
- **Reference Paths**: Automatic creation of `{layer.name}` reference paths
- **Curved Connections**: Beautiful Bezier curve connections between nodes
- **Connection Validation**: Only allows output-to-input connections

### **📱 Interactive Canvas**
- **Drag & Drop**: Tokens from sidebar to canvas
- **Node Dragging**: Move nodes around the canvas
- **Canvas Panning**: Navigate large token systems
- **Real-time Rendering**: Immediate visual updates

### **🏗️ Token Layer System**
- **Primitive Layer**: Base tokens (colors, spacing, typography)
- **Base Layer**: Tokens that reference primitives
- **Semantic Layer**: Tokens that reference base tokens
- **Specific Layer**: Application-specific tokens

## 🎯 **How to Use**

### **Creating Tokens**
1. **Select Token Type**: Choose from Color, Spacing, Typography, Number, String, Boolean
2. **Select Layer**: Choose the appropriate layer for your token
3. **Click "+ Add"**: Opens the enhanced modal
4. **Fill Details**: Use the appropriate input section for your token type
5. **Create Token**: Token appears in sidebar and can be dragged to canvas

### **Managing Connections**
1. **Drag from Output Socket**: Start from green (right/bottom) socket
2. **Connect to Input Socket**: Drop on red (left/top) socket
3. **Reference Created**: Target token shows `{layer.name}` reference path
4. **Delete Connection**: Click connection line, press Delete, confirm deletion
5. **Value Restored**: Target token returns to its original value

### **Canvas Navigation**
- **Pan**: Click and drag empty space
- **Move Nodes**: Click and drag nodes
- **Select Connections**: Click on blue connection lines
- **Delete Connections**: Select connection, press Delete/Backspace
- **Zoom**: Use mouse wheel or zoom controls
- **Mini-map**: Click to navigate, Ctrl+M to toggle

### **Keyboard Shortcuts**
- **Ctrl+0**: Reset zoom to 100%
- **Ctrl+M**: Toggle mini-map
- **Delete/Backspace**: Delete selected connection (when connection is selected)

## 🔧 **Technical Architecture**

### **State Management**
- **Nodes Array**: Canvas node objects with positions and properties
- **Connections Array**: Connection objects linking nodes via sockets
- **Tokens Object**: Hierarchical token storage by layer
- **Undo Stack**: History for undo/redo functionality
- **Zoom Level**: Current canvas zoom factor (0.5x - 3.0x)
- **Pan Offset**: Canvas panning position

### **Event System**
- **Mouse Events**: Click, drag, hover detection, wheel zoom
- **Keyboard Events**: Delete/Backspace for connection removal, shortcuts
- **Canvas Events**: Pan, zoom, node manipulation
- **Modal Events**: Token creation and management

### **Rendering System**
- **HTML5 Canvas**: High-performance 2D rendering with zoom support
- **Real-time Updates**: Immediate visual feedback
- **Responsive Design**: Adapts to different screen sizes
- **Smooth Animations**: CSS transitions and hover effects
- **Mini-map**: Separate canvas for navigation overview

## 📁 **File Structure**

```
DTMC/
├── test-canvas-enhanced.html    # Main application file (v4.1)
├── README.md                    # This documentation
├── TECHNICAL.md                 # Technical implementation details
├── UPGRADE-GUIDE.md            # Manual upgrade instructions
├── enhanced-modal.html          # Standalone modal component
├── enhanced-modal.css           # Modal styles
├── enhanced-modal.js            # Modal functionality
└── upgrade-script.js            # Browser console helper
```

## 🚀 **Getting Started**

1. **Download Files**: Get the complete DTMC package
2. **Open in Browser**: Open `test-canvas-enhanced.html` directly
3. **Create Tokens**: Use the enhanced modal to create your first tokens
4. **Build System**: Drag tokens to canvas and connect them
5. **Navigate**: Use zoom controls and mini-map for large systems
6. **Export JSON**: Save your design system for use in other tools

## 🔍 **Troubleshooting**

### **Common Issues**
- **Nodes Not Rendering**: Check browser console for errors
- **Connections Not Working**: Ensure you're connecting output to input sockets
- **Values Not Restoring**: Check that tokens have original values stored
- **Zoom Issues**: Use reset zoom button or Ctrl+0 shortcut
- **Mini-map Not Showing**: Press Ctrl+M or click toggle button

### **Browser Compatibility**
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Canvas Support**: Requires HTML5 Canvas support
- **JavaScript ES6**: Uses modern JavaScript features
- **Wheel Events**: Mouse wheel zoom requires wheel event support

## 🎨 **Design System Integration**

### **JSON Export Format**
```json
{
  "tokens": {
    "primitive": [...],
    "base": [...],
    "semantic": [...],
    "specific": [...]
  },
  "nodes": [...],
  "connections": [...]
}
```

### **Token Reference Format**
- **Primitive**: `#ff0000`, `16px`, `24px`
- **Base**: `{primitive.primary-color}`
- **Semantic**: `{base.brand-color}`
- **Specific**: `{semantic.button-primary}`

## 🔮 **Future Enhancements**

- **Connection Types**: Different connection styles and validation rules
- **Token Validation**: Real-time validation of token references
- **Collaboration**: Multi-user editing capabilities
- **Version Control**: Token system versioning and branching
- **Performance**: Large token set optimization with virtual scrolling
- **Accessibility**: Screen reader support and enhanced keyboard navigation

## 📞 **Support & Contributing**

This is an open-source project designed for design system professionals. Feel free to:
- **Report Issues**: Document bugs or feature requests
- **Suggest Improvements**: Propose new features or enhancements
- **Share Examples**: Show how you're using DTMC in your projects

---

**DTMC v4.1** - Enhanced Design Tokens Map Creator with Advanced Navigation & Zoom Controls
