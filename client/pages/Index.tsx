import React, { useState, useRef, useCallback, useEffect } from "react";
import { Trash2, X, Plus, Download, Minus } from "lucide-react";

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
}

interface TokenGroup {
  id: string;
  name: string;
  tokenIds: string[];
  collapsed: boolean;
  canvasCollapsed?: boolean;
  position?: { x: number; y: number };
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

interface NodeBubbleProps {
  token: Token;
  position: { x: number; y: number };
  onDrag: (id: string, x: number, y: number) => void;
  onStartConnection: (nodeId: string, portType: "output") => void;
  onCompleteConnection: (nodeId: string, portType: "input") => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteToken: (tokenId: string) => void;
  onDisconnectNode: (nodeId: string) => void;
  isConnecting: boolean;
  selectedNode: string | null;
  selectedTokens: Set<string>;
  onSelect: (nodeId: string, ctrlKey?: boolean) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  canvasOffset: { x: number; y: number };
  canvasScale: number;
  isPanningMode: boolean;
}

const NodeBubble: React.FC<NodeBubbleProps> = ({
  token,
  position,
  onDrag,
  onStartConnection,
  onCompleteConnection,
  onDeleteNode,
  onDeleteToken,
  onDisconnectNode,
  isConnecting,
  selectedNode,
  selectedTokens,
  onSelect,
  canvasRef,
  canvasOffset,
  canvasScale,
  isPanningMode,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("connection-port")) return;
    if (isPanningMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pointerContentX =
      (e.clientX - rect.left - canvasOffset.x) / canvasScale;
    const pointerContentY =
      (e.clientY - rect.top - canvasOffset.y) / canvasScale;

    setIsDragging(true);
    setDragStart({
      x: pointerContentX - position.x,
      y: pointerContentY - position.y,
    });
    onSelect(token.id, e.ctrlKey || e.metaKey);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        requestAnimationFrame(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const pointerContentX =
            (e.clientX - rect.left - canvasOffset.x) / canvasScale;
          const pointerContentY =
            (e.clientY - rect.top - canvasOffset.y) / canvasScale;
          const newX = pointerContentX - dragStart.x;
          const newY = pointerContentY - dragStart.y;
          onDrag(token.id, newX, newY);
        });
      }
    },
    [isDragging, dragStart, token.id, onDrag, canvasRef, canvasOffset, canvasScale],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const isSelected = selectedNode === token.id;
  const isMultiSelected = selectedTokens.has(token.id);

  return (
    <div
      ref={nodeRef}
      className={`absolute min-w-[150px] max-w-[200px] bg-white/10 backdrop-blur-xl border-2 rounded-2xl p-4 cursor-move select-none shadow-lg hover:shadow-xl z-20 ${
        isDragging ? "transition-none" : "transition-all duration-300"
      } ${
        isSelected
          ? "border-blue-400 shadow-blue-400/30"
          : isMultiSelected
            ? "border-green-400 shadow-green-400/30"
            : "border-white/20 hover:border-blue-400/60"
      }`}
      style={{
        left: position.x,
        top: position.y,
        transform: isDragging
          ? "scale(1)"
          : isSelected
            ? "scale(1.02)"
            : "scale(1)",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Input Port */}
      <div
        className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-crosshair transition-all hover:scale-125 hover:bg-blue-400"
        onMouseUp={(e) => {
          e.stopPropagation();
          if (isConnecting) {
            onCompleteConnection(token.id, "input");
          }
        }}
        onMouseEnter={(e) => {
          if (isConnecting) {
            e.currentTarget.style.transform = "translateX(-50%) scale(1.5)";
            e.currentTarget.style.background = "#22c55e";
          }
        }}
        onMouseLeave={(e) => {
          if (isConnecting) {
            e.currentTarget.style.transform = "translateX(-50%)";
            e.currentTarget.style.background = "#3b82f6";
          }
        }}
      />

      {/* Node Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
          {token.layer}
        </span>
      </div>

      {/* Node Content */}
      <div className="mb-2 font-semibold text-sm text-white">
        {token.type === "color" && token.value.startsWith("#") && (
          <div
            className="inline-block w-3 h-3 rounded border border-white/20 mr-2"
            style={{ backgroundColor: token.value }}
          />
        )}
        {token.name}
      </div>
      <div className="text-xs text-gray-300 bg-black/20 p-2 rounded-lg break-words">
        {token.value}
      </div>

      {/* Action Buttons */}
      {isSelected && (
        <div className="flex gap-1 mt-2 justify-center">
          <button
            className="w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded flex items-center justify-center transition-all text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDisconnectNode(token.id);
            }}
            title="Disconnect connections"
          >
            <X size={10} />
          </button>
          <button
            className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-all text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(token.id);
            }}
            title="Remove from canvas"
          >
            <X size={10} />
          </button>
          <button
            className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center transition-all text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteToken(token.id);
            }}
            title="Delete token completely"
          >
            <Trash2 size={10} />
          </button>
        </div>
      )}

      {/* Output Port */}
      <div
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-crosshair transition-all hover:scale-125 hover:bg-blue-400"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnection(token.id, "output");
        }}
      />
    </div>
  );
};

interface CanvasGroupProps {
  group: TokenGroup;
  tokens: Token[];
  nodePositions: { [key: string]: { x: number; y: number } };
  onToggleCollapse: (groupId: string) => void;
  onUngroupTokens: (groupId: string) => void;
  onSelectGroup: (groupId: string) => void;
  isSelected: boolean;
  onDragGroup: (groupId: string, x: number, y: number) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  canvasOffset: { x: number; y: number };
  canvasScale: number;
  isPanningMode: boolean;
}

const CanvasGroup: React.FC<CanvasGroupProps> = ({
  group,
  tokens,
  nodePositions,
  onToggleCollapse,
  onUngroupTokens,
  onSelectGroup,
  isSelected,
  onDragGroup,
  canvasRef,
  canvasOffset,
  canvasScale,
  isPanningMode,
}) => {
  const groupTokens = tokens.filter((token) =>
    group.tokenIds.includes(token.id),
  );
  const isCollapsed = group.canvasCollapsed ?? false;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const groupRef = useRef<HTMLDivElement>(null);

  // Get actual positions of tokens in this group
  const tokenPositions = group.tokenIds
    .map((id) => nodePositions[id])
    .filter(Boolean);

  if (tokenPositions.length === 0) return null;

  // Calculate group bounds
  const minX = Math.min(...tokenPositions.map((p) => p.x));
  const minY = Math.min(...tokenPositions.map((p) => p.y));
  const maxX = Math.max(...tokenPositions.map((p) => p.x + 200)); // Node width
  const maxY = Math.max(...tokenPositions.map((p) => p.y + 120)); // Node height

  // Handle group dragging
  const handleGroupMouseDown = (e: React.MouseEvent) => {
    if (isPanningMode) return;
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pointerContentX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
    const pointerContentY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
    
    setIsDragging(true);
    setDragStart({
      x: pointerContentX - minX,
      y: pointerContentY - minY,
    });
    onSelectGroup(group.id);
  };

  const handleGroupMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        requestAnimationFrame(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const pointerContentX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
          const pointerContentY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
          
          const newMinX = pointerContentX - dragStart.x;
          const newMinY = pointerContentY - dragStart.y;
          
          // Calculate the offset to move all tokens in the group
          const offsetX = newMinX - minX;
          const offsetY = newMinY - minY;
          
          // Move all tokens in the group
          group.tokenIds.forEach((tokenId) => {
            const currentPos = nodePositions[tokenId];
            if (currentPos) {
              onDragGroup(tokenId, currentPos.x + offsetX, currentPos.y + offsetY);
            }
          });
        });
      }
    },
    [isDragging, dragStart, minX, minY, group.tokenIds, nodePositions, onDragGroup, canvasRef, canvasOffset, canvasScale],
  );

  const handleGroupMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleGroupMouseMove);
      document.addEventListener("mouseup", handleGroupMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleGroupMouseMove);
        document.removeEventListener("mouseup", handleGroupMouseUp);
      };
    }
  }, [isDragging, handleGroupMouseMove, handleGroupMouseUp]);

  return (
    <div
      ref={groupRef}
      className={`absolute border-2 border-dashed rounded-xl p-2 transition-all cursor-move ${
        isSelected
          ? "border-green-400 bg-green-400/10"
          : "border-green-300/50 bg-green-300/5"
      }`}
      style={{
        left: minX - 10,
        top: minY - 35,
        width: isCollapsed ? 220 : maxX - minX + 20,
        height: isCollapsed ? 140 : maxY - minY + 45,
        zIndex: 10,
      }}
      onMouseDown={handleGroupMouseDown}
    >
      {/* Group Header */}
      <div className="absolute -top-8 left-0 bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(group.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="hover:bg-green-600 p-1 rounded transition-colors"
        >
          {isCollapsed ? "▶" : "▼"}
        </button>
        <span>{group.name}</span>
        <span className="text-green-200 text-xs">({groupTokens.length})</span>
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUngroupTokens(group.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="hover:bg-red-500 bg-red-400 p-1 rounded transition-colors ml-1"
            title="Ungroup"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Collapsed Content */}
      {isCollapsed && (
        <div className="p-4 bg-green-400/10 rounded-lg h-full flex flex-col justify-center items-center">
          <div className="text-green-400 font-semibold text-sm mb-2">
            {group.name}
          </div>
          <div className="text-green-300 text-xs">
            {groupTokens.length} tokens grouped
          </div>
          <div className="flex -space-x-1 mt-2">
            {groupTokens.slice(0, 3).map((token) => (
              <div
                key={token.id}
                className="w-6 h-6 bg-white/20 rounded-full border border-white/30 flex items-center justify-center"
              >
                {token.type === "color" && token.value.startsWith("#") ? (
                  <div
                    className="w-4 h-4 rounded-full border border-white/50"
                    style={{ backgroundColor: token.value }}
                  />
                ) : (
                  <span className="text-xs text-white">{token.name[0]}</span>
                )}
              </div>
            ))}
            {groupTokens.length > 3 && (
              <div className="w-6 h-6 bg-white/20 rounded-full border border-white/30 flex items-center justify-center">
                <span className="text-xs text-white">
                  +{groupTokens.length - 3}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Index() {
  const [tokens, setTokens] = useState<{ [key: string]: Token[] }>({
    base: [],
    semantic: [],
    specific: [],
  });

  const [nodePositions, setNodePositions] = useState<{
    [key: string]: { x: number; y: number };
  }>({});
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    port: "output";
  } | null>(null);
  const [tempConnection, setTempConnection] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Canvas state
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<
    "base" | "semantic" | "specific"
  >("base");
  const [currentTokenType, setCurrentTokenType] =
    useState<Token["type"]>("color");
  const [tokenForm, setTokenForm] = useState({ name: "", value: "" });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    tokenId: string;
    tokenName: string;
  } | null>(null);

  // Grouping state
  const [tokenGroups, setTokenGroups] = useState<TokenGroup[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "" });
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Layer collapse state
  const [collapsedLayers, setCollapsedLayers] = useState<{
    [key: string]: boolean;
  }>({
    base: false,
    semantic: false,
    specific: false,
  });

  // Sample data
  useEffect(() => {
    const sampleTokens = [
      {
        id: "token_1",
        name: "primary-blue",
        value: "#4a90e2",
        type: "color" as const,
        layer: "base" as const,
      },
      {
        id: "token_2",
        name: "secondary-purple",
        value: "#805ad5",
        type: "color" as const,
        layer: "base" as const,
      },
      {
        id: "token_3",
        name: "font-size-base",
        value: "16px",
        type: "text" as const,
        layer: "base" as const,
      },
      {
        id: "token_4",
        name: "color-brand",
        value: "{base.primary-blue}",
        type: "color" as const,
        layer: "semantic" as const,
      },
      {
        id: "token_5",
        name: "button-bg",
        value: "{semantic.color-brand}",
        type: "color" as const,
        layer: "specific" as const,
      },
    ];

    const tokenGroups = sampleTokens.reduce(
      (acc, token) => {
        acc[token.layer] = acc[token.layer] || [];
        acc[token.layer].push(token);
        return acc;
      },
      {} as { [key: string]: Token[] },
    );

    setTokens(tokenGroups);
  }, []);

  // Canvas dragging
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const isMiddleOrRight = e.button === 1 || e.button === 2;
    if (isMiddleOrRight || isSpacePressed || e.target === e.currentTarget) {
      setIsDraggingCanvas(true);
      setSelectedNode(null);
      setSelectedTokens(new Set());
      setSelectedGroup(null);
    }
  };

  const handleCanvasMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDraggingCanvas) {
        setCanvasOffset((prev) => ({
          x: prev.x + e.movementX,
          y: prev.y + e.movementY,
        }));
      }

      if (isConnecting && connectionStart) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const startPos = nodePositions[connectionStart.nodeId];
          if (startPos) {
            setTempConnection({
              x1: startPos.x + 75, // Node width / 2
              y1: startPos.y + 100, // Node height
              x2:
                (e.clientX - rect.left) / canvasScale - canvasOffset.x,
              y2:
                (e.clientY - rect.top) / canvasScale - canvasOffset.y,
            });
          }
        }
      }
    },
    [
      isDraggingCanvas,
      isConnecting,
      connectionStart,
      nodePositions,
      canvasOffset,
      canvasScale,
    ],
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingCanvas(false);
    if (isConnecting) {
      setIsConnecting(false);
      setConnectionStart(null);
      setTempConnection(null);
    }
  }, [isConnecting]);

  useEffect(() => {
    document.addEventListener("mousemove", handleCanvasMouseMove);
    document.addEventListener("mouseup", handleCanvasMouseUp);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        zoomAtAnchor(1.1);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "-")) {
        e.preventDefault();
        zoomAtAnchor(1 / 1.1);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "0")) {
        e.preventDefault();
        resetZoom();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        setViewportSize({ width: canvas.clientWidth, height: canvas.clientHeight });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      document.removeEventListener("mousemove", handleCanvasMouseMove);
      document.removeEventListener("mouseup", handleCanvasMouseUp);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleCanvasMouseMove, handleCanvasMouseUp]);

  // Token operations
  const addToken = () => {
    if (!tokenForm.name || !tokenForm.value) return;

    const newToken: Token = {
      id: `token_${Date.now()}`,
      name: tokenForm.name,
      value: tokenForm.value,
      type: currentTokenType,
      layer: currentLayer,
    };

    setTokens((prev) => ({
      ...prev,
      [currentLayer]: [...prev[currentLayer], newToken],
    }));

    setTokenForm({ name: "", value: "" });
    setIsModalOpen(false);
  };

  const onDragFromPanel = (token: Token, e: React.DragEvent) => {
    e.dataTransfer.setData("token", JSON.stringify(token));
  };

  const onDropToCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const tokenData = e.dataTransfer.getData("token");
    if (tokenData) {
      const token = JSON.parse(tokenData) as Token;
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x =
          (e.clientX - rect.left) / canvasScale - canvasOffset.x;
        const y =
          (e.clientY - rect.top) / canvasScale - canvasOffset.y;

        setNodePositions((prev) => ({
          ...prev,
          [token.id]: { x, y },
        }));
      }
    }
  };

  // Zoom helpers
  const clampScale = (s: number) => Math.min(2, Math.max(0.25, s));
  const setScaleAroundPoint = (newScale: number, anchorX: number, anchorY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const oldScale = canvasScale;
    const clamped = clampScale(newScale);
    const ax = anchorX - rect.left;
    const ay = anchorY - rect.top;
    setCanvasOffset((prev) => ({
      x: prev.x + ax * (1 / clamped - 1 / oldScale),
      y: prev.y + ay * (1 / clamped - 1 / oldScale),
    }));
    setCanvasScale(clamped);
  };
  const zoomAtAnchor = (factor: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setScaleAroundPoint(canvasScale * factor, centerX, centerY);
  };
  const resetZoom = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setCanvasOffset({ x: 0, y: 0 });
    setCanvasScale(1);
  };
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setScaleAroundPoint(canvasScale * factor, e.clientX, e.clientY);
    }
  };

  // Connection operations
  const handleStartConnection = (nodeId: string, portType: "output") => {
    setIsConnecting(true);
    setConnectionStart({ nodeId, port: portType });
  };

  const handleCompleteConnection = (nodeId: string, portType: "input") => {
    if (connectionStart && connectionStart.nodeId !== nodeId) {
      const newConnection: Connection = {
        id: `conn_${Date.now()}`,
        from: connectionStart.nodeId,
        to: nodeId,
        fromPort: connectionStart.port,
        toPort: portType,
      };

      setConnections((prev) => [...prev, newConnection]);

      // Update the target token's value to reference the source
      const sourceToken = findTokenById(connectionStart.nodeId);
      if (sourceToken) {
        setTokens((prevTokens) => {
          const newTokens = { ...prevTokens };
          Object.keys(newTokens).forEach((layer) => {
            newTokens[layer] = newTokens[layer].map((token) =>
              token.id === nodeId
                ? {
                    ...token,
                    value: `{${sourceToken.layer}.${sourceToken.name}}`,
                  }
                : token,
            );
          });
          return newTokens;
        });
      }
    }

    setIsConnecting(false);
    setConnectionStart(null);
    setTempConnection(null);
  };

  const deleteToken = (tokenId: string) => {
    // Remove token from tokens state
    setTokens((prevTokens) => {
      const newTokens = { ...prevTokens };
      Object.keys(newTokens).forEach((layer) => {
        newTokens[layer] = newTokens[layer].filter(
          (token) => token.id !== tokenId,
        );
      });
      return newTokens;
    });

    // Remove node from canvas if it exists
    setNodePositions((prev) => {
      const newPositions = { ...prev };
      delete newPositions[tokenId];
      return newPositions;
    });

    // Remove all connections to/from this token
    setConnections((prev) =>
      prev.filter((conn) => conn.from !== tokenId && conn.to !== tokenId),
    );

    // Clear selection if this token was selected
    if (selectedNode === tokenId) {
      setSelectedNode(null);
    }
  };

  const deleteNode = (nodeId: string) => {
    // Remove node from canvas
    setNodePositions((prev) => {
      const newPositions = { ...prev };
      delete newPositions[nodeId];
      return newPositions;
    });

    // Remove all connections to/from this node
    setConnections((prev) =>
      prev.filter((conn) => conn.from !== nodeId && conn.to !== nodeId),
    );

    // Clear selection if this node was selected
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  const disconnectNode = (nodeId: string) => {
    // Remove all connections to/from this node but keep the node on canvas
    setConnections((prev) =>
      prev.filter((conn) => conn.from !== nodeId && conn.to !== nodeId),
    );
  };

  // Multi-selection and grouping functions
  const handleNodeSelect = (nodeId: string, ctrlKey: boolean = false) => {
    if (ctrlKey) {
      // Multi-selection with Ctrl key
      setSelectedTokens((prev) => {
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
      // Single selection
      setSelectedNode(nodeId);
      setSelectedTokens(new Set());
      setSelectedGroup(null);
    }
  };

  const createGroup = () => {
    if (selectedTokens.size < 2 || !groupForm.name.trim()) return;

    // Calculate group position based on selected tokens' positions
    const selectedPositions = Array.from(selectedTokens)
      .map((tokenId) => nodePositions[tokenId])
      .filter(Boolean);

    let groupPosition;
    if (selectedPositions.length > 0) {
      const avgX =
        selectedPositions.reduce((sum, pos) => sum + pos.x, 0) /
        selectedPositions.length;
      const avgY =
        selectedPositions.reduce((sum, pos) => sum + pos.y, 0) /
        selectedPositions.length;
      groupPosition = { x: avgX, y: avgY };
    }

    const newGroup: TokenGroup = {
      id: `group_${Date.now()}`,
      name: groupForm.name.trim(),
      tokenIds: Array.from(selectedTokens),
      collapsed: false,
      canvasCollapsed: false,
      position: groupPosition,
    };

    setTokenGroups((prev) => [...prev, newGroup]);
    setSelectedTokens(new Set());
    setIsGroupModalOpen(false);
    setGroupForm({ name: "" });
  };

  const toggleCanvasGroupCollapse = (groupId: string) => {
    setTokenGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, canvasCollapsed: !group.canvasCollapsed }
          : group,
      ),
    );
  };

  const ungroupTokens = (groupId: string) => {
    setTokenGroups((prev) => prev.filter((group) => group.id !== groupId));
    setSelectedGroup(null);
  };

  const deleteGroup = (groupId: string) => {
    const group = tokenGroups.find((g) => g.id === groupId);
    if (group) {
      // Remove all nodes from canvas that belong to this group
      group.tokenIds.forEach((tokenId) => {
        setNodePositions((prev) => {
          const newPositions = { ...prev };
          delete newPositions[tokenId];
          return newPositions;
        });
      });
      // Remove connections
      setConnections((prev) =>
        prev.filter(
          (conn) =>
            !group.tokenIds.includes(conn.from) &&
            !group.tokenIds.includes(conn.to),
        ),
      );
    }
    setTokenGroups((prev) => prev.filter((group) => group.id !== groupId));
    setSelectedGroup(null);
  };

  const toggleGroupCollapse = (groupId: string) => {
    setTokenGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, collapsed: !group.collapsed }
          : group,
      ),
    );
  };

  const toggleLayerCollapse = (layer: string) => {
    setCollapsedLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const deleteConnection = (connectionId: string) => {
    setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
  };

  const findTokenById = (id: string): Token | null => {
    for (const layer of Object.values(tokens)) {
      const token = layer.find((t) => t.id === id);
      if (token) return token;
    }
    return null;
  };

  const createConnectionPath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cp1x = x1;
    const cp1y = y1 + Math.abs(dy) * 0.5;
    const cp2x = x2;
    const cp2y = y2 - Math.abs(dy) * 0.5;
    return `M ${x1} ${y1} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2} ${y2}`;
  };

  const exportTokens = () => {
    // Transform tokens to Style Dictionary format
    const styleDictionaryTokens: any = {};
    
    // Process each layer
    Object.keys(tokens).forEach(layer => {
      if (!styleDictionaryTokens[layer]) {
        styleDictionaryTokens[layer] = {};
      }
      
      tokens[layer].forEach(token => {
        // Group tokens by type
        if (!styleDictionaryTokens[layer][token.type]) {
          styleDictionaryTokens[layer][token.type] = {};
        }
        
        // Convert token to Style Dictionary format
        const styleDictionaryToken: any = {
          value: token.value,
          type: token.type,
        };
        
        // Add additional metadata
        if (token.type === 'color') {
          styleDictionaryToken.type = 'color';
        } else if (token.type === 'text') {
          styleDictionaryToken.type = 'dimension';
        } else if (token.type === 'spacing') {
          styleDictionaryToken.type = 'dimension';
        }
        
        // Handle references (e.g., "{base.primary-blue}")
        if (token.value.startsWith('{') && token.value.endsWith('}')) {
          const reference = token.value.slice(1, -1); // Remove braces
          const [refLayer, refName] = reference.split('.');
          styleDictionaryToken.value = `{${refLayer}.${token.type}.${refName}.value}`;
        }
        
        styleDictionaryTokens[layer][token.type][token.name] = styleDictionaryToken;
      });
    });

    // Create the final Style Dictionary structure
    const exportData = {
      // Style Dictionary expects tokens at the root level
      ...styleDictionaryTokens,
      
      // Add metadata as a separate property (optional)
      $metadata: {
        version: "1.0",
        exportDate: new Date().toISOString(),
        generator: "DTM - Design Token Manager",
        layers: ["base", "semantic", "specific"],
        totalTokens: Object.values(tokens).flat().length,
        connections: connections.length,
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "design-tokens.json");
    link.click();
  };

  const colorPalette = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FECA57",
    "#FF9FF3",
    "#54A0FF",
    "#5F27CD",
    "#00D2D3",
    "#FF6348",
    "#2ED573",
    "#FFA502",
    "#3742FA",
    "#2F3542",
    "#57606F",
    "#A4B0BE",
  ];

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Left Panel */}
      <div className="w-80 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700 overflow-y-auto">
        <div className="p-5">
          {/* Token Types */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Token Types
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  "color",
                  "text",
                  "spacing",
                  "boolean",
                  "string",
                  "number",
                ] as const
              ).map((type) => (
                <button
                  key={type}
                  className={`p-3 text-xs rounded-lg border transition-all ${
                    currentTokenType === type
                      ? "bg-blue-500/30 border-blue-400 text-white"
                      : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-blue-500/20 hover:border-blue-400"
                  }`}
                  onClick={() => setCurrentTokenType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Token Layers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Token Layers
              </h3>
              <div className="flex gap-1">
                <button
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-600 hover:border-slate-500 transition-colors"
                  onClick={() => setCollapsedLayers({ base: true, semantic: true, specific: true })}
                  title="Collapse all layers"
                >
                  Collapse All
                </button>
                <button
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-600 hover:border-slate-500 transition-colors"
                  onClick={() => setCollapsedLayers({ base: false, semantic: false, specific: false })}
                  title="Expand all layers"
                >
                  Expand All
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {(["base", "semantic", "specific"] as const).map((layer) => (
                <div
                  key={layer}
                  className="bg-slate-700/30 border border-slate-600 rounded-xl overflow-hidden"
                >
                  {/* Layer Header */}
                  <div className="p-4 bg-slate-700/50 border-b border-slate-600 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                        onClick={() => toggleLayerCollapse(layer)}
                        title={collapsedLayers[layer] ? "Expand layer" : "Collapse layer"}
                      >
                        {collapsedLayers[layer] ? "▶" : "▼"}
                      </button>
                      <span className="font-semibold text-sm capitalize">
                        {layer} Tokens
                      </span>
                      <span className="text-xs text-slate-500">
                        ({tokens[layer]?.length || 0})
                      </span>
                    </div>
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1 transition-colors"
                      onClick={() => {
                        setCurrentLayer(layer);
                        setIsModalOpen(true);
                      }}
                    >
                      <Plus size={12} />
                      Add
                    </button>
                  </div>

                  {/* Layer Tokens */}
                  {!collapsedLayers[layer] && (
                    <div className="p-3 space-y-2">
                      {tokens[layer]?.map((token) => (
                        <div
                          key={token.id}
                          className="bg-slate-600/50 border border-slate-500 rounded-lg p-3 hover:bg-slate-600/70 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className="flex-1 cursor-grab"
                              draggable
                              onDragStart={(e) => onDragFromPanel(token, e)}
                            >
                              <div className="font-medium text-sm flex items-center">
                                {token.type === "color" &&
                                  token.value.startsWith("#") && (
                                    <div
                                      className="w-3 h-3 rounded border border-white/20 mr-2"
                                      style={{ backgroundColor: token.value }}
                                    />
                                  )}
                                {token.name}
                              </div>
                              <div className="text-xs text-slate-400 break-all">
                                {token.value}
                              </div>
                            </div>
                            {/* Delete Token Button */}
                            <button
                              className="opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center transition-all ml-2"
                              onClick={() =>
                                setDeleteConfirmation({
                                  tokenId: token.id,
                                  tokenName: token.name,
                                })
                              }
                              title="Delete token completely"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Token Groups Section */}
          {tokenGroups.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
                Token Groups
              </h3>
              <div className="space-y-3">
                {tokenGroups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-slate-700/30 border border-slate-600 rounded-xl overflow-hidden"
                  >
                    {/* Group Header */}
                    <div className="p-4 bg-slate-700/50 border-b border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-slate-400 hover:text-white transition-colors"
                            onClick={() => toggleGroupCollapse(group.id)}
                          >
                            {group.collapsed ? "▶" : "▼"}
                          </button>
                          <button
                            className={`font-semibold text-sm transition-colors ${
                              selectedGroup === group.id
                                ? "text-green-300"
                                : "text-green-400 hover:text-green-300"
                            }`}
                            onClick={() =>
                              setSelectedGroup(
                                selectedGroup === group.id ? null : group.id,
                              )
                            }
                          >
                            {group.name}
                          </button>
                          <span className="text-xs text-slate-500">
                            ({group.tokenIds.length} tokens)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {selectedGroup === group.id && (
                            <button
                              className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs transition-colors"
                              onClick={() => ungroupTokens(group.id)}
                              title="Ungroup tokens"
                            >
                              Ungroup
                            </button>
                          )}
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
                            onClick={() => deleteGroup(group.id)}
                            title="Delete group"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Group Tokens */}
                    {!group.collapsed && (
                      <div className="p-3 space-y-2">
                        {group.tokenIds.map((tokenId) => {
                          const token = Object.values(tokens)
                            .flat()
                            .find((t) => t.id === tokenId);
                          if (!token) return null;

                          return (
                            <div
                              key={tokenId}
                              className="bg-slate-600/30 border border-slate-500/50 rounded-lg p-2 text-sm"
                            >
                              <div className="flex items-center">
                                {token.type === "color" &&
                                  token.value.startsWith("#") && (
                                    <div
                                      className="w-3 h-3 rounded border border-white/20 mr-2"
                                      style={{ backgroundColor: token.value }}
                                    />
                                  )}
                                <span className="font-medium">
                                  {token.name}
                                </span>
                                <span className="text-slate-500 ml-2">
                                  ({token.layer})
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                {token.value}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Top Bar */}
        <div className="absolute top-0 right-0 p-5 z-50 flex gap-3">
          {/* Multi-selection Menu */}
          {selectedTokens.size >= 2 && (
            <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-3 flex items-center gap-3">
              <span className="text-sm text-slate-300">
                {selectedTokens.size} tokens selected
              </span>
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                onClick={() => setIsGroupModalOpen(true)}
              >
                Group Tokens
              </button>
              <button
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                onClick={() => setSelectedTokens(new Set())}
              >
                Clear Selection
              </button>
            </div>
          )}

          {/* Help text for single token selection */}
          {selectedTokens.size === 1 && (
            <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-3">
              <span className="text-xs text-slate-400">
                Hold Ctrl and click more tokens to group them
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
              onClick={exportTokens}
              title="Export in Style Dictionary format"
            >
              <Download size={16} />
              Export for Style Dictionary
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`w-full h-full ${isSpacePressed ? "cursor-grab active:cursor-grabbing" : "cursor-grab active:cursor-grabbing"}`}
          onMouseDown={handleCanvasMouseDown}
          onDrop={onDropToCanvas}
          onDragOver={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          onWheel={handleWheel}
        >
          {/* SVG for connections */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
            }}
          >
            {/* Permanent connections */}
            {connections.map((connection) => {
              const fromPos = nodePositions[connection.from];
              const toPos = nodePositions[connection.to];
              if (!fromPos || !toPos) return null;

              // Check if either token is in a collapsed group
              const fromTokenGroup = tokenGroups.find((group) =>
                group.tokenIds.includes(connection.from)
              );
              const toTokenGroup = tokenGroups.find((group) =>
                group.tokenIds.includes(connection.to)
              );
              
              // Hide connection if either token is in a collapsed group
              if (fromTokenGroup?.canvasCollapsed || toTokenGroup?.canvasCollapsed) {
                return null;
              }

              const path = createConnectionPath(
                fromPos.x + 75,
                fromPos.y + 100,
                toPos.x + 75,
                toPos.y,
              );

              return (
                <path
                  key={connection.id}
                  d={path}
                  stroke="#3b82f6"
                  strokeWidth="4"
                  fill="none"
                  className="drop-shadow-sm"
                />
              );
            })}

            {/* Temporary connection */}
            {tempConnection && (
              <path
                d={createConnectionPath(
                  tempConnection.x1,
                  tempConnection.y1,
                  tempConnection.x2,
                  tempConnection.y2,
                )}
                stroke="#3b82f6"
                strokeWidth="4"
                strokeDasharray="8,4"
                fill="none"
                opacity="0.8"
              />
            )}
          </svg>

          {/* Canvas content */}
          <div
            className="relative w-full h-full"
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
            }}
          >
            {/* Render Canvas Groups */}
            {tokenGroups.map((group) => (
              <CanvasGroup
                key={group.id}
                group={group}
                tokens={Object.values(tokens).flat()}
                nodePositions={nodePositions}
                onToggleCollapse={toggleCanvasGroupCollapse}
                onUngroupTokens={ungroupTokens}
                onSelectGroup={(groupId) =>
                  setSelectedGroup(selectedGroup === groupId ? null : groupId)
                }
                isSelected={selectedGroup === group.id}
                onDragGroup={(tokenId, x, y) =>
                  setNodePositions((prev) => ({ ...prev, [tokenId]: { x, y } }))
                }
                canvasRef={canvasRef}
                canvasOffset={canvasOffset}
                canvasScale={canvasScale}
                isPanningMode={isSpacePressed || isDraggingCanvas}
              />
            ))}

            {/* Render Individual Tokens */}
            {Object.values(tokens)
              .flat()
              .map((token) => {
                const position = nodePositions[token.id];
                if (!position) return null;

                // Hide tokens that are in a collapsed group
                const tokenGroup = tokenGroups.find((group) =>
                  group.tokenIds.includes(token.id),
                );
                if (tokenGroup?.canvasCollapsed) return null;

                return (
                  <NodeBubble
                    key={token.id}
                    token={token}
                    position={position}
                    onDrag={(id, x, y) =>
                      setNodePositions((prev) => ({ ...prev, [id]: { x, y } }))
                    }
                    onStartConnection={handleStartConnection}
                    onCompleteConnection={handleCompleteConnection}
                    onDeleteNode={deleteNode}
                    onDeleteToken={(tokenId) =>
                      setDeleteConfirmation({ tokenId, tokenName: token.name })
                    }
                    onDisconnectNode={disconnectNode}
                    isConnecting={isConnecting}
                    selectedNode={selectedNode}
                    selectedTokens={selectedTokens}
                    onSelect={handleNodeSelect}
                    canvasRef={canvasRef}
                    canvasOffset={canvasOffset}
                    canvasScale={canvasScale}
                    isPanningMode={isSpacePressed || isDraggingCanvas}
                  />
                );
              })}
          </div>

          {/* Bottom-right Controls & Minimap */}
          <div className="absolute bottom-4 right-4 z-50 flex items-end gap-3">
            {/* Zoom Controls */}
            <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-lg p-2 flex items-center gap-2 shadow-lg">
              <button
                className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 border border-slate-600 flex items-center justify-center"
                onClick={() => zoomAtAnchor(1 / 1.1)}
                title="Zoom Out"
              >
                <Minus size={16} />
              </button>
              <div className="text-xs text-slate-300 w-14 text-center select-none">
                {Math.round(canvasScale * 100)}%
              </div>
              <button
                className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 border border-slate-600 flex items-center justify-center"
                onClick={() => zoomAtAnchor(1.1)}
                title="Zoom In"
              >
                <Plus size={16} />
              </button>
              <button
                className="ml-1 px-2 h-8 rounded bg-slate-700 hover:bg-slate-600 border border-slate-600 text-xs text-slate-200"
                onClick={resetZoom}
                title="Reset Zoom"
              >
                Reset
              </button>
            </div>

            {/* Minimap */}
            {(() => {
              const tokensArray = Object.values(tokens).flat();
              const positioned = tokensArray
                .map((t) => ({ t, p: nodePositions[t.id] }))
                .filter((x) => x.p);
              const fallbackBounds = { minX: -500, minY: -500, maxX: 1500, maxY: 1500 };
              let minX = fallbackBounds.minX;
              let minY = fallbackBounds.minY;
              let maxX = fallbackBounds.maxX;
              let maxY = fallbackBounds.maxY;
              if (positioned.length > 0) {
                minX = Math.min(...positioned.map((x) => x.p!.x));
                minY = Math.min(...positioned.map((x) => x.p!.y));
                maxX = Math.max(...positioned.map((x) => x.p!.x + 200));
                maxY = Math.max(...positioned.map((x) => x.p!.y + 120));
              }
              const boundsWidth = Math.max(1, maxX - minX);
              const boundsHeight = Math.max(1, maxY - minY);
              const miniW = 220;
              const miniH = 160;
              const miniScale = Math.min(miniW / boundsWidth, miniH / boundsHeight);
              const miniOffsetX = (miniW - boundsWidth * miniScale) / 2;
              const miniOffsetY = (miniH - boundsHeight * miniScale) / 2;
              const viewMinX = (0 / canvasScale) - canvasOffset.x;
              const viewMinY = (0 / canvasScale) - canvasOffset.y;
              const viewMaxX = (viewportSize.width / canvasScale) - canvasOffset.x;
              const viewMaxY = (viewportSize.height / canvasScale) - canvasOffset.y;
              const viewX = (viewMinX - minX) * miniScale + miniOffsetX;
              const viewY = (viewMinY - minY) * miniScale + miniOffsetY;
              const viewW = (viewMaxX - viewMinX) * miniScale;
              const viewH = (viewMaxY - viewMinY) * miniScale;
              return (
                <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-2 shadow-lg">
                  <svg width={miniW} height={miniH} className="block">
                    <rect x={0} y={0} width={miniW} height={miniH} fill="#0f172a" rx={8} />
                    {/* Content bounds */}
                    <rect
                      x={miniOffsetX}
                      y={miniOffsetY}
                      width={boundsWidth * miniScale}
                      height={boundsHeight * miniScale}
                      fill="#1f2937"
                      stroke="#334155"
                      rx={6}
                    />
                    {/* Nodes */}
                    {positioned.map(({ t, p }) => (
                      <rect
                        key={t.id}
                        x={(p!.x - minX) * miniScale + miniOffsetX}
                        y={(p!.y - minY) * miniScale + miniOffsetY}
                        width={200 * miniScale}
                        height={120 * miniScale}
                        fill="#3b82f6"
                        opacity={0.3}
                        rx={3}
                      />
                    ))}
                    {/* Viewport */}
                    <rect
                      x={viewX}
                      y={viewY}
                      width={viewW}
                      height={viewH}
                      fill="none"
                      stroke="#93c5fd"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-xl max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-semibold mb-6">Add New Token</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Token Name
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                  value={tokenForm.name}
                  onChange={(e) =>
                    setTokenForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., primary-color"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Token Value
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                  value={tokenForm.value}
                  onChange={(e) =>
                    setTokenForm((prev) => ({ ...prev, value: e.target.value }))
                  }
                  placeholder={
                    currentTokenType === "color" ? "#4a90e2" : "Enter value..."
                  }
                />

                {/* Color Palette for color tokens */}
                {currentTokenType === "color" && (
                  <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                    <div className="text-sm text-slate-400 mb-3">
                      Choose a color:
                    </div>
                    <div className="grid grid-cols-8 gap-2 mb-3">
                      {colorPalette.map((color) => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded border-2 border-transparent hover:border-white/50 transition-all"
                          style={{ backgroundColor: color }}
                          onClick={() =>
                            setTokenForm((prev) => ({ ...prev, value: color }))
                          }
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      className="w-10 h-8 rounded border border-slate-600 bg-transparent cursor-pointer"
                      onChange={(e) =>
                        setTokenForm((prev) => ({
                          ...prev,
                          value: e.target.value.toUpperCase(),
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                onClick={() => {
                  setIsModalOpen(false);
                  setTokenForm({ name: "", value: "" });
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                onClick={addToken}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-red-400">
              Confirm Deletion
            </h2>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete the token "
              <strong>{deleteConfirmation.tokenName}</strong>"? This will remove
              it completely from both the sidebar and canvas, along with all its
              connections.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                onClick={() => setDeleteConfirmation(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                onClick={() => {
                  deleteToken(deleteConfirmation.tokenId);
                  setDeleteConfirmation(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Creation Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-xl max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-semibold mb-6">Create Token Group</h2>

            <div className="mb-4">
              <p className="text-slate-300 text-sm mb-4">
                Create a group with {selectedTokens.size} selected tokens:
              </p>
              <div className="bg-slate-700/50 p-3 rounded-lg mb-4 max-h-32 overflow-y-auto">
                {Array.from(selectedTokens).map((tokenId) => {
                  const token = Object.values(tokens)
                    .flat()
                    .find((t) => t.id === tokenId);
                  return token ? (
                    <div
                      key={tokenId}
                      className="text-sm text-slate-400 flex items-center mb-1"
                    >
                      {token.type === "color" &&
                        token.value.startsWith("#") && (
                          <div
                            className="w-3 h-3 rounded border border-white/20 mr-2"
                            style={{ backgroundColor: token.value }}
                          />
                        )}
                      {token.name} ({token.layer})
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ name: e.target.value })}
                  placeholder="e.g., Brand Colors"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                onClick={() => {
                  setIsGroupModalOpen(false);
                  setGroupForm({ name: "" });
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={createGroup}
                disabled={!groupForm.name.trim()}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
