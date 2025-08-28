# DTMC - Design Tokens Map Creator

A comprehensive application for building, visualizing, importing, and exporting design tokens with hierarchical relationships and property inheritance.

## 🎯 **Project Overview**

DTMC is a powerful design token management system that allows designers and developers to create, organize, and manage design tokens across multiple hierarchical levels. The application provides a visual canvas interface for connecting tokens and managing their relationships.

## 🏗️ **Token Hierarchy Levels**

The system supports flexible token hierarchies:

- **Primitive** (minimum level) - Basic design values
- **Base** (optional) - Foundation tokens
- **Semantic** (optional) - Meaningful abstractions
- **Specific** (optional) - Context-specific implementations

## ✨ **Core Features**

- **Token Creation & Management** via intuitive sidebar interface
- **Property Inheritance** between connected tokens
- **Visual Canvas** with input/output sockets for connections
- **Grouping System** for organizing tokens on canvas
- **Drag & Drop** from sidebar to canvas
- **Import/Export** to various JSON formats
- **Layer Management** for different token types
- **Real-time Visualization** of token relationships

## 🎨 **User Interface**

- **Left Sidebar**: Token types, layers, and groups management
- **Main Canvas**: Visual representation of connected tokens
- **Interactive Controls**: Zoom, pan, and canvas manipulation
- **Modern Design**: Clean, professional interface

## 📁 **Project Structure**

```
DTMC/
├── test-canvas.html          # Main application file
├── README.md                 # Project documentation
├── package.json              # Dependencies and scripts
└── src/
    ├── components/           # Reusable UI components
    ├── utils/               # Helper functions and utilities
    ├── data/                # Data models and sample data
    └── styles/              # CSS and styling files
```

## 🚀 **Getting Started**

1. Open `test-canvas.html` in your web browser
2. Use the controls to add nodes to the canvas
3. Connect nodes by dragging from output to input sockets
4. Organize tokens into groups for better management

## 🔧 **Technical Details**

- **Frontend**: HTML5 Canvas with JavaScript
- **Architecture**: Modular component-based structure
- **Styling**: Custom CSS with dtmc-prefixed classes
- **Responsive**: Adaptive layout for different screen sizes

## 📝 **Development Notes**

- All CSS classes and IDs use the `dtmc-` prefix
- Modular structure for easy feature additions
- Clean separation of concerns (components, utils, data, styles)

## 🎯 **Future Roadmap**

- Three.js integration for enhanced 3D visualization
- Advanced token validation and error handling
- Plugin system for custom token types
- Collaboration features for team workflows
- Advanced export formats (CSS, SCSS, Design Tokens)

---

**DTMC** - Empowering designers to create comprehensive design token systems with visual clarity and powerful management tools.



