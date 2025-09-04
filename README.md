# DTMC - Design Tokens Map Creator

A comprehensive application for building, visualizing, importing, and exporting design tokens with hierarchical relationships and property inheritance.

## 🎯 **Project Overview**

DTMC is a powerful design token management system that allows designers and developers to create, organize, and manage design tokens across multiple hierarchical levels. The application provides a visual canvas interface for connecting tokens and managing their relationships with advanced features for professional design workflows.

## 🏗️ **Token Hierarchy Levels**

The system supports flexible token hierarchies:

- **Primitive** (minimum level) - Basic design values
- **Base** (optional) - Foundation tokens
- **Semantic** (optional) - Meaningful abstractions
- **Specific** (optional) - Context-specific implementations

## ✨ **Core Features**

### 🎨 **Visual Interface**
- **Token Creation & Management** via intuitive sidebar interface
- **Visual Canvas** with smart input/output sockets for connections
- **Real-time Token Synchronization** - changes in sidebar instantly reflect on canvas
- **Smart Connection Wires** - automatically connect to optimal sockets based on node positions
- **Bidirectional Connection Detection** - wires appear regardless of token creation order

### 🔗 **Connection System**
- **Automatic Wire Creation** - connections appear automatically when referencing tokens are added to canvas
- **Smart Socket Positioning** - wires connect to side sockets for horizontal layouts, top/bottom for vertical
- **Order-Independent Connections** - wires appear when both connected tokens are on canvas, regardless of creation order
- **Consolidated Group Connections** - collapsed groups show single connection points, expanded groups reconnect to individual tokens

### 📦 **Group Management**
- **Advanced Grouping System** for organizing tokens on canvas
- **Collapsible Groups** with dynamic width adjustment
- **Group Dragging** - move entire groups with all contained tokens
- **Group State Persistence** - collapsed/expanded states maintained after JSON loading
- **Visual Group Indicators** - clear visual representation of group boundaries

### 💾 **Data Management**
- **Enhanced Undo/Redo System** - 30 steps in both directions with complete state preservation
- **Session Management** - save and load complete setups with metadata
- **JSON Import/Export** - comprehensive data exchange with external systems
- **State Persistence** - all changes automatically saved to localStorage

### 🎛️ **User Interface**
- **Collapsible Sidebar** - maximize canvas space when needed
- **Full-Width Canvas** - automatically expands when sidebar is collapsed
- **Vertical Menu System** - organized controls with three-dots menu
- **Always-Visible Controls** - Undo, Redo, and Delete always accessible
- **Responsive Design** - adapts to different screen sizes

## 🎨 **User Interface**

### **Main Layout**
- **Left Sidebar**: Token types, layers, and groups management with collapsible functionality
- **Main Canvas**: Visual representation of connected tokens with full-width expansion
- **Top Controls**: Always-visible Undo, Redo, Delete buttons + organized menu system
- **Interactive Controls**: Zoom, pan, and canvas manipulation with mini-map

### **Control System**
- **Always Visible**: Undo (↶), Redo (↷), Delete (🗑️) buttons
- **Vertical Menu**: Three-dots menu containing:
  - 💾 Save current setup
  - 📁 Load setup  
  - ⬇️ Export JSON
  - 📄 Load JSON
- **Smart Positioning**: Controls automatically adjust when sidebar is collapsed

## 📁 **Project Structure**

```
DTMC/
├── test-canvas-enhanced.html # Main application file (enhanced version)
├── dtmc-styles.css          # Comprehensive CSS styling
├── README.md                # Project documentation
├── package.json             # Dependencies and scripts
└── src/
    ├── components/          # Reusable UI components
    ├── utils/              # Helper functions and utilities
    ├── data/               # Data models and sample data
    └── styles/             # CSS and styling files
```

## 🚀 **Getting Started**

1. **Open** `test-canvas-enhanced.html` in your web browser
2. **Create Tokens** using the sidebar interface with different types (Color, Spacing, Typography, etc.)
3. **Drag to Canvas** - tokens automatically appear as connected bubbles
4. **Automatic Connections** - wires appear automatically when referencing tokens are added
5. **Organize in Groups** - select multiple tokens and create groups for better organization
6. **Save/Load** - use the menu system to save your setups or load existing ones

## 🔧 **Technical Details**

### **Architecture**
- **Frontend**: HTML5 Canvas with advanced JavaScript
- **State Management**: Comprehensive undo/redo system with 30 steps
- **Data Persistence**: localStorage integration with session management
- **Responsive Design**: Adaptive layout with collapsible sidebar

### **Key Technologies**
- **Canvas Rendering**: Custom drawing system with smart socket positioning
- **Event Handling**: Advanced drag & drop with group support
- **CSS Variables**: Dynamic theming system with consistent design tokens
- **Modular Structure**: Clean separation of concerns

### **Performance Features**
- **Efficient Rendering**: Optimized canvas drawing with smart updates
- **Memory Management**: Limited undo/redo stacks prevent memory issues
- **State Optimization**: Only necessary data is stored and updated

## 🎯 **Advanced Features**

### **Smart Connection System**
- **Automatic Wire Detection**: Connections appear when referencing tokens are added to canvas
- **Optimal Socket Selection**: Wires connect to the best sockets based on node positions
- **Bidirectional Support**: Works regardless of which token is added first
- **Group Consolidation**: Collapsed groups show single connection points

### **Group Management**
- **Dynamic Group Creation**: Select multiple tokens and create groups
- **Collapsible Interface**: Groups can be collapsed to save space
- **Smart Width Calculation**: Group width adjusts based on content
- **Persistent State**: Group states maintained after loading

### **Data Management**
- **Enhanced Undo/Redo**: 30 steps with complete state preservation
- **Session System**: Save/load complete setups with metadata
- **JSON Import/Export**: Full data exchange capabilities
- **Automatic State Saving**: Changes saved to localStorage

## 📝 **Development Notes**

- **CSS Architecture**: All classes use `dtmc-` prefix for consistency
- **Modular Design**: Easy to extend with new features
- **Clean Code**: Well-documented functions and clear structure
- **Cross-Browser**: Compatible with modern browsers

## 🆕 **Recent Updates & Improvements**

### **Version 2.0 - Enhanced Features (Latest)**

#### **🎨 Visual Interface Improvements**
- **Real-time Token Synchronization**: Changes in sidebar instantly reflect on canvas
- **Smart Connection Wires**: Automatic wire creation with optimal socket positioning
- **Bidirectional Connection Detection**: Wires appear regardless of token creation order
- **Enhanced Token Value Display**: Centered values with improved horizontal padding

#### **🔗 Advanced Connection System**
- **Automatic Wire Creation**: Connections appear automatically when referencing tokens are added
- **Smart Socket Positioning**: Wires connect to side sockets for horizontal layouts, top/bottom for vertical
- **Order-Independent Connections**: Works regardless of which token is added first
- **Consolidated Group Connections**: Collapsed groups show single connection points

#### **📦 Group Management Enhancements**
- **Dynamic Group Width**: Groups automatically adjust width based on content
- **Group Dragging Fix**: Groups properly drag with all contained tokens after JSON loading
- **State Persistence**: Group collapsed/expanded states maintained after loading
- **Visual Group Indicators**: Clear connection points on group borders

#### **💾 Data Management Upgrades**
- **Enhanced Undo/Redo**: 30 steps in both directions with complete state preservation
- **Improved State Saving**: All application state (nodes, connections, groups, tokens) preserved
- **Better JSON Loading**: Proper group-node relationship restoration
- **Session Management**: Enhanced save/load with metadata

#### **🎛️ User Interface Overhaul**
- **Collapsible Sidebar**: Maximize canvas space with smooth transitions
- **Full-Width Canvas**: Automatically expands when sidebar is collapsed
- **Vertical Menu System**: Organized controls with three-dots menu
- **Always-Visible Controls**: Undo, Redo, Delete always accessible
- **Smart Control Positioning**: Controls adjust when sidebar is collapsed

#### **🔧 Technical Improvements**
- **Viewport Management**: Proper canvas expansion and control positioning
- **Memory Optimization**: Efficient undo/redo stack management
- **Cross-Browser Compatibility**: Enhanced browser support
- **Performance Optimization**: Improved rendering and event handling

## 🎯 **Future Roadmap**

- **Three.js Integration** for enhanced 3D visualization
- **Advanced Token Validation** and error handling
- **Plugin System** for custom token types
- **Collaboration Features** for team workflows
- **Advanced Export Formats** (CSS, SCSS, Design Tokens)
- **Real-time Collaboration** with multiple users
- **Version Control** for design token changes

---

**DTMC** - Empowering designers to create comprehensive design token systems with visual clarity and powerful management tools.



