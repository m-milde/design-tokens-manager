# DTMC - Feature Reference Guide

## 🆕 **New Features in Version 2.0**

### **🎨 Smart Connection System**

#### **Automatic Wire Creation**
- **How it works**: When you create a token that references another token (e.g., `{primitive.primary-blue}`) and drag both to the canvas, a connection wire automatically appears
- **Order independent**: Works regardless of which token you add to the canvas first
- **Real-time updates**: If you change a token's value in the sidebar, all connected canvas nodes update automatically

#### **Smart Socket Positioning**
- **Horizontal layouts**: Wires connect to left/right sockets when tokens are side-by-side
- **Vertical layouts**: Wires connect to top/bottom sockets when tokens are stacked vertically
- **Automatic detection**: The system automatically determines the best socket positions

### **📦 Advanced Group Management**

#### **Dynamic Group Width**
- **Automatic sizing**: Group width automatically adjusts based on the group name length
- **No text cutoff**: Group names are always fully visible
- **Responsive design**: Groups adapt to different content sizes

#### **Group Dragging**
- **Complete group movement**: When you drag a group, all contained tokens move together
- **State preservation**: Group dragging works correctly after loading JSON files
- **Visual feedback**: Clear visual indicators show group boundaries and connection points

#### **Consolidated Connections**
- **Collapsed groups**: When a group is collapsed, external connections consolidate to a single point on the group border
- **Expanded groups**: When expanded, connections reconnect to individual tokens
- **Visual indicators**: Connection points are clearly marked on group borders

### **🎛️ Enhanced User Interface**

#### **Collapsible Sidebar**
- **Maximize canvas space**: Click the collapse button to hide the sidebar
- **Full-width canvas**: Canvas automatically expands to use the full screen width
- **Smooth transitions**: Animated collapse/expand with smooth transitions

#### **Vertical Menu System**
- **Three-dots menu**: Click the ⋮ button to access additional functions
- **Organized controls**: Save, Load, Export, and Load JSON functions in a clean dropdown
- **Always-visible essentials**: Undo, Redo, and Delete buttons remain always visible

#### **Smart Control Positioning**
- **Automatic adjustment**: Top controls automatically move when sidebar is collapsed
- **No overlap**: Controls never overlap with the sidebar expand button
- **Responsive layout**: Interface adapts to different screen sizes

### **💾 Enhanced Data Management**

#### **30-Step Undo/Redo**
- **Extended history**: Undo and redo up to 30 steps in both directions
- **Complete state preservation**: All application state (nodes, connections, groups, tokens) is preserved
- **Memory efficient**: Automatic cleanup of old states to prevent memory issues

#### **Improved JSON Loading**
- **Group restoration**: Groups and their relationships are properly restored after loading
- **Node-group linking**: Canvas nodes are correctly linked to their groups
- **State consistency**: All application state is maintained after loading

#### **Session Management**
- **Enhanced metadata**: Save sessions with descriptions and timestamps
- **Complete state saving**: All tokens, nodes, connections, and groups are saved
- **Easy restoration**: Load complete setups with a single click

## 🎯 **How to Use New Features**

### **Creating Automatic Connections**
1. Create a token in the sidebar with a reference (e.g., `{primitive.primary-blue}`)
2. Drag both the referenced token and the referencing token to the canvas
3. A connection wire will automatically appear between them

### **Using Groups**
1. Select multiple tokens on the canvas (Ctrl+click or drag selection)
2. Click the "Create Group" button that appears
3. Groups can be collapsed/expanded by clicking the arrow
4. Drag groups to move all contained tokens together

### **Maximizing Canvas Space**
1. Click the collapse button (◀) in the sidebar header
2. Canvas automatically expands to full width
3. Click the expand button (▶) to restore sidebar

### **Using the Menu System**
1. Click the three-dots menu (⋮) in the top controls
2. Select from: Save current setup, Load setup, Export JSON, Load JSON
3. Menu automatically closes when clicking outside

### **Undo/Redo Operations**
1. Use the Undo button (↶) to go back up to 30 steps
2. Use the Redo button (↷) to go forward up to 30 steps
3. All changes are automatically saved to the undo stack

## 🔧 **Technical Details**

### **Connection System**
- **Reference parsing**: Uses regex to detect token references in values
- **Socket calculation**: Determines optimal socket positions based on node positions
- **Wire rendering**: Custom canvas drawing with smooth curves and proper styling

### **Group System**
- **Bounds calculation**: Dynamic calculation of group boundaries
- **State management**: Proper handling of collapsed/expanded states
- **Connection consolidation**: Smart connection point calculation for group borders

### **Viewport Management**
- **CSS transitions**: Smooth animations for sidebar collapse/expand
- **Canvas resizing**: Automatic canvas size adjustment
- **Control positioning**: Dynamic positioning of top controls

### **State Management**
- **Deep cloning**: Complete state copying for undo/redo
- **Stack management**: Efficient management of undo/redo stacks
- **Memory optimization**: Automatic cleanup of old states

---

**DTMC Version 2.0** - A comprehensive design token management system with advanced features for professional workflows.
