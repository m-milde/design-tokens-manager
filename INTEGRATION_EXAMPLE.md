# Practical Integration Example

This document shows exactly how to replace your existing SVG-based node rendering with the new canvas system.

## Current SVG Implementation (What to Replace)

In your `Index.tsx`, you currently have this SVG-based rendering:

```tsx
// This is what you currently have - REPLACE THIS
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
  {/* SVG Nodes */}
  {Object.values(tokens).flat().map((token) => {
    const position = nodePositions[token.id];
    if (!position) return null;
    return (
      <NodeBubble
        key={token.id}
        token={token}
        position={position}
        onDrag={onDrag}
        onStartConnection={handleStartConnection}
        onCompleteConnection={handleCompleteConnection}
        onDeleteNode={deleteNode}
        onDeleteToken={deleteToken}
        onDisconnectNode={disconnectNode}
        isConnecting={isConnecting}
        selectedNode={selectedNode}
        selectedTokens={selectedTokens}
        onSelect={handleNodeSelect}
        canvasRef={canvasRef}
        canvasOffset={canvasOffset}
        canvasScale={canvasScale}
        isPanningMode={isSpacePressed}
        onDragEnd={handleDragEnd}
        connections={connections}
        isInGroup={false}
        onRemoveFromGroup={() => {}}
      />
    );
  })}

  {/* SVG Groups */}
  {tokenGroups.map((group) => {
    const groupTokens = tokens.filter((token) =>
      group.tokenIds.includes(token.id),
    );
    return (
      <CanvasGroup
        key={group.id}
        group={group}
        tokens={groupTokens}
        nodePositions={nodePositions}
        onToggleCollapse={toggleCanvasGroupCollapse}
        onUngroupTokens={ungroupTokens}
        onSelectGroup={handleSelectGroup}
        isSelected={selectedGroup === group.id}
        onDragGroup={handleDragGroup}
        onAddTokenToGroup={addTokenToGroup}
        onRemoveTokenFromGroup={removeTokenFromGroup}
        canvasRef={canvasRef}
        canvasOffset={canvasOffset}
        canvasScale={canvasScale}
        isPanningMode={isSpacePressed}
        onDragGroupEnd={handleDragGroupEnd}
      />
    );
  })}

  {/* SVG Connections */}
  <svg className="absolute inset-0 pointer-events-none">
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {connections.map((connection) => {
      const fromToken = Object.values(tokens).flat().find(t => t.id === connection.from);
      const toToken = Object.values(tokens).flat().find(t => t.id === connection.to);
      
      if (!fromToken || !toToken) return null;
      
      const fromPos = nodePositions[connection.from];
      const toPos = nodePositions[connection.to];
      
      if (!fromPos || !toPos) return null;
      
      const path = createConnectionPath(
        fromPos.x + 75,
        fromPos.y + 100,
        toPos.x + 75,
        toPos.y,
        connection.fromSocket,
        connection.toSocket
      );
      
      return (
        <path
          key={connection.id}
          d={path}
          stroke="#cccccc"
          strokeWidth="3"
          fill="none"
          filter="url(#glow)"
        />
      );
    })}
  </svg>
</div>
```

## New Canvas Implementation (What to Use Instead)

Replace the entire SVG section above with this single canvas component:

```tsx
// REPLACE THE SVG SECTION WITH THIS
<div className="relative w-full h-full overflow-hidden">
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
    onDrag={onDrag}
    onStartConnection={handleStartConnection}
    onCompleteConnection={handleCompleteConnection}
    onSelect={handleNodeSelect}
    onSelectGroup={handleSelectGroup}
    onDragGroup={handleDragGroup}
    onDragGroupEnd={handleDragGroupEnd}
    onDragEnd={handleDragEnd}
  />
</div>
```

## Required State Updates

Add these new state variables to your component:

```tsx
// Add these new state variables
const [connectionStart, setConnectionStart] = useState<{
  nodeId: string;
  port: "output";
  socketPosition?: "top" | "bottom" | "left" | "right";
} | null>(null);

const [tempConnection, setTempConnection] = useState<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} | null>(null);
```

## Updated Event Handlers

Update your existing event handlers to work with the canvas:

```tsx
// Update your existing handleStartConnection
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

// Update your existing handleCompleteConnection
const handleCompleteConnection = useCallback((nodeId: string, portType: "input", socketPosition?: "top" | "bottom" | "left" | "right") => {
  if (connectionStart && connectionStart.nodeId !== nodeId) {
    const newConnection: Connection = {
      id: `conn_${Date.now()}`,
      from: connectionStart.nodeId,
      to: nodeId,
      fromPort: connectionStart.port,
      toPort: portType,
      fromSocket: connectionStart.socketPosition,
      toSocket: socketPosition,
    };

    markHistory();
    setConnections((prev) => [...prev, newConnection]);
  }

  setIsConnecting(false);
  setConnectionStart(null);
  setTempConnection(null);
}, [connectionStart, markHistory]);

// Update your existing onDrag function
const onDrag = useCallback((id: string, x: number, y: number) => {
  setNodePositions((prev) => ({
    ...prev,
    [id]: { x, y },
  }));
}, []);
```

## Remove These Functions

You can remove these SVG-specific functions as they're no longer needed:

```tsx
// REMOVE THESE FUNCTIONS - they're handled by the canvas now
const createConnectionPath = (x1: number, y1: number, x2: number, y2: number, fromSocket?: string, toSocket?: string) => {
  // This SVG path creation is no longer needed
};

const handleCanvasMouseDown = (e: React.MouseEvent) => {
  // Canvas handles this internally
};

const handleCanvasMouseMove = (e: MouseEvent | React.MouseEvent) => {
  // Canvas handles this internally
};

const handleCanvasMouseUp = useCallback(() => {
  // Canvas handles this internally
}, []);
```

## Remove These Components

You can remove these SVG-based components:

```tsx
// REMOVE THESE COMPONENTS - they're replaced by the canvas
const NodeBubble = ({ token, position, ... }) => {
  // This entire component can be removed
};

const CanvasGroup = ({ group, tokens, ... }) => {
  // This entire component can be removed
};
```

## Final Result

After the integration, your canvas section will look like this:

```tsx
// Your final canvas implementation
<div className="relative w-full h-full overflow-hidden">
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
    onDrag={onDrag}
    onStartConnection={handleStartConnection}
    onCompleteConnection={handleCompleteConnection}
    onSelect={handleNodeSelect}
    onSelectGroup={handleSelectGroup}
    onDragGroup={handleDragGroup}
    onDragGroupEnd={handleDragGroupEnd}
    onDragEnd={handleDragEnd}
  />
</div>
```

## What You Keep

All of these remain exactly the same:
- `tokens` state
- `nodePositions` state  
- `connections` state
- `tokenGroups` state
- `selectedNode` state
- `selectedTokens` state
- `selectedGroup` state
- `canvasOffset` state
- `canvasScale` state
- All your business logic functions
- All your UI components (sidebar, modals, etc.)

## What Changes

Only the rendering layer changes:
- SVG → Canvas
- Individual node components → Single canvas component
- SVG event handling → Canvas event handling
- Manual connection drawing → Automatic connection drawing

## Testing the Integration

1. **Visit `/canvas-demo`** to see the working canvas
2. **Replace the SVG section** in your main app
3. **Test all functionality** - everything should work the same
4. **Verify performance** - should be much faster with many nodes

The canvas system is designed to be a drop-in replacement that maintains all existing functionality while providing better performance and modern rendering.
