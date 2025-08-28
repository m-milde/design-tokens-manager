import React, { useState, useCallback } from 'react';
import { CanvasNodeEditor } from '@/components/ui/canvas-node-editor';

// Types from your existing application
interface Token {
  id: string;
  name: string;
  value: string;
  type: "color" | "text" | "spacing" | "boolean" | "string" | "number";
  layer: "base" | "semantic" | "specific";
}

interface Connection {
  id: string;
  from: string;
  to: string;
  fromPort: "output";
  toPort: "input";
  fromSocket?: "top" | "bottom" | "left" | "right";
  toSocket?: "top" | "bottom" | "left" | "right";
}

interface TokenGroup {
  id: string;
  name: string;
  tokenIds: string[];
  collapsed: boolean;
  canvasCollapsed?: boolean;
  position?: { x: number; y: number };
  parentGroupId?: string;
  childGroups: string[];
  level: number;
}

export default function CanvasDemo() {
  // Sample data to demonstrate the canvas
  const [tokens, setTokens] = useState<{ [key: string]: Token[] }>({
    base: [
      { id: "token_1", name: "primary-blue", value: "#4a90e2", type: "color", layer: "base" },
      { id: "token_2", name: "font-size-base", value: "16px", type: "text", layer: "base" },
      { id: "token_3", name: "spacing-unit", value: "8px", type: "spacing", layer: "base" },
    ],
    semantic: [
      { id: "token_4", name: "color-brand", value: "{base.primary-blue}", type: "color", layer: "semantic" },
      { id: "token_5", name: "text-body", value: "{base.font-size-base}", type: "text", layer: "semantic" },
    ],
    specific: [
      { id: "token_6", name: "button-bg", value: "{semantic.color-brand}", type: "color", layer: "specific" },
      { id: "token_7", name: "button-padding", value: "{base.spacing-unit}", type: "spacing", layer: "specific" },
    ]
  });

  const [nodePositions, setNodePositions] = useState<{ [key: string]: { x: number; y: number } }>({
    "token_1": { x: 100, y: 100 },
    "token_2": { x: 100, y: 300 },
    "token_3": { x: 100, y: 500 },
    "token_4": { x: 400, y: 100 },
    "token_5": { x: 400, y: 300 },
    "token_6": { x: 700, y: 100 },
    "token_7": { x: 700, y: 300 },
  });

  const [connections, setConnections] = useState<Connection[]>([
    { id: "conn_1", from: "token_1", to: "token_4", fromPort: "output", toPort: "input", fromSocket: "bottom", toSocket: "top" },
    { id: "conn_2", from: "token_2", to: "token_5", fromPort: "output", toPort: "input", fromSocket: "bottom", toSocket: "top" },
    { id: "conn_3", from: "token_3", to: "token_7", fromPort: "output", toPort: "input", fromSocket: "bottom", toSocket: "top" },
    { id: "conn_4", from: "token_4", to: "token_6", fromPort: "output", toPort: "input", fromSocket: "bottom", toSocket: "top" },
  ]);

  const [tokenGroups, setTokenGroups] = useState<TokenGroup[]>([
    {
      id: "group_1",
      name: "Base Tokens",
      tokenIds: ["token_1", "token_2", "token_3"],
      collapsed: false,
      canvasCollapsed: false,
      level: 0,
      childGroups: []
    }
  ]);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
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

  // Canvas state
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);

  // Event handlers
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

      setConnections(prev => [...prev, newConnection]);
    }

    setIsConnecting(false);
    setConnectionStart(null);
    setTempConnection(null);
  }, [connectionStart]);

  const handleSelect = useCallback((nodeId: string, ctrlKey: boolean = false) => {
    if (ctrlKey) {
      setSelectedTokens(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(nodeId)) {
          newSelection.delete(nodeId);
        } else {
          newSelection.add(nodeId);
        }
        return newSelection;
      });
      setSelectedNode(null);
    } else {
      setSelectedNode(nodeId);
      setSelectedTokens(new Set());
      setSelectedGroup(null);
    }
  }, []);

  const handleSelectGroup = useCallback((groupId: string) => {
    setSelectedGroup(groupId);
    setSelectedNode(null);
    setSelectedTokens(new Set());
  }, []);

  const handleDragGroup = useCallback((groupId: string, x: number, y: number) => {
    // This would update group positions
    // For demo purposes, we'll just log it
    console.log(`Dragging group ${groupId} to ${x}, ${y}`);
  }, []);

  const handleDragEnd = useCallback(() => {
    console.log('Drag ended');
  }, []);

  const handleDragGroupEnd = useCallback(() => {
    console.log('Group drag ended');
  }, []);

  // Add new token button
  const addSampleToken = () => {
    const newToken: Token = {
      id: `token_${Date.now()}`,
      name: `Sample Token ${Object.values(tokens).flat().length + 1}`,
      value: "#ff6b6b",
      type: "color",
      layer: "base"
    };

    setTokens(prev => ({
      ...prev,
      base: [...prev.base, newToken]
    }));

    // Position the new token
    setNodePositions(prev => ({
      ...prev,
      [newToken.id]: { x: Math.random() * 600 + 100, y: Math.random() * 400 + 100 }
    }));
  };

  // Zoom controls
  const zoomIn = () => setCanvasScale(prev => Math.min(2, prev * 1.2));
  const zoomOut = () => setCanvasScale(prev => Math.max(0.25, prev / 1.2));
  const resetZoom = () => {
    setCanvasScale(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Canvas Node Editor Demo</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={addSampleToken}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Add Token
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={zoomOut}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                -
              </button>
              <span className="px-3 py-1 bg-gray-700 rounded">
                {Math.round(canvasScale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                +
              </button>
              <button
                onClick={resetZoom}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-gray-800">
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
        </div>

        {/* Instructions Overlay */}
        <div className="absolute top-4 left-4 bg-gray-800/90 p-4 rounded-lg max-w-sm">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ul className="text-sm space-y-1">
            <li>• Click and drag nodes to move them</li>
            <li>• Click output sockets (green) to start connections</li>
            <li>• Click input sockets (red) to complete connections</li>
            <li>• Use mouse wheel or buttons to zoom</li>
            <li>• Drag empty space to pan the canvas</li>
            <li>• Click nodes to select them</li>
          </ul>
        </div>

        {/* Stats Overlay */}
        <div className="absolute top-4 right-4 bg-gray-800/90 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Canvas Stats:</h3>
          <div className="text-sm space-y-1">
            <div>Tokens: {Object.values(tokens).flat().length}</div>
            <div>Connections: {connections.length}</div>
            <div>Groups: {tokenGroups.length}</div>
            <div>Selected: {selectedNode || selectedTokens.size || selectedGroup || 'None'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
