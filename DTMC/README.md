# DTMC - Enhanced Design Tokens Map Creator

A powerful, interactive web-based tool for creating, managing, and visualizing design token systems with hierarchical relationships and visual connections.

## ✨ **Latest Features (v4.4)**

### **🎯 Drag & Drop Improvements**
- **Smart Reordering**: Drag tokens by their handle (six-dot icon) to reorder within the sidebar
- **Canvas Dragging**: Drag tokens from their content area to place them on the canvas
- **Dual Functionality**: Both reordering and canvas dragging work independently
- **Visual Feedback**: Proper cursor changes and drag previews for each operation

### **🎨 Enhanced Color Picker**
- **Accurate Color Selection**: Fixed HSL to hex conversion for proper color matching
- **Visual Consistency**: Selected colors now match what you see in the picker
- **Improved Algorithm**: Enhanced color calculation with proper hue range mapping
- **Debug Logging**: Console logging for troubleshooting color issues

### **📝 Smart Text Wrapping**
- **Automatic Wrapping**: Long text automatically wraps to multiple lines within bubbles
- **10px Padding**: Text wraps when it reaches 10px from bubble borders
- **Word Breaking**: Handles very long words that don't have spaces
- **Multi-line Support**: Both token names and values support text wrapping
- **Centered Layout**: Multi-line text is properly centered within bubbles

### **🔗 Hover-Only Connection Labels**
- **Clean Interface**: Connection wire labels are hidden by default
- **Hover to Reveal**: Labels only appear when hovering over connection wires
- **Stable Layout**: No more bubble jumping when hovering over connections
- **Optimized Rendering**: Debounced rendering prevents performance issues
- **Context Preservation**: Canvas context state is properly managed

### **💾 Enhanced JSON Export & Import**
- **Complete State Export**: Includes tokens, nodes, connections, groups, and UI state
- **Canvas Position**: Saves pan offset and zoom level for exact restoration
- **Group Preservation**: All bubble groups are saved and restored with their relationships
- **UI State**: Remembers selected layer and token type for seamless workflow
- **Selection State**: Preserves selected nodes for continued work
- **Metadata Tracking**: Export includes version, date, and statistics
- **Backward Compatibility**: Can load older JSON files without groups or UI state

### **🎯 Advanced Bubble Selection System**
- **Single Selection**: Click any bubble to select it with 2px blue border
- **Multi-Selection**: Hold Ctrl/Cmd and click multiple bubbles to select them
- **Rectangle Selection**: Hold Alt and drag to draw a rectangular selection area around multiple bubbles
- **Visual Feedback**: Selected bubbles show clear 2px blue borders
- **Smart Deselection**: Click on empty canvas or other bubbles to deselect
- **Selection Persistence**: Selected bubbles are saved and restored in JSON exports

### **🎛️ Enhanced Sidebar Management**
- **Collapsible Panels**: Expand/collapse token type panels (Primitive, Base, Semantic, Specific)
- **Smooth Animations**: Arrow rotation and panel transitions
- **Space Optimization**: Hide unused panels to focus on active token types
- **Visual Indicators**: Color-coded layer indicators for easy identification

### **✏️ Token Management System**
- **Inline Rename**: Edit token names directly from the sidebar
- **Quick Delete**: Remove tokens with confirmation dialog
- **Hover Actions**: Rename and delete buttons appear on token hover
- **Comprehensive Updates**: All related nodes and connections update automatically
- **Duplicate Prevention**: Validates token names to prevent duplicates

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

### **Managing Tokens in Sidebar**
1. **Collapse Panels**: Click arrow buttons to hide/show token type panels
2. **Reorder Tokens**: Drag tokens by their drag handle (six-dot icon) to reorder within the same layer
3. **Rename Tokens**: Hover over token, click edit icon, enter new name
4. **Delete Tokens**: Hover over token, click delete icon, confirm deletion
5. **Visual Feedback**: Action buttons appear on hover with smooth transitions
6. **Automatic Updates**: All related nodes and connections update automatically

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
- **Collapse Sidebar**: Use arrow buttons to organize token panels
- **Hover Connection Labels**: Hover over connection wires to see relationship labels
- **Text Wrapping**: Long token names and values automatically wrap within bubbles

### **Bubble Selection**
- **Single Selection**: Click any bubble to select it (2px blue border)
- **Multi-Selection**: Hold Ctrl/Cmd and click multiple bubbles
- **Rectangle Selection**: Hold Alt and drag to draw rectangular selection area around bubbles
- **Deselect**: Click on empty canvas or other bubbles
- **Visual Feedback**: Selected bubbles show clear blue borders

### **Keyboard Shortcuts**
- **Ctrl+0**: Reset zoom to 100%
- **Ctrl+M**: Toggle mini-map
- **Delete/Backspace**: Delete selected connection (when connection is selected)
- **Ctrl+Click**: Multi-select bubbles
- **Alt+Drag**: Rectangle selection around bubbles

## 🔧 **Technical Architecture**

### **State Management**
- **Nodes Array**: Canvas node objects with positions and properties
- **Connections Array**: Connection objects linking nodes via sockets
- **Tokens Object**: Hierarchical token storage by layer
- **Undo Stack**: History for undo/redo functionality
- **Zoom Level**: Current canvas zoom factor (0.5x - 3.0x)
- **Pan Offset**: Canvas panning position
- **Hovered Connection**: Currently hovered connection for label display
- **Hover Render Timeout**: Debounced rendering for hover interactions
- **Dragged Token**: Current token being dragged for reordering

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
├── test-canvas-enhanced.html    # Main application file (v4.4)
├── dtmc-styles.css             # Enhanced styling with text wrapping support
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
6. **Export JSON**: Save your complete design system including groups and canvas state
7. **Load JSON**: Restore your design system exactly as you left it

## 🔍 **Troubleshooting**

### **Common Issues**
- **Nodes Not Rendering**: Check browser console for errors
- **Connections Not Working**: Ensure you're connecting output to input sockets
- **Values Not Restoring**: Check that tokens have original values stored
- **Zoom Issues**: Use reset zoom button or Ctrl+0 shortcut
- **Mini-map Not Showing**: Press Ctrl+M or click toggle button
- **Text Not Wrapping**: Check console for text wrapping debug messages
- **Color Picker Issues**: Verify browser console for color conversion errors
- **Drag & Drop Not Working**: Ensure you're dragging from the correct area (handle vs content)
- **Bubble Jumping**: Should be fixed in v4.3, check console for rendering errors
- **Groups Not Loading**: Check that JSON file contains groups array and node references are valid
- **Canvas Position Not Restored**: Verify JSON contains panOffset and zoomLevel properties
- **Export Issues**: Check browser console for export errors and ensure all data is valid
- **Selection Not Working**: Ensure you're clicking on the bubble content area, not the border
- **Rectangle Selection Issues**: Make sure to hold Alt key while dragging to create the selection rectangle
- **Multi-Selection Problems**: Verify Ctrl/Cmd key is held while clicking multiple bubbles

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
  "connections": [...],
  "groups": [...],
  "panOffset": { "x": 0, "y": 0 },
  "zoomLevel": 1.0,
  "selectedLayer": "primitive",
  "selectedTokenType": "color",
  "selectedNodes": [1234567890, 1234567891],
  "metadata": {
    "version": "4.3",
    "exportDate": "2024-01-01T00:00:00.000Z",
    "totalTokens": 10,
    "totalNodes": 5,
    "totalConnections": 3,
    "totalGroups": 1
  }
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

## 🎨 **CSS Classes & Styling**

### **New Layer-Specific Classes**
- **`.dtmc-primitive-layers`**: Styling for primitive token layer
- **`.dtmc-base-layers`**: Styling for base token layer  
- **`.dtmc-semantic-layers`**: Styling for semantic token layer
- **`.dtmc-specific-layers`**: Styling for specific token layer

### **Token Management Classes**
- **`.dtmc-token-content`**: Flexbox container for token info and actions
- **`.dtmc-token-actions`**: Container for rename/delete buttons
- **`.dtmc-token-action-btn`**: Base styles for action buttons
- **`.dtmc-rename-btn`**: Blue hover color for rename button
- **`.dtmc-delete-btn`**: Red hover color for delete button

### **Collapse/Expand Classes**
- **`.dtmc-collapse-btn`**: Collapse button styling
- **`.dtmc-collapse-icon`**: Arrow icon with rotation animation
- **`.dtmc-tokens-list.collapsed`**: Hidden state for collapsed panels

### **Drag Preview Classes**
- **`.dtmc-drag-preview`**: Styling for drag preview element

## 🔧 **Technical Implementation**

### **New JavaScript Functions**
- **`renameToken(token, layer)`**: Handles token renaming with validation
- **`deleteToken(token, layer)`**: Handles token deletion with cleanup
- **`wrapText(ctx, text, maxWidth, padding)`**: Smart text wrapping with word breaking
- **`reorderTokens(draggedToken, targetTokenName, layer)`**: Handles token reordering in sidebar
- **`updateColorPickerFromHex(hex, updateInputs)`**: Enhanced color picker with proper HSL conversion
- **`hslToHex(h, s, l)`**: Fixed HSL to hex conversion with proper hue ranges
- **Collapse/Expand Logic**: Toggle functionality for panel visibility
- **Enhanced Event Handling**: Improved drag preview initialization and hover detection

### **State Management Updates**
- **Token Validation**: Prevents duplicate names within layers
- **Comprehensive Updates**: Updates nodes, connections, and UI simultaneously
- **Error Handling**: User-friendly error messages and confirmations

---

**DTMC v4.4** - Enhanced Design Tokens Map Creator with Advanced Bubble Selection & Lasso Tools
