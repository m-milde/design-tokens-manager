import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

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

interface CanvasNodeEditorProps {
  tokens: { [key: string]: Token[] };
  nodePositions: { [key: string]: { x: number; y: number } };
  connections: Connection[];
  tokenGroups: TokenGroup[];
  canvasOffset: { x: number; y: number };
  canvasScale: number;
  selectedNode: string | null;
  selectedTokens: Set<string>;
  selectedGroup: string | null;
  isConnecting: boolean;
  connectionStart: {
    nodeId: string;
    port: "output";
    socketPosition?: "top" | "bottom" | "left" | "right";
  } | null;
  tempConnection: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null;
  onDrag: (id: string, x: number, y: number) => void;
  onStartConnection: (nodeId: string, portType: "output", socketPosition?: "top" | "bottom" | "left" | "right") => void;
  onCompleteConnection: (nodeId: string, portType: "input", socketPosition?: "top" | "bottom" | "left" | "right") => void;
  onSelect: (nodeId: string, ctrlKey?: boolean) => void;
  onSelectGroup: (groupId: string) => void;
  onDragGroup: (groupId: string, x: number, y: number) => void;
  onDragGroupEnd?: () => void;
  onDragEnd?: () => void;
  className?: string;
}

// Canvas rendering constants
const NODE_WIDTH = 180;
const NODE_HEIGHT = 120;
const SOCKET_RADIUS = 8;
const SOCKET_SPACING = 30;

// Polyfill for roundRect (for older browsers)
const roundRectPolyfill = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    // Fallback for browsers that don't support roundRect
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
};

export const CanvasNodeEditor: React.FC<CanvasNodeEditorProps> = ({
  tokens,
  nodePositions,
  connections,
  tokenGroups,
  canvasOffset,
  canvasScale,
  selectedNode,
  selectedTokens,
  selectedGroup,
  isConnecting,
  connectionStart,
  tempConnection,
  onDrag,
  onStartConnection,
  onCompleteConnection,
  onSelect,
  onSelectGroup,
  onDragGroup,
  onDragGroupEnd,
  onDragEnd,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Canvas state
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<{ type: 'node' | 'group'; id: string } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredSocket, setHoveredSocket] = useState<{ nodeId: string; type: 'input' | 'output'; index: number } | null>(null);

  // Get all tokens that are positioned on canvas
  const canvasTokens = useMemo(() => {
    const allTokens = Object.values(tokens).flat().filter(token => nodePositions[token.id]);
    console.log('Canvas tokens computed:', { 
      allTokens: Object.values(tokens).flat().length, 
      positionedTokens: allTokens.length,
      nodePositions: Object.keys(nodePositions).length 
    });
    return allTokens;
  }, [tokens, nodePositions]);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctxRef.current = ctx;
    
    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      // Debug logging
      console.log('Canvas resized:', { width: canvas.width, height: canvas.height, rect: rect });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Start continuous rendering with requestAnimationFrame (like in reference file)
    let animationId: number;
    const renderLoop = () => {
      drawCanvas();
      animationId = requestAnimationFrame(renderLoop);
    };
    renderLoop();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Main drawing function
  const drawCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) {
      console.log('Canvas or context not available');
      return;
    }

    // Debug logging (log every 10 frames to reduce spam)
    if (Math.random() < 0.1) { // Log 10% of the time
      console.log('Drawing canvas:', { 
        canvasTokens: canvasTokens.length, 
        connections: connections.length,
        canvasOffset, 
        canvasScale,
        canvasSize: { width: canvas.width, height: canvas.height }
      });
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply canvas transformations FIRST
    ctx.save();
    ctx.translate(canvasOffset.x, canvasOffset.y);
    ctx.scale(canvasScale, canvasScale);
    
    // Draw a test rectangle AFTER transformations to see if canvas is working
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 100, 100);
    console.log('Drew test rectangle at (10,10) with transformations:', { offset: canvasOffset, scale: canvasScale });

    // Draw connections first (behind nodes)
    drawConnections(ctx);
    
    // Draw groups
    drawGroups(ctx);
    
    // Draw nodes
    drawNodes(ctx);
    
    // Draw temporary connection if connecting
    if (isConnecting && tempConnection) {
      drawTempConnection(ctx);
    }

    ctx.restore();
  }, [canvasOffset, canvasScale, connections, canvasTokens, tokenGroups, isConnecting, tempConnection]);

  // Draw all connections
  const drawConnections = useCallback((ctx: CanvasRenderingContext2D) => {
    connections.forEach(conn => {
      const fromToken = Object.values(tokens).flat().find(t => t.id === conn.from);
      const toToken = Object.values(tokens).flat().find(t => t.id === conn.to);
      
      if (!fromToken || !toToken) return;
      
      const fromPos = nodePositions[conn.from];
      const toPos = nodePositions[conn.to];
      
      if (!fromPos || !toPos) return;
      
      drawConnection(ctx, fromPos, toPos, conn.fromSocket, conn.toSocket);
    });
  }, [connections, tokens, nodePositions]);

  // Draw a single connection
  const drawConnection = useCallback((
    ctx: CanvasRenderingContext2D,
    fromPos: { x: number; y: number },
    toPos: { x: number; y: number },
    fromSocket?: "top" | "bottom" | "left" | "right",
    toSocket?: "top" | "bottom" | "left" | "right"
  ) => {
    // Calculate connection points based on socket positions
    let x1 = fromPos.x + NODE_WIDTH / 2;
    let y1 = fromPos.y + NODE_HEIGHT / 2;
    let x2 = toPos.x + NODE_WIDTH / 2;
    let y2 = toPos.y + NODE_HEIGHT / 2;

    // Adjust for socket positions
    if (fromSocket === "top") {
      y1 = fromPos.y;
      x1 = fromPos.x + NODE_WIDTH / 2;
    } else if (fromSocket === "bottom") {
      y1 = fromPos.y + NODE_HEIGHT;
      x1 = fromPos.x + NODE_WIDTH / 2;
    } else if (fromSocket === "left") {
      x1 = fromPos.x;
      y1 = fromPos.y + NODE_HEIGHT / 2;
    } else if (fromSocket === "right") {
      x1 = fromPos.x + NODE_WIDTH;
      y1 = fromPos.y + NODE_HEIGHT / 2;
    }

    if (toSocket === "top") {
      y2 = toPos.y;
      x2 = toPos.x + NODE_WIDTH / 2;
    } else if (toSocket === "bottom") {
      y2 = toPos.y + NODE_HEIGHT;
      x2 = toPos.x + NODE_WIDTH / 2;
    } else if (toSocket === "left") {
      x2 = toPos.x;
      y2 = toPos.y + NODE_HEIGHT / 2;
    } else if (toSocket === "right") {
      x2 = toPos.x + NODE_WIDTH;
      y2 = toPos.y + NODE_HEIGHT / 2;
    }

    // Draw curved connection
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const dx = x2 - x1;
    const dy = y2 - y1;
    const midX = x1 + dx * 0.5;
    const midY = y1 + dy * 0.5;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX, y1, midX, midY);
    ctx.quadraticCurveTo(midX, y2, x2, y2);
    ctx.stroke();
  }, []);

  // Draw temporary connection line
  const drawTempConnection = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!tempConnection) return;
    
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(tempConnection.x1, tempConnection.y1);
    ctx.lineTo(tempConnection.x2, tempConnection.y2);
    ctx.stroke();
    
    ctx.setLineDash([]);
  }, [tempConnection]);

  // Draw all nodes
  const drawNodes = useCallback((ctx: CanvasRenderingContext2D) => {
    console.log('Drawing nodes:', canvasTokens.length);
    
    if (canvasTokens.length === 0) {
      console.log('No canvas tokens to draw');
      return;
    }
    
    canvasTokens.forEach(token => {
      const position = nodePositions[token.id];
      if (!position) {
        console.log('No position for token:', token.id);
        return;
      }
      
      console.log('Drawing node:', token.id, 'at position:', position);
      
      // Draw a simple test circle first to see if positioning works
      ctx.fillStyle = 'blue';
      ctx.beginPath();
      ctx.arc(position.x + NODE_WIDTH/2, position.y + NODE_HEIGHT/2, 20, 0, 2 * Math.PI);
      ctx.fill();
      console.log('Drew blue circle at:', { x: position.x + NODE_WIDTH/2, y: position.y + NODE_HEIGHT/2 });
      
      const isSelected = selectedNode === token.id || selectedTokens.has(token.id);
      drawNode(ctx, token, position, isSelected);
    });
  }, [canvasTokens, nodePositions, selectedNode, selectedTokens]);

  // Draw a single node
  const drawNode = useCallback((
    ctx: CanvasRenderingContext2D,
    token: Token,
    position: { x: number; y: number },
    isSelected: boolean
  ) => {
    const { x, y } = position;
    
    // Node background
    ctx.fillStyle = isSelected ? '#4b5563' : '#374151';
    ctx.strokeStyle = isSelected ? '#60a5fa' : '#6b7280';
    ctx.lineWidth = isSelected ? 3 : 2;
    
    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw rounded rectangle using polyfill
    roundRectPolyfill(ctx, x, y, NODE_WIDTH, NODE_HEIGHT, 8);
    ctx.fill();
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Node title
    ctx.fillStyle = '#f3f4f6';
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(token.name, x + NODE_WIDTH / 2, y + 25);
    
    // Node value
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText(token.value, x + NODE_WIDTH / 2, y + 45);
    
    // Draw sockets
    drawNodeSockets(ctx, token, position);
  }, []);

  // Draw node sockets
  const drawNodeSockets = useCallback((
    ctx: CanvasRenderingContext2D,
    token: Token,
    position: { x: number; y: number }
  ) => {
    const { x, y } = position;
    
    // Top socket
    const topSocket = { x: x + NODE_WIDTH / 2, y: y };
    drawSocket(ctx, topSocket, 'output', hoveredSocket?.nodeId === token.id && hoveredSocket?.type === 'output' && hoveredSocket?.index === 0);
    
    // Bottom socket
    const bottomSocket = { x: x + NODE_WIDTH / 2, y: y + NODE_HEIGHT };
    drawSocket(ctx, bottomSocket, 'input', hoveredSocket?.nodeId === token.id && hoveredSocket?.type === 'input' && hoveredSocket?.index === 0);
    
    // Left socket
    const leftSocket = { x: x, y: y + NODE_HEIGHT / 2 };
    drawSocket(ctx, leftSocket, 'output', hoveredSocket?.nodeId === token.id && hoveredSocket?.type === 'output' && hoveredSocket?.index === 1);
    
    // Right socket
    const rightSocket = { x: x + NODE_WIDTH, y: y + NODE_HEIGHT / 2 };
    drawSocket(ctx, rightSocket, 'input', hoveredSocket?.nodeId === token.id && hoveredSocket?.type === 'input' && hoveredSocket?.index === 1);
  }, [hoveredSocket]);

  // Draw a single socket
  const drawSocket = useCallback((
    ctx: CanvasRenderingContext2D,
    position: { x: number; y: number },
    type: 'input' | 'output',
    isHovered: boolean
  ) => {
    const { x, y } = position;
    
    ctx.beginPath();
    ctx.arc(x, y, SOCKET_RADIUS, 0, 2 * Math.PI);
    
    if (isHovered) {
      ctx.fillStyle = '#ffff00';
    } else if (type === 'input') {
      ctx.fillStyle = '#ef4444';
    } else {
      ctx.fillStyle = '#22c55e';
    }
    
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  // Draw groups
  const drawGroups = useCallback((ctx: CanvasRenderingContext2D) => {
    tokenGroups.forEach(group => {
      if (group.canvasCollapsed) return;
      
      const groupTokens = group.tokenIds
        .map(id => nodePositions[id])
        .filter(Boolean);
      
      if (groupTokens.length === 0) return;
      
      // Calculate group bounds
      const minX = Math.min(...groupTokens.map(p => p.x));
      const minY = Math.min(...groupTokens.map(p => p.y));
      const maxX = Math.max(...groupTokens.map(p => p.x + NODE_WIDTH));
      const maxY = Math.max(...groupTokens.map(p => p.y + NODE_HEIGHT));
      
      const isSelected = selectedGroup === group.id;
      
      // Group border
      ctx.strokeStyle = isSelected ? '#60a5fa' : '#6b7280';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash([5, 5]);
      
      ctx.strokeRect(minX - 10, minY - 35, maxX - minX + 20, maxY - minY + 45);
      ctx.setLineDash([]);
      
      // Group label
      ctx.fillStyle = '#f3f4f6';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(group.name, minX, minY - 40);
    });
  }, [tokenGroups, nodePositions, selectedGroup]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
    const mouseY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
    
    // Check for socket clicks first
    const socket = findSocketAtPoint(mouseX, mouseY);
    if (socket) {
      if (socket.type === 'output') {
        onStartConnection(socket.nodeId, 'output', getSocketPosition(socket.index));
      } else {
        onCompleteConnection(socket.nodeId, 'input', getSocketPosition(socket.index));
      }
      return;
    }
    
    // Check for node clicks
    const clickedNode = findNodeAtPoint(mouseX, mouseY);
    if (clickedNode) {
      setIsDragging(true);
      setDragTarget({ type: 'node', id: clickedNode.id });
      setDragOffset({ x: mouseX - clickedNode.position.x, y: mouseY - clickedNode.position.y });
      onSelect(clickedNode.id, e.ctrlKey || e.metaKey);
      return;
    }
    
    // Check for group clicks
    const clickedGroup = findGroupAtPoint(mouseX, mouseY);
    if (clickedGroup) {
      setIsDragging(true);
      setDragTarget({ type: 'group', id: clickedGroup.id });
      setDragOffset({ x: mouseX - clickedGroup.bounds.minX, y: mouseY - clickedGroup.bounds.minY });
      onSelectGroup(clickedGroup.id);
      return;
    }
    
    // Clear selection if clicking on empty space
    onSelect('', false);
  }, [canvasOffset, canvasScale, onStartConnection, onCompleteConnection, onSelect, onSelectGroup]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
    const mouseY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
    
    // Handle dragging
    if (isDragging && dragTarget) {
      if (dragTarget.type === 'node') {
        const newX = mouseX - dragOffset.x;
        const newY = mouseY - dragOffset.y;
        onDrag(dragTarget.id, newX, newY);
      } else if (dragTarget.type === 'group') {
        const group = tokenGroups.find(g => g.id === dragTarget.id);
        if (group) {
          const groupTokens = group.tokenIds
            .map(id => nodePositions[id])
            .filter(Boolean);
          
          if (groupTokens.length > 0) {
            const minX = Math.min(...groupTokens.map(p => p.x));
            const minY = Math.min(...groupTokens.map(p => p.y));
            const offsetX = mouseX - dragOffset.x - minX;
            const offsetY = mouseY - dragOffset.y - minY;
            
            group.tokenIds.forEach(tokenId => {
              const currentPos = nodePositions[tokenId];
              if (currentPos) {
                onDragGroup(tokenId, currentPos.x + offsetX, currentPos.y + offsetY);
              }
            });
          }
        }
      }
      return;
    }
    
    // Handle socket hovering
    const socket = findSocketAtPoint(mouseX, mouseY);
    setHoveredSocket(socket);
    
    // Handle temporary connection drawing
    if (isConnecting && connectionStart) {
      // This would update tempConnection state
      // For now, we'll just redraw
    }
  }, [isDragging, dragTarget, dragOffset, canvasOffset, canvasScale, onDrag, onDragGroup, tokenGroups, nodePositions, isConnecting, connectionStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragTarget(null);
      
      if (dragTarget?.type === 'group' && onDragGroupEnd) {
        onDragGroupEnd();
      }
      
      if (onDragEnd) {
        onDragEnd();
      }
    }
  }, [isDragging, dragTarget, onDragGroupEnd, onDragEnd]);

  // Helper functions
  const findSocketAtPoint = useCallback((x: number, y: number) => {
    for (const token of canvasTokens) {
      const position = nodePositions[token.id];
      if (!position) continue;
      
      // Check each socket
      const sockets = [
        { x: position.x + NODE_WIDTH / 2, y: position.y, type: 'output' as const, index: 0 },
        { x: position.x + NODE_WIDTH / 2, y: position.y + NODE_HEIGHT, type: 'input' as const, index: 0 },
        { x: position.x, y: position.y + NODE_HEIGHT / 2, type: 'output' as const, index: 1 },
        { x: position.x + NODE_WIDTH, y: position.y + NODE_HEIGHT / 2, type: 'input' as const, index: 1 }
      ];
      
      for (const socket of sockets) {
        const distance = Math.sqrt((x - socket.x) ** 2 + (y - socket.y) ** 2);
        if (distance <= SOCKET_RADIUS) {
          return { nodeId: token.id, type: socket.type, index: socket.index };
        }
      }
    }
    return null;
  }, [canvasTokens, nodePositions]);

  const findNodeAtPoint = useCallback((x: number, y: number) => {
    for (const token of canvasTokens) {
      const position = nodePositions[token.id];
      if (!position) continue;
      
      if (x >= position.x && x <= position.x + NODE_WIDTH &&
          y >= position.y && y <= position.y + NODE_HEIGHT) {
        return { id: token.id, position };
      }
    }
    return null;
  }, [canvasTokens, nodePositions]);

  const findGroupAtPoint = useCallback((x: number, y: number) => {
    for (const group of tokenGroups) {
      if (group.canvasCollapsed) continue;
      
      const groupTokens = group.tokenIds
        .map(id => nodePositions[id])
        .filter(Boolean);
      
      if (groupTokens.length === 0) continue;
      
      const minX = Math.min(...groupTokens.map(p => p.x));
      const minY = Math.min(...groupTokens.map(p => p.y));
      const maxX = Math.max(...groupTokens.map(p => p.x + NODE_WIDTH));
      const maxY = Math.max(...groupTokens.map(p => p.y + NODE_HEIGHT));
      
      if (x >= minX - 10 && x <= maxX + 10 &&
          y >= minY - 35 && y <= maxY + 10) {
        return { id: group.id, bounds: { minX, minY, maxX, maxY } };
      }
    }
    return null;
  }, [tokenGroups, nodePositions]);

  const getSocketPosition = useCallback((index: number): "top" | "bottom" | "left" | "right" => {
    switch (index) {
      case 0: return 'top';
      case 1: return 'bottom';
      case 2: return 'left';
      case 3: return 'right';
      default: return 'top';
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "w-full h-full cursor-grab active:cursor-grabbing",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};
