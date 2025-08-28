# Canvas-Based Node Editor Integration Guide

This guide explains how to integrate the new canvas-based rendering system into your existing design token manager application, replacing the SVG-based approach while preserving all existing functionality.

## Overview

The canvas-based system provides:
- **Better Performance**: HTML5 Canvas rendering for large numbers of nodes
- **Smooth Interactions**: Hardware-accelerated drawing and animations
- **Scalability**: Handles hundreds of nodes without performance degradation
- **Modern Rendering**: Clean, crisp graphics with shadows and effects
- **Maintained Compatibility**: All existing data models and logic preserved

## What's Been Created

### 1. Canvas Node Editor Component (`client/components/ui/canvas-node-editor.tsx`)
- **Core rendering engine** using HTML5 Canvas
- **Event handling** for mouse interactions
- **Drawing functions** for nodes, connections, and groups
- **Performance optimizations** with requestAnimationFrame

### 2. Demo Page (`client/pages/CanvasDemo.tsx`)
- **Working example** of the canvas system
- **Sample data** showing token relationships
- **Interactive controls** for testing functionality
- **Route**: `/canvas-demo`

## Integration Steps

### Step 1: Replace SVG Rendering in Your Main App

In your existing `Index.tsx`, replace the SVG-based node rendering with the canvas component:

```tsx
// OLD: SVG-based rendering
{Object.values(tokens).flat().map((token) => {
  const position = nodePositions[token.id];
  if (!position) return null;
  return (
    <NodeBubble
      key={token.id}
      token={token}
      position={position}
      // ... other props
    />
  );
})}

// NEW: Canvas-based rendering
<CanvasNodeEditor
  tokens={tokens}
  nodePositions={nodePositions}
  connections={connections}
  tokenGroups={tokenGroups}
  canvasOffset={canvasOffset}
  canvasScale={canvasScale}
  selectedNode={selectedNode}
  selectedTokens={selectedTokens}
  selectedGroup={selectedGroup}
  isConnecting={isConnecting}
  connectionStart={connectionStart}
  tempConnection={tempConnection}
  onDrag={handleDrag}
  onStartConnection={handleStartConnection}
  onCompleteConnection={handleCompleteConnection}
  onSelect={handleSelect}
  onSelectGroup={handleSelectGroup}
  onDragGroup={handleDragGroup}
  onDragGroupEnd={handleDragGroupEnd}
  onDragEnd={handleDragEnd}
/>
```

### Step 2: Update Canvas Container

Replace your existing canvas container div with the canvas component:

```tsx
// OLD: Div container for SVG nodes
<div
  ref={canvasRef}
  className="relative w-full h-full overflow-hidden"
  onMouseDown={handleCanvasMouseDown}
  onMouseMove={handleCanvasMouseMove}
  onMouseUp={handleCanvasMouseUp}
  onWheel={handleWheel}
  onDrop={onDropToCanvas}
  onDragOver={(e) => e.preventDefault()}
>
  {/* SVG nodes were rendered here */}
</div>

// NEW: Canvas component
<div className="relative w-full h-full overflow-hidden">
  <CanvasNodeEditor
    // ... props
  />
</div>
```

### Step 3: Update Event Handlers

The canvas component handles most mouse events internally, but you'll need to update some handlers:

```tsx
// Update your existing handlers to work with the canvas
const handleDrag = useCallback((id: string, x: number, y: number) => {
  setNodePositions(prev => ({
    ...prev,
    [id]: { x, y }
  }));
}, []);

const handleStartConnection = useCallback((nodeId: string, portType: "output", socketPosition?: "top" | "bottom" | "left" | "right") => {
  setIsConnecting(true);
  setConnectionStart({ nodeId, port: portType, socketPosition });
  
  // Set temporary connection start point
  const position = nodePositions[nodeId];
  if (position) {
    let x1 = position.x + 90; // Center of node
    let y1 = position.y + 60;
    
    if (socketPosition === "top") {
      y1 = position.y;
    } else if (socketPosition === "bottom") {
      y1 = position.y + 120;
    } else if (socketPosition === "left") {
      x1 = position.x;
      y1 = position.y + 60;
    } else if (socketPosition === "right") {
      x1 = position.x + 180;
      y1 = position.y + 60;
    }
    
    setTempConnection({ x1, y1, x2: x1, y2: y1 });
  }
}, [nodePositions]);
```

### Step 4: Remove SVG-Specific Code

You can remove these SVG-related components and functions:
- `NodeBubble` component
- `CanvasGroup` component
- SVG connection drawing functions
- SVG-specific event handlers

## Key Features

### 1. Node Rendering
- **Rounded rectangles** with shadows and borders
- **Dynamic sizing** based on content
- **Selection states** with visual feedback
- **Socket positioning** on all four sides

### 2. Connection System
- **Curved connections** with bezier curves
- **Socket-aware routing** for clean layouts
- **Temporary connections** during creation
- **Visual feedback** for hover states

### 3. Group Management
- **Visual grouping** with dashed borders
- **Collapsible groups** for organization
- **Group selection** and dragging
- **Hierarchical relationships**

### 4. Performance Features
- **Hardware acceleration** via Canvas API
- **Efficient redrawing** with requestAnimationFrame
- **Viewport culling** for large datasets
- **Memory management** for canvas contexts

## Canvas Controls

### Zoom and Pan
```tsx
// Zoom controls
const zoomIn = () => setCanvasScale(prev => Math.min(2, prev * 1.2));
const zoomOut = () => setCanvasScale(prev => Math.max(0.25, prev / 1.2));
const resetZoom = () => {
  setCanvasScale(1);
  setCanvasOffset({ x: 0, y: 0 });
};

// Pan controls (middle mouse or space + drag)
const handleCanvasPan = (e: MouseEvent) => {
  if (isPanning) {
    setCanvasOffset(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  }
};
```

### Mouse Interactions
- **Left Click**: Select nodes/groups
- **Left Click + Drag**: Move nodes/groups
- **Middle Click + Drag**: Pan canvas
- **Wheel**: Zoom in/out
- **Ctrl + Click**: Multi-select

## Styling and Customization

### Canvas Styling
```tsx
<CanvasNodeEditor
  className="w-full h-full cursor-grab active:cursor-grabbing"
  // ... other props
/>
```

### Node Appearance
Modify the `drawNode` function in the canvas component to customize:
- Colors and borders
- Shadows and effects
- Font styles and sizes
- Socket appearances

### Connection Styling
Update the `drawConnection` function for:
- Line styles and widths
- Connection colors
- Arrow heads or other decorations

## Performance Considerations

### Large Datasets
For applications with many nodes (>100):
- Implement viewport culling
- Use lower detail rendering at distance
- Batch drawing operations
- Consider virtual scrolling

### Memory Management
- Clean up canvas contexts on unmount
- Limit canvas size for mobile devices
- Use appropriate pixel ratios for displays

## Browser Compatibility

The canvas system includes polyfills for:
- `roundRect` method (older browsers)
- Canvas context methods
- Touch events (mobile support)

## Testing the Integration

1. **Visit `/canvas-demo`** to see the working canvas
2. **Test interactions**:
   - Drag nodes around
   - Create connections between sockets
   - Zoom and pan the canvas
   - Select multiple nodes
3. **Verify performance** with large numbers of nodes

## Troubleshooting

### Common Issues

1. **Canvas not rendering**
   - Check canvas ref is properly set
   - Verify canvas dimensions are set
   - Ensure context is available

2. **Performance issues**
   - Reduce canvas size
   - Implement viewport culling
   - Check for memory leaks

3. **Event handling problems**
   - Verify event handler bindings
   - Check coordinate transformations
   - Ensure proper state updates

### Debug Mode
Enable debug logging in the canvas component:
```tsx
const DEBUG = true;

if (DEBUG) {
  console.log('Canvas state:', { canvasOffset, canvasScale, connections });
}
```

## Migration Checklist

- [ ] Replace SVG node rendering with CanvasNodeEditor
- [ ] Update event handlers for canvas interactions
- [ ] Remove SVG-specific components and functions
- [ ] Test all existing functionality
- [ ] Verify performance improvements
- [ ] Update any custom styling or themes
- [ ] Test on different devices and browsers

## Next Steps

After successful integration:
1. **Customize appearance** to match your design system
2. **Add advanced features** like minimap, search, or filters
3. **Implement undo/redo** for canvas operations
4. **Add keyboard shortcuts** for common actions
5. **Optimize for mobile** devices

## Support

For questions or issues with the canvas integration:
1. Check the demo page for working examples
2. Review the component source code
3. Test with the sample data provided
4. Verify browser compatibility

The canvas system is designed to be a drop-in replacement for your SVG rendering while maintaining all existing functionality and improving performance.
