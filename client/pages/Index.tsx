import React, { useState, useRef, useCallback, useEffect } from "react";
import { 
  Trash2, X, Plus, Download, Minus, RotateCcw, RotateCw, 
  Save as SaveIcon, FolderOpen, ArrowUp, Edit, Users,
  // New icons for future use
  Unlink, Link, Copy, Scissors, Layers, Palette, Settings,
  Eye, EyeOff, Lock, Unlock, Star, Heart, Zap, Target,
  Grid, List, Calendar, Clock, Search, Filter, SortAsc, SortDesc,
  Ungroup
} from "lucide-react";

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

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

interface NodeBubbleProps {
  token: Token;
  position: { x: number; y: number };
  onDrag: (id: string, x: number, y: number) => void;
  onStartConnection: (nodeId: string, portType: "output", socketPosition?: "top" | "bottom" | "left" | "right") => void;
  onCompleteConnection: (nodeId: string, portType: "input", socketPosition?: "top" | "bottom" | "left" | "right") => void;
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
  onDragEnd?: () => void;
  connections: Connection[];
  isInGroup?: boolean;
  onRemoveFromGroup?: (tokenId: string) => void;
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
  onDragEnd,
  connections,
  isInGroup,
  onRemoveFromGroup,
}) => {
  // Check if sockets are connected
  const isSocketConnected = (socketPosition: "top" | "bottom" | "left" | "right") => {
    return connections.some(conn => 
      (conn.from === token.id && conn.fromSocket === socketPosition) ||
      (conn.to === token.id && conn.toSocket === socketPosition)
    );
  };
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
    if (typeof onDragEnd === "function") onDragEnd();
  }, [onDragEnd]);

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
      className={`absolute min-w-[150px] max-w-[200px] dtm-bg-secondary/10 backdrop-blur-xl border-2 rounded-md p-2 cursor-move select-none shadow-lg hover:shadow-xl z-20 ${
        isDragging ? "transition-none" : ""
      } ${
        isSelected
          ? "dtm-border-accent shadow-blue-400/30"
          : isMultiSelected
            ? "dtm-border-accent shadow-green-400/30"
            : "dtm-border-primary hover:dtm-border-accent"
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
      {/* Top Socket - Bidirectional */}
      <div
        className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 border-2 dtm-bg-graphite rounded-full cursor-crosshair hover:scale-125 transition-all ${
          isSocketConnected("top") 
            ? "bg-white border-white" 
            : "border-white dtm-bg-graphite"
        }`}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (!isConnecting) {
            onStartConnection(token.id, "output", "top");
          }
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (isConnecting) {
            onCompleteConnection(token.id, "input", "top");
          }
        }}
        onMouseEnter={(e) => {
          if (isConnecting) {
            e.currentTarget.style.transform = "translateX(-50%) scale(1.5)";
            e.currentTarget.style.borderColor = "#22c55e";
          }
        }}
        onMouseLeave={(e) => {
          if (isConnecting) {
            e.currentTarget.style.transform = "translateX(-50%)";
            e.currentTarget.style.borderColor = isSocketConnected("top") ? "#ffffff" : "#ffffff";
          }
        }}
      />

      {/* Left Socket - Bidirectional */}
      <div
        className={`absolute top-1/2 -left-3 transform -translate-y-1/2 w-4 h-4 border-2 rounded-full cursor-crosshair hover:scale-125 transition-all ${
          isSocketConnected("left") 
            ? "bg-white border-white" 
            : "border-white dtm-bg-graphite"
        }`}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (!isConnecting) {
            onStartConnection(token.id, "output", "left");
          }
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (isConnecting) {
            onCompleteConnection(token.id, "input", "left");
          }
        }}
        onMouseEnter={(e) => {
          if (isConnecting) {
            e.currentTarget.style.transform = "translateY(-50%) scale(1.5)";
            e.currentTarget.style.borderColor = "#22c55e";
          }
        }}
        onMouseLeave={(e) => {
          if (isConnecting) {
            e.currentTarget.style.transform = "translateY(-50%)";
            e.currentTarget.style.borderColor = isSocketConnected("left") ? "#ffffff" : "#ffffff";
          }
        }}
      />

      {/* Right Socket - Bidirectional */}
      <div
        className={`absolute top-1/2 -right-3 transform -translate-y-1/2 w-4 h-4 border-2 rounded-full cursor-crosshair hover:scale-125 transition-all ${
          isSocketConnected("right") 
            ? "bg-white border-white" 
            : "border-white dtm-bg-graphite"
        }`}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (!isConnecting) {
            onStartConnection(token.id, "output", "right");
          }
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (isConnecting) {
            onCompleteConnection(token.id, "input", "right");
          }
        }}
        onMouseEnter={(e) => {
          if (isConnecting) {
            e.currentTarget.style.transform = "translateY(-50%) scale(1.5)";
            e.currentTarget.style.borderColor = "#22c55e";
          }
        }}
        onMouseLeave={(e) => {
          if (isConnecting) {
            e.currentTarget.style.transform = "translateY(-50%)";
            e.currentTarget.style.borderColor = isSocketConnected("right") ? "#ffffff" : "#ffffff";
          }
        }}
      />

      {/* Color Dot - On Border */}
      <div
        className={`absolute -top-2 -left-2 w-4 h-4 rounded-full border-2 ${
          token.layer === "base" ? "dtm-token-base" :
          token.layer === "semantic" ? "dtm-token-semantic" :
          "dtm-token-specific"
        }`}
      />

      {/* Node Content */}
      <div className="mb-2 font-semibold text-sm dtm-text-primary">
        {token.type === "color" && token.value.startsWith("#") && (
          <div
            className="inline-block w-3 h-3 rounded border border-white/20 mr-2"
            style={{ backgroundColor: token.value }}
          />
        )}
        <span
          className="cursor-grab hover:text-blue-400 transition-colors"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("canvas-token", token.id);
            e.dataTransfer.effectAllowed = "move";
            e.stopPropagation();
          }}
        >
          {token.name}
        </span>
      </div>
      <div className="text-xs dtm-text-muted dtm-bg-primary/20 p-2 rounded-md break-words">
        {token.value}
      </div>

      {/* Action Buttons */}
      {isSelected && (
        <div className="flex gap-1 mt-2 justify-center">
          <button
            className="w-6 h-6 dtm-btn-secondary rounded flex items-center justify-center transition-all text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDisconnectNode(token.id);
            }}
            title="Disconnect connections"
          >
            <Unlink size={10}/>
          </button>
          <button
            className="w-6 h-6 dtm-btn-secondary rounded flex items-center justify-center transition-all text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(token.id);
            }}
            title="Remove from canvas"
          >
            <X size={10} />
          </button>
          <button
            className="w-6 h-6 dtm-btn-destructive text-white rounded flex items-center justify-center transition-all text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteToken(token.id);
            }}
            title="Delete token completely"
          >
            <Trash2 size={10} />
          </button>
          {isInGroup && onRemoveFromGroup && (
            <button
              className="w-6 h-6 dtm-btn-secondary rounded flex items-center justify-center transition-all text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromGroup(token.id);
              }}
              title="Remove from group"
            >
              <Ungroup size={10} />
            </button>
          )}
        </div>
      )}

      {/* Bottom Output Port */}
      <div
        className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 border-2 rounded-full cursor-crosshair transition-all hover:scale-125 ${
          isSocketConnected("bottom") 
            ? "bg-white border-white" 
            : "border-white dtm-bg-graphite"
        }`}
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnection(token.id, "output", "bottom");
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
  onAddTokenToGroup: (groupId: string, tokenId: string) => void;
  onRemoveTokenFromGroup: (groupId: string, tokenId: string) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  canvasOffset: { x: number; y: number };
  canvasScale: number;
  isPanningMode: boolean;
  onDragGroupEnd?: () => void;
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
  onAddTokenToGroup,
  onRemoveTokenFromGroup,
  canvasRef,
  canvasOffset,
  canvasScale,
  isPanningMode,
  onDragGroupEnd,
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
    if (typeof onDragGroupEnd === "function") onDragGroupEnd();
  }, [onDragGroupEnd]);

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
      className={`absolute border-2 border-dashed rounded-md p-2 cursor-move ${
        isSelected
          ? "dtm-border-primary bg-green-400/10"
          : "dtm-border-primary bg-green-300/5"
      }`}
      style={{
        left: minX - 10,
        top: minY - 35,
        width: isCollapsed ? 220 : maxX - minX + 20,
        height: isCollapsed ? 140 : maxY - minY + 45,
        zIndex: 10,
      }}
      onMouseDown={handleGroupMouseDown}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.style.borderColor = '#22c55e';
        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
      }}
      onDragLeave={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.backgroundColor = '';
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.backgroundColor = '';
        
        // Handle tokens from sidebar
        const tokenData = e.dataTransfer.getData("token");
        if (tokenData) {
          try {
            const token = JSON.parse(tokenData) as Token;
            onAddTokenToGroup(group.id, token.id);
          } catch (error) {
            console.error("Failed to parse token data:", error);
          }
        }
        
        // Handle existing canvas tokens (dragged by ID)
        const tokenId = e.dataTransfer.getData("canvas-token");
        if (tokenId) {
          onAddTokenToGroup(group.id, tokenId);
        }
      }}
    >
      {/* Group Header */}
      <div className="absolute -top-8 left-0 dtm-bg-tertiary text-white px-2 py-1 rounded-md text-sm  flex items-center gap-2">
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
        <div className="p-2 dtm-btn-secondary rounded-md h-full flex flex-col justify-center items-center">
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
  
  // Token ordering state for drag and drop reordering
  const [tokenOrder, setTokenOrder] = useState<{ [key: string]: string[] }>({
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
    socketPosition?: "top" | "bottom" | "left" | "right";
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
  
  // Performance optimization state
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [renderQuality, setRenderQuality] = useState<'high' | 'medium' | 'low'>('high');
  const canvasOptimizationRef = useRef<number | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<
    "base" | "semantic" | "specific"
  >("base");
  const [currentTokenType, setCurrentTokenType] =
    useState<Token["type"]>("color");
  const [tokenForm, setTokenForm] = useState({ 
    name: "", 
    value: ""
  });
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

  // Layer collapse state (must be before history helpers that capture it)
  const [collapsedLayers, setCollapsedLayers] = useState<{
    [key: string]: boolean;
  }>({
    base: false,
    semantic: false,
    specific: false,
  });

  // History (Undo/Redo)
  type SetupState = {
    tokens: { [key: string]: Token[] };
    nodePositions: { [key: string]: { x: number; y: number } };
    connections: Connection[];
    tokenGroups: TokenGroup[];
    collapsedLayers: { [key: string]: boolean };
  };
  const [history, setHistory] = useState<SetupState[]>([]);
  const [future, setFuture] = useState<SetupState[]>([]);
  const [pendingHistoryMark, setPendingHistoryMark] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [currentSetupName, setCurrentSetupName] = useState<string | null>(null);
  const lastSavedHashRef = useRef<string | null>(null);

  // New state for editing functionality
  const [editingToken, setEditingToken] = useState<{
    id: string;
    name: string;
    value: string;
    type: Token["type"];
    layer: Token["layer"];
  } | null>(null);
  const [editingGroup, setEditingGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [importFormat, setImportFormat] = useState<"style-dictionary" | "dtcg" | "flat-json" | "nested-collections" | "generic">("nested-collections");

  // New state for UI features
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTopBarCollapsed, setIsTopBarCollapsed] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  // Initialize theme on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkTheme(isDark);
  }, []);

  // Theme toggle function
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    if (isDarkTheme) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const captureSetup = useCallback((): SetupState => ({
    tokens,
    nodePositions,
    connections,
    tokenGroups,
    collapsedLayers,
  }), [tokens, nodePositions, connections, tokenGroups, collapsedLayers]);

  const applySnapshot = useCallback((snap: SetupState) => {
    setTokens(snap.tokens);
    setNodePositions(snap.nodePositions);
    setConnections(snap.connections);
    setTokenGroups(snap.tokenGroups);
    setCollapsedLayers(snap.collapsedLayers);
  }, []);

  const markHistory = useCallback(() => {
    setPendingHistoryMark(`${Date.now()}_${Math.random()}`);
  }, []);

  useEffect(() => {
    if (pendingHistoryMark) {
      // Push current snapshot to history and clear redo stack
      setHistory((prev) => {
        const next = [...prev, captureSetup()];
        // Ensure max 20 entries
        while (next.length > 20) next.shift();
        return next;
      });
      setFuture([]);
      setIsDirty(true);
      setPendingHistoryMark(null);
    }
  }, [pendingHistoryMark, captureSetup]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const newPrev = [...prev];
      const last = newPrev.pop()!;
      const current = captureSetup();
      setFuture((f) => [current, ...f]);
      applySnapshot(last);
      return newPrev;
    });
  }, [captureSetup, applySnapshot]);

  const handleRedo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const [nextSnap, ...rest] = prev;
      setHistory((h) => {
        const next = [...h, captureSetup()];
        while (next.length > 20) next.shift();
        return next;
      });
      applySnapshot(nextSnap);
      return rest;
    });
  }, [captureSetup, applySnapshot]);

  // Saved setups (localStorage)
  type StoredSetups = { [name: string]: SetupState & { _meta?: { savedAt: string } } };
  const STORAGE_KEY = "dtm_setups";
  const loadAllSetups = (): StoredSetups => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const saveAllSetups = (data: StoredSetups) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };
  const computeHash = (snap: SetupState) => JSON.stringify(snap);
  const saveCurrentSetup = (name: string) => {
    const all = loadAllSetups();
    const snap = captureSetup();
    all[name] = { ...snap, _meta: { savedAt: new Date().toISOString() } };
    saveAllSetups(all);
    setCurrentSetupName(name);
    const hash = computeHash(snap);
    lastSavedHashRef.current = hash;
    setIsDirty(false);
  };
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Sample data
  // useEffect(() => {
  //   const sampleTokens = [
  //     {
  //       id: "token_1",
  //       name: "primary-blue",
  //       value: "#4a90e2",
  //       type: "color" as const,
  //       layer: "base" as const,
  //     },
  //     {
  //       id: "token_2",
  //       name: "secondary-purple",
  //       value: "#805ad5",
  //       type: "color" as const,
  //       layer: "base" as const,
  //     },
  //     {
  //       id: "token_3",
  //       name: "font-size-base",
  //       value: "16px",
  //       type: "text" as const,
  //       layer: "base" as const,
  //     },
  //     {
  //       id: "token_4",
  //       name: "color-brand",
  //       value: "{base.primary-blue}",
  //       type: "color" as const,
  //       layer: "semantic" as const,
  //     },
  //     {
  //       id: "token_5",
  //       name: "button-bg",
  //       value: "{semantic.color-brand}",
  //       type: "color" as const,
  //       layer: "specific" as const,
  //     },
  //   ];

  //   const tokenGroups = sampleTokens.reduce(
  //     (acc, token) => {
  //       acc[token.layer] = acc[token.layer] || [];
  //       acc[token.layer].push(token);
  //       return acc;
  //     },
  //     {} as { [key: string]: Token[] },
  //   );

  //   setTokens(tokenGroups);
  // }, []);

  // Canvas dragging
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const isMiddleOrRight = e.button === 1 || e.button === 2;
    // Allow dragging with middle mouse button, right mouse button, or when clicking on empty canvas
    if (isMiddleOrRight || e.target === e.currentTarget) {
      setIsDraggingCanvas(true);
      setSelectedNode(null);
      setSelectedTokens(new Set());
      setSelectedGroup(null);
    }
  };



  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingCanvas(false);
    if (isConnecting) {
      setIsConnecting(false);
      setConnectionStart(null);
      setTempConnection(null);
    }
  }, [isConnecting]);

  // Performance optimization functions
  const calculateVisibleTokens = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;
    
    // Calculate visible area with some padding
    const padding = 200; // pixels
    const visibleArea = {
      left: -canvasOffset.x / canvasScale - padding,
      right: (-canvasOffset.x + viewportWidth) / canvasScale + padding,
      top: -canvasOffset.y / canvasScale - padding,
      bottom: (-canvasOffset.y + viewportHeight) / canvasScale + padding,
    };
    
    const visible = new Set<string>();
    
    Object.entries(nodePositions).forEach(([tokenId, position]) => {
      if (position.x >= visibleArea.left && 
          position.x <= visibleArea.right && 
          position.y >= visibleArea.top && 
          position.y <= visibleArea.bottom) {
        visible.add(tokenId);
      }
    });
    
    setVisibleTokens(visible);
  }, [canvasOffset, canvasScale, nodePositions]);

  // Enhanced canvas performance for large systems
  const handleLargeCanvasOptimization = useCallback(() => {
    const totalTokens = Object.keys(nodePositions).length;
    const totalConnections = connections.length;
    
    // Auto-adjust performance settings based on system size
    if (totalTokens > 200 || totalConnections > 300) {
      setRenderQuality('low');
      // Increase padding for better culling
      const newPadding = Math.min(400, 200 + Math.floor(totalTokens / 50));
      // Could implement virtual scrolling here for very large systems
    } else if (totalTokens > 100 || totalConnections > 150) {
      setRenderQuality('medium');
    } else {
      setRenderQuality('high');
    }
  }, [nodePositions, connections]);

  // Debounced canvas optimization
  const optimizeCanvas = useCallback(() => {
    if (canvasOptimizationRef.current) {
      cancelAnimationFrame(canvasOptimizationRef.current);
    }
    
    canvasOptimizationRef.current = requestAnimationFrame(() => {
      calculateVisibleTokens();
      handleLargeCanvasOptimization();
    });
  }, [calculateVisibleTokens, handleLargeCanvasOptimization]);

  // Enhanced canvas panning with performance optimization
  const handleCanvasMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    // Handle canvas dragging (middle mouse, right mouse, or space + left mouse)
    if (isDraggingCanvas) {
      e.preventDefault();
      
      if (canvasOptimizationRef.current) {
        cancelAnimationFrame(canvasOptimizationRef.current);
      }
      
      canvasOptimizationRef.current = requestAnimationFrame(() => {
        setCanvasOffset((prev) => ({
          x: prev.x + (e as MouseEvent).movementX,
          y: prev.y + (e as MouseEvent).movementY,
        }));
        
        // Optimize canvas during panning
        optimizeCanvas();
      });
    }

    // Handle connection drawing
    if (isConnecting && connectionStart) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const startPos = nodePositions[connectionStart.nodeId];
        if (startPos) {
          // Calculate start position based on socket position
          let x1 = startPos.x + 75; // Default to center
          let y1 = startPos.y + 100; // Default to bottom
          
          if (connectionStart.socketPosition === "top") {
            y1 = startPos.y - 2;
          } else if (connectionStart.socketPosition === "bottom") {
            y1 = startPos.y + 100 + 2;
          } else if (connectionStart.socketPosition === "left") {
            x1 = startPos.x - 3;
            y1 = startPos.y + 50; // Center vertically
          } else if (connectionStart.socketPosition === "right") {
            x1 = startPos.x + 150 + 3;
            y1 = startPos.y + 50; // Center vertically
          }
          
          setTempConnection({
            x1,
            y1,
            x2: ((e as MouseEvent).clientX - rect.left) / canvasScale - canvasOffset.x,
            y2: ((e as MouseEvent).clientY - rect.top) / canvasScale - canvasOffset.y,
          });
        }
      }
    }
  }, [isDraggingCanvas, isSpacePressed, isConnecting, connectionStart, nodePositions, canvasScale, canvasOffset]);

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
      // Undo / Redo
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      }
      if (((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "z") ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y")) {
        e.preventDefault();
        handleRedo();
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
  }, [handleCanvasMouseMove, handleCanvasMouseUp, handleUndo, handleRedo]);

  // Before unload prompt if dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Token operations
  const addToken = () => {
    if (!tokenForm.name || !tokenForm.value) {
      alert("Please enter both token name and value");
      return;
    }

    const newToken: Token = {
      id: `token_${Date.now()}`,
      name: tokenForm.name,
      value: tokenForm.value,
      type: currentTokenType,
      layer: currentLayer,
    };

    markHistory();
    setTokens((prev) => ({
      ...prev,
      [currentLayer]: [...prev[currentLayer], newToken],
    }));

    // Trigger performance optimization for large systems
    setTimeout(() => handleLargeCanvasOptimization(), 100);

    // Don't auto-position tokens on canvas - let users drag them from sidebar
    // This allows users to control where tokens are placed

    // Create automatic connection if value references an existing token
    if ((currentLayer === "semantic" || currentLayer === "specific")) {
      // Find the token that this new token references
      let referencedToken: Token | undefined;
      
      if (currentLayer === "semantic") {
        referencedToken = tokens.base.find(t => t.name === tokenForm.value);
      } else if (currentLayer === "specific") {
        referencedToken = [
          ...tokens.semantic,
          ...tokens.base
        ].find(t => t.name === tokenForm.value);
      }
      
      if (referencedToken) {
        const newConnection: Connection = {
          id: `conn_${Date.now()}`,
          from: referencedToken.id,
          to: newToken.id,
          fromPort: "output",
          toPort: "input",
          fromSocket: "bottom",
          toSocket: "top",
        };
        
        setConnections((prev) => [...prev, newConnection]);
      }
    }

    setTokenForm({ name: "", value: "" });
    setIsModalOpen(false);
  };

  const onDragFromPanel = (token: Token, e: React.DragEvent) => {
    console.log(`Starting drag of token "${token.name}" from sidebar`);
    e.dataTransfer.setData("token", JSON.stringify(token));
    e.dataTransfer.effectAllowed = "copy";
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

        markHistory();
        
        // Check if token is already on canvas and update position
        setNodePositions((prev) => ({
          ...prev,
          [token.id]: { x, y },
        }));
        
        console.log(`Token "${token.name}" dropped on canvas at position (${x}, ${y})`);
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
  const handleStartConnection = (nodeId: string, portType: "output", socketPosition?: "top" | "bottom" | "left" | "right") => {
    setIsConnecting(true);
    setConnectionStart({ nodeId, port: portType, socketPosition });
  };

  const handleCompleteConnection = (nodeId: string, portType: "input", socketPosition?: "top" | "bottom" | "left" | "right") => {
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

  // Drag and drop reordering functions
  const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);
  
  const handleTokenDragStart = (e: React.DragEvent, token: Token) => {
    console.log('🔄 Reorder drag start:', token.name);
    e.dataTransfer.setData('reorder-token', token.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTokenId(token.id);
  };

  const handleTokenDragEnd = () => {
    setDraggedTokenId(null);
  };

  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  
  const handleTokenDragOver = (e: React.DragEvent, token: Token) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(token.id);
  };

  const handleTokenDragLeave = () => {
    setDropTargetId(null);
  };



  // Group drag and drop reordering functions
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dropTargetGroupId, setDropTargetGroupId] = useState<string | null>(null);
  
  const handleGroupDragStart = (e: React.DragEvent, group: TokenGroup) => {
    e.dataTransfer.setData('text/plain', `group:${group.id}`);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedGroupId(group.id);
  };

  const handleGroupDragOver = (e: React.DragEvent, group: TokenGroup) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetGroupId(group.id);
  };

  const handleGroupDragLeave = () => {
    setDropTargetGroupId(null);
  };

  const handleGroupDragEnd = () => {
    setDraggedGroupId(null);
    setDropTargetGroupId(null);
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroup: TokenGroup) => {
    e.preventDefault();
    const draggedData = e.dataTransfer.getData('text/plain');
    
    if (draggedData.startsWith('group:')) {
      const draggedGroupId = draggedData.replace('group:', '');
      if (draggedGroupId === targetGroup.id) return;
      
      markHistory();
      
      setTokenGroups((prevGroups) => {
        const newGroups = [...prevGroups];
        const draggedIndex = newGroups.findIndex(g => g.id === draggedGroupId);
        const targetIndex = newGroups.findIndex(g => g.id === targetGroup.id);
        
        if (draggedIndex === -1) return newGroups;
        
        const [draggedGroup] = newGroups.splice(draggedIndex, 1);
        newGroups.splice(targetIndex, 0, draggedGroup);
        
        return newGroups;
      });
    }
  };







  // Save complete application state to local file
  const saveToLocalFile = () => {
    const completeState = {
      tokens,
      nodePositions,
      connections,
      tokenGroups,
      collapsedLayers,
      currentLayer,
      currentTokenType,
      canvasOffset,
      canvasScale,
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    };

    const dataStr = JSON.stringify(completeState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `design-tokens-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  };

  // Load complete application state from local file
  const loadFromLocalFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const loadedState = JSON.parse(content);
        
        // Validate the loaded state
        if (loadedState.tokens && loadedState.nodePositions && loadedState.connections) {
          markHistory();
          
          setTokens(loadedState.tokens || { base: [], semantic: [], specific: [] });
          setNodePositions(loadedState.nodePositions || {});
          setConnections(loadedState.connections || []);
          setTokenGroups(loadedState.tokenGroups || []);
          setCollapsedLayers(loadedState.collapsedLayers || { base: false, semantic: false, specific: false });
          setCurrentLayer(loadedState.currentLayer || "base");
          setCurrentTokenType(loadedState.currentTokenType || "color");
          
          if (loadedState.canvasOffset) {
            setCanvasOffset(loadedState.canvasOffset);
          }
          if (loadedState.canvasScale) {
            setCanvasScale(loadedState.canvasScale);
          }
          
          // Clear file input
          event.target.value = '';
        } else {
          alert('Invalid file format. Please select a valid design tokens file.');
        }
      } catch (error) {
        console.error('Error loading file:', error);
        alert('Error loading file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleTokenDrop = (e: React.DragEvent, targetToken: Token) => {
    e.preventDefault();
    
    // Debug: log all available data types
    console.log('🔄 Available data types:', e.dataTransfer.types);
    console.log('🔄 Reorder token data:', e.dataTransfer.getData('reorder-token'));
    console.log('🔄 Text plain data:', e.dataTransfer.getData('text/plain'));
    
    const draggedTokenId = e.dataTransfer.getData('reorder-token');
    
    console.log('🔄 Reorder drop:', draggedTokenId, '->', targetToken.name);
    
    if (!draggedTokenId) {
      console.log('🔄 No dragged token ID found!');
      return;
    }
    
    if (draggedTokenId === targetToken.id) {
      console.log('🔄 Same token, no reorder needed');
      return;
    }
    
    markHistory();
    
    setTokens((prevTokens) => {
      const newTokens = { ...prevTokens };
      const layer = targetToken.layer;
      
      console.log('🔄 Reordering in layer:', layer);
      console.log('🔄 Current tokens in layer:', newTokens[layer].map(t => t.name));
      
      // Find the dragged and target tokens
      const draggedToken = newTokens[layer].find(t => t.id === draggedTokenId);
      const targetIndex = newTokens[layer].findIndex(t => t.id === targetToken.id);
      
      console.log('🔄 Dragged token:', draggedToken?.name);
      console.log('🔄 Target index:', targetIndex);
      
      if (!draggedToken) {
        console.log('🔄 Dragged token not found in layer!');
        return newTokens;
      }
      
      // Remove dragged token from its current position
      newTokens[layer] = newTokens[layer].filter(t => t.id !== draggedTokenId);
      
      // Insert dragged token at target position
      newTokens[layer].splice(targetIndex, 0, draggedToken);
      
      console.log('🔄 Reorder completed:', draggedToken.name, 'moved to position', targetIndex);
      console.log('🔄 New token order:', newTokens[layer].map(t => t.name));
      return newTokens;
    });
  };

  const deleteToken = (tokenId: string) => {
    // Remove token from tokens state
    markHistory();
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
    markHistory();
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
    markHistory();
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
      parentGroupId: undefined,
      childGroups: [],
      level: 0,
    };

    markHistory();
    setTokenGroups((prev) => [...prev, newGroup]);
    setSelectedTokens(new Set());
    setIsGroupModalOpen(false);
    setGroupForm({ name: "" });
  };

  // Create a nested group inside an existing group
  const createNestedGroup = (parentGroupId: string) => {
    if (selectedTokens.size < 2 || !groupForm.name.trim()) return;

    const parentGroup = tokenGroups.find(g => g.id === parentGroupId);
    if (!parentGroup) return;

    // Calculate group position relative to parent
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
      parentGroupId: parentGroupId,
      childGroups: [],
      level: parentGroup.level + 1,
    };

    markHistory();
    setTokenGroups((prev) => {
      const updatedGroups = [...prev, newGroup];
      // Update parent group to include this child
      return updatedGroups.map(g => 
        g.id === parentGroupId 
          ? { ...g, childGroups: [...g.childGroups, newGroup.id] }
          : g
      );
    });
    setSelectedTokens(new Set());
    setIsGroupModalOpen(false);
    setGroupForm({ name: "" });
  };

  // Move group to a different parent
  const moveGroupToParent = (groupId: string, newParentId: string | undefined) => {
    markHistory();
    setTokenGroups((prev) => {
      const updatedGroups = prev.map(g => {
        if (g.id === groupId) {
          return { ...g, parentGroupId: newParentId, level: newParentId ? (prev.find(p => p.id === newParentId)?.level || 0) + 1 : 0 };
        }
        // Remove from old parent's childGroups
        if (g.childGroups.includes(groupId)) {
          return { ...g, childGroups: g.childGroups.filter(id => id !== groupId) };
        }
        // Add to new parent's childGroups
        if (g.id === newParentId) {
          return { ...g, childGroups: [...g.childGroups, groupId] };
        }
        return g;
      });
      return updatedGroups;
    });
  };

  const toggleCanvasGroupCollapse = (groupId: string) => {
    markHistory();
    setTokenGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, canvasCollapsed: !group.canvasCollapsed }
          : group,
      ),
    );
  };

  const ungroupTokens = (groupId: string) => {
    markHistory();
    setTokenGroups((prev) => prev.filter((group) => group.id !== groupId));
    setSelectedGroup(null);
  };

  const addTokenToGroup = (groupId: string, tokenId: string) => {
    const token = findTokenById(tokenId);
    if (!token) return;

    // Add token to the group
    setTokenGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, tokenIds: [...group.tokenIds, tokenId] }
          : group
      )
    );

    // Position the token within the group bounds
    const group = tokenGroups.find((g) => g.id === groupId);
    if (group) {
      const groupTokens = group.tokenIds.map((id) => nodePositions[id]).filter(Boolean);
      if (groupTokens.length > 0) {
        const minX = Math.min(...groupTokens.map((p) => p.x));
        const minY = Math.min(...groupTokens.map((p) => p.y));
        const maxX = Math.max(...groupTokens.map((p) => p.x + 200));
        const maxY = Math.max(...groupTokens.map((p) => p.y + 120));
        
        // Position new token below the group
        const newX = minX + (maxX - minX) / 2 - 75; // Center horizontally
        const newY = maxY + 20; // Below the group
        
        setNodePositions((prev) => ({
          ...prev,
          [tokenId]: { x: newX, y: newY }
        }));
      }
    }

    markHistory();
  };

  const removeTokenFromGroup = (groupId: string, tokenId: string) => {
    const token = findTokenById(tokenId);
    if (!token) return;

    // Remove token from the group
    setTokenGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, tokenIds: group.tokenIds.filter(id => id !== tokenId) }
          : group
      )
    );

    // Remove token from canvas
    setNodePositions((prev) => {
      const newPositions = { ...prev };
      delete newPositions[tokenId];
      return newPositions;
    });

    // Remove connections involving this token
    setConnections((prev) =>
      prev.filter(
        (conn) => conn.from !== tokenId && conn.to !== tokenId
      )
    );

    markHistory();
  };

  const deleteGroup = (groupId: string) => {
    const group = tokenGroups.find((g) => g.id === groupId);
    if (group) {
      markHistory();
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

  // Clear all tokens from canvas
  const clearAllCanvas = () => {
    if (window.confirm("Are you sure you want to remove all tokens from the canvas? This will not delete the tokens from the sidebar.")) {
      markHistory();
      setNodePositions({});
      setConnections([]);
      setSelectedNode(null);
      setSelectedTokens(new Set());
      setSelectedGroup(null);
    }
  };

  // Delete all tokens by type
  const deleteAllTokensByType = (layer: "base" | "semantic" | "specific") => {
    const tokenCount = tokens[layer]?.length || 0;
    if (tokenCount === 0) return;
    
    if (window.confirm(`Are you sure you want to delete all ${layer} tokens? This will remove ${tokenCount} tokens permanently.`)) {
      markHistory();
      
      // Get all token IDs to remove
      const tokenIdsToRemove = tokens[layer].map(token => token.id);
      
      // Remove tokens from state
      setTokens(prev => ({
        ...prev,
        [layer]: []
      }));
      
      // Remove from canvas positions
      setNodePositions(prev => {
        const newPositions = { ...prev };
        tokenIdsToRemove.forEach(id => delete newPositions[id]);
        return newPositions;
      });
      
      // Remove connections
      setConnections(prev => 
        prev.filter(conn => 
          !tokenIdsToRemove.includes(conn.from) && 
          !tokenIdsToRemove.includes(conn.to)
        )
      );
      
      // Clear selection if any of these tokens were selected
      if (selectedNode && tokenIdsToRemove.includes(selectedNode)) {
        setSelectedNode(null);
      }
      setSelectedTokens(prev => {
        const newSelection = new Set(prev);
        tokenIdsToRemove.forEach(id => newSelection.delete(id));
        return newSelection;
      });
      
      // Remove from groups
      setTokenGroups(prev => 
        prev.map(group => ({
          ...group,
          tokenIds: group.tokenIds.filter(id => !tokenIdsToRemove.includes(id))
        })).filter(group => group.tokenIds.length > 0)
      );
    }
  };

  // Edit token function
  const editToken = (token: Token) => {
    setEditingToken({
      id: token.id,
      name: token.name,
      value: token.value,
      type: token.type,
      layer: token.layer,
    });
  };

  // Update token function
  const updateToken = () => {
    if (!editingToken) return;
    
    markHistory();
    setTokens((prevTokens) => {
      const newTokens = { ...prevTokens };
      newTokens[editingToken.layer] = newTokens[editingToken.layer].map((token) =>
        token.id === editingToken.id
          ? {
              ...token,
              name: editingToken.name,
              value: editingToken.value,
              type: editingToken.type,
            }
          : token,
      );
      return newTokens;
    });
    
    setEditingToken(null);
  };

  // Edit group function
  const editGroup = (group: TokenGroup) => {
    setEditingGroup({
      id: group.id,
      name: group.name,
    });
  };

  // Update group function
  const updateGroup = () => {
    if (!editingGroup) return;
    
    markHistory();
    setTokenGroups((prev) =>
      prev.map((group) =>
        group.id === editingGroup.id
          ? { ...group, name: editingGroup.name }
          : group,
      ),
    );
    
    setEditingGroup(null);
  };

  // Import functions
  const importFromStyleDictionary = (data: any) => {
    const newTokens: { [key: string]: Token[] } = { base: [], semantic: [], specific: [] };
    const newConnections: Connection[] = [];
    let nextTokenId = Date.now();
    
    // Create a map to track tokens by their original names for connection building
    const tokenMap = new Map<string, Token>();
    
    // Process each layer
    Object.entries(data).forEach(([layer, layerData]: [string, any]) => {
      if (layer === "_meta" || layer === "$metadata" || layer === "$connections" || layer === "$positions") return;
      
      // Map layer names to our system
      let targetLayer: "base" | "semantic" | "specific" = "base";
      if (layer === "semantic" || layer === "semantic-tokens") targetLayer = "semantic";
      if (layer === "specific" || layer === "specific-tokens") targetLayer = "specific";
      
      Object.entries(layerData).forEach(([type, typeData]: [string, any]) => {
        if (typeof typeData === 'object' && typeData !== null) {
          Object.entries(typeData).forEach(([name, tokenData]: [string, any]) => {
            // Skip if tokenData is not an object or doesn't have a value
            if (typeof tokenData === 'object' && tokenData !== null && (tokenData as any).value !== undefined) {
              const token: Token = {
                id: `token_${nextTokenId++}`,
                name,
                value: (tokenData as any).value || "",
                type: type as Token["type"],
                layer: targetLayer,
              };
              
              newTokens[targetLayer].push(token);
              // Store token with multiple reference formats for connection building
              tokenMap.set(`${targetLayer}.${name}`, token);
              tokenMap.set(`${targetLayer}.${type}.${name}`, token);
              tokenMap.set(name, token);
            }
          });
        }
      });
    });
    
    // First, try to restore connections from exported data
    if (data.$connections && Array.isArray(data.$connections)) {
      // Create a mapping from old token IDs to new token IDs based on names
      const oldToNewIdMap = new Map<string, string>();
      
      // Build the mapping by matching token names and layers
      Object.values(newTokens).flat().forEach((token) => {
        // Try to find matching token in original data by name and layer
        Object.entries(data).forEach(([layer, layerData]: [string, any]) => {
          if (layer === "_meta" || layer === "$metadata" || layer === "$connections" || layer === "$positions") return;
          
          if (layer === token.layer || 
              (layer === "semantic" && token.layer === "semantic") ||
              (layer === "specific" && token.layer === "specific")) {
            Object.entries(layerData).forEach(([type, typeData]: [string, any]) => {
              if (type === token.type) {
                Object.entries(typeData).forEach(([name, tokenData]: [string, any]) => {
                  if (name === token.name) {
                    // This is the matching token, store the mapping
                    oldToNewIdMap.set(`${layer}.${type}.${name}`, token.id);
                  }
                });
              }
            });
          }
        });
      });
      
      // Now restore connections using the mapping
      data.$connections.forEach((conn: any) => {
        const fromToken = oldToNewIdMap.get(conn.from);
        const toToken = oldToNewIdMap.get(conn.to);
        
        if (fromToken && toToken && fromToken !== toToken) {
          const connection: Connection = {
            id: `conn_${nextTokenId++}`,
            from: fromToken,
            to: toToken,
            fromPort: conn.fromPort || "output",
            toPort: conn.toPort || "input",
            fromSocket: conn.fromSocket,
            toSocket: conn.toSocket,
          };
          newConnections.push(connection);
        }
      });
    } else {
      // Fallback: process connections based on references (original logic)
      Object.values(newTokens).flat().forEach((token) => {
        if (typeof token.value === "string" && token.value.includes(".")) {
          // Handle different reference formats
          const refValue = token.value.replace(/[{}]/g, ''); // Remove curly braces if present
          
          // Try to find the referenced token
          let sourceToken = tokenMap.get(refValue);
          
          // If not found, try alternative formats
          if (!sourceToken) {
            // Try without layer prefix
            const nameOnly = refValue.split('.').pop();
            if (nameOnly) {
              sourceToken = Object.values(newTokens).flat().find(t => t.name === nameOnly);
            }
          }
          
          if (sourceToken && sourceToken.id !== token.id) {
            const connection: Connection = {
              id: `conn_${nextTokenId++}`,
              from: sourceToken.id,
              to: token.id,
              fromPort: "output",
              toPort: "input",
            };
            newConnections.push(connection);
          }
        }
      });
    }
    
    return { newTokens, newConnections };
  };

  const importFromDTCG = (data: any) => {
    const newTokens: { [key: string]: Token[] } = { base: [], semantic: [], specific: [] };
    const newConnections: Connection[] = [];
    let nextTokenId = Date.now();
    
    // Create a map to track tokens by their original names for connection building
    const tokenMap = new Map<string, Token>();
    
    // Process each layer
    Object.entries(data).forEach(([layer, layerData]: [string, any]) => {
      if (layer === "_meta" || layer === "$metadata" || layer === "$connections" || layer === "$positions") return;
      
      // Map layer names to our system
      let targetLayer: "base" | "semantic" | "specific" = "base";
      if (layer === "semantic" || layer === "semantic-tokens") targetLayer = "semantic";
      if (layer === "specific" || layer === "specific-tokens") targetLayer = "specific";
      
      Object.entries(layerData).forEach(([type, typeData]: [string, any]) => {
        if (typeof typeData === 'object' && typeData !== null) {
          Object.entries(typeData).forEach(([name, tokenData]: [string, any]) => {
            // Skip if tokenData is not an object or doesn't have a $value
            if (typeof tokenData === 'object' && tokenData !== null && (tokenData as any).$value !== undefined) {
              const token: Token = {
                id: `token_${nextTokenId++}`,
                name,
                value: (tokenData as any).$value || "",
                type: type as Token["type"],
                layer: targetLayer,
              };
              
              newTokens[targetLayer].push(token);
              // Store token with multiple reference formats for connection building
              tokenMap.set(`${targetLayer}.${type}.${name}`, token);
              tokenMap.set(`${targetLayer}.${name}`, token);
              tokenMap.set(name, token);
            }
          });
        }
      });
    });
    
    // First, try to restore connections from exported data
    if (data.$connections && Array.isArray(data.$connections)) {
      // Create a mapping from old token IDs to new token IDs based on names
      const oldToNewIdMap = new Map<string, string>();
      
      // Build the mapping by matching token names and layers
      Object.values(newTokens).flat().forEach((token) => {
        // Try to find matching token in original data by name and layer
        Object.entries(data).forEach(([layer, layerData]: [string, any]) => {
          if (layer === "_meta" || layer === "$metadata" || layer === "$connections" || layer === "$positions") return;
          
          if (layer === token.layer || 
              (layer === "semantic" && token.layer === "semantic") ||
              (layer === "specific" && token.layer === "specific")) {
            Object.entries(layerData).forEach(([type, typeData]: [string, any]) => {
              if (type === token.type) {
                Object.entries(typeData).forEach(([name, tokenData]: [string, any]) => {
                  if (name === token.name) {
                    // This is the matching token, store the mapping
                    oldToNewIdMap.set(`${layer}.${type}.${name}`, token.id);
                  }
                });
              }
            });
          }
        });
      });
      
      // Now restore connections using the mapping
      data.$connections.forEach((conn: any) => {
        const fromToken = oldToNewIdMap.get(conn.from);
        const toToken = oldToNewIdMap.get(conn.to);
        
        if (fromToken && toToken && fromToken !== toToken) {
          const connection: Connection = {
            id: `conn_${nextTokenId++}`,
            from: fromToken,
            to: toToken,
            fromPort: conn.fromPort || "output",
            toPort: conn.toPort || "input",
            fromSocket: conn.fromSocket,
            toSocket: conn.toSocket,
          };
          newConnections.push(connection);
        }
      });
    } else {
      // Fallback: process connections based on references (original logic)
      Object.values(newTokens).flat().forEach((token) => {
        if (typeof token.value === "string" && token.value.includes(".")) {
          // Handle different reference formats
          const refValue = token.value.replace(/[{}]/g, ''); // Remove curly braces if present
          
          // Try to find the referenced token
          let sourceToken = tokenMap.get(refValue);
          
          // If not found, try alternative formats
          if (!sourceToken) {
            // Try DTCG format: layer.type.name
            const parts = refValue.split(".");
            if (parts.length >= 3) {
              const refLayer = parts[0] as "base" | "semantic" | "specific";
              const refType = parts[1];
              const refName = parts[2];
              sourceToken = tokenMap.get(`${refLayer}.${refType}.${refName}`);
            }
            
            // If still not found, try just the name
            if (!sourceToken) {
              const nameOnly = refValue.split('.').pop();
              if (nameOnly) {
                sourceToken = Object.values(newTokens).flat().find(t => t.name === nameOnly);
              }
            }
          }
          
          if (sourceToken && sourceToken.id !== token.id) {
            const connection: Connection = {
              id: `conn_${nextTokenId++}`,
              from: sourceToken.id,
              to: token.id,
              fromPort: "output",
              toPort: "input",
            };
            newConnections.push(connection);
          }
        }
      });
    }
    
    return { newTokens, newConnections };
  };

  // Generic import function that can handle various JSON formats
  const importGenericFormat = (data: any) => {
    const newTokens: { [key: string]: Token[] } = { base: [], semantic: [], specific: [] };
    const newConnections: Connection[] = [];
    let nextTokenId = Date.now();
    
    // Create a map to track tokens by their original names for connection building
    const tokenMap = new Map<string, Token>();
    
    // Function to recursively process nested objects
    const processNestedObject = (obj: any, path: string[] = [], layer: "base" | "semantic" | "specific" = "base") => {
      if (typeof obj !== 'object' || obj === null) return;
      
      // Check if this object looks like a token
      if (obj.value !== undefined || obj.$value !== undefined || obj.color !== undefined || obj.size !== undefined) {
        const tokenName = path[path.length - 1] || `token_${nextTokenId}`;
        const tokenValue = obj.value || obj.$value || obj.color || obj.size || "";
        const tokenType = determineTokenType(obj, path);
        
        const token: Token = {
          id: `token_${nextTokenId++}`,
          name: tokenName,
          value: tokenValue.toString(),
          type: tokenType,
          layer: layer,
        };
        
        newTokens[layer].push(token);
        
        // Store token with multiple reference formats
        tokenMap.set(tokenName, token);
        tokenMap.set(`${layer}.${tokenName}`, token);
        tokenMap.set(`${layer}.${tokenType}.${tokenName}`, token);
        
        return;
      }
      
      // Recursively process nested objects
      Object.entries(obj).forEach(([key, value]) => {
        if (key === "_meta" || key === "$metadata" || key === "metadata" || key === "$connections" || key === "$positions") return;
        
        let targetLayer = layer;
        if (key === "semantic" || key === "semantic-tokens") targetLayer = "semantic";
        if (key === "specific" || key === "specific-tokens") targetLayer = "specific";
        
        if (typeof value === 'object' && value !== null) {
          processNestedObject(value, [...path, key], targetLayer);
        }
      });
    };
    
    // Start processing from the root
    processNestedObject(data);
    
    // First, try to restore connections from exported data
    if (data.$connections && Array.isArray(data.$connections)) {
      // Create a mapping from old token IDs to new token IDs based on names
      const oldToNewIdMap = new Map<string, string>();
      
      // Build the mapping by matching token names and layers
      Object.values(newTokens).flat().forEach((token) => {
        // Try to find matching token in original data by name and layer
        Object.entries(data).forEach(([layer, layerData]: [string, any]) => {
          if (layer === "_meta" || layer === "$metadata" || layer === "$connections" || layer === "$positions") return;
          
          if (layer === token.layer || 
              (layer === "semantic" && token.layer === "semantic") ||
              (layer === "specific" && token.layer === "specific")) {
            // For generic format, we need to search recursively
            const findTokenInData = (obj: any, path: string[] = []): any => {
              if (typeof obj !== 'object' || obj === null) return null;
              
              if (obj.value !== undefined || obj.$value !== undefined || obj.color !== undefined || obj.size !== undefined) {
                const tokenName = path[path.length - 1];
                if (tokenName === token.name) {
                  return { layer, type: determineTokenType(obj, path), name: tokenName };
                }
              }
              
              for (const [key, value] of Object.entries(obj)) {
                if (key === "_meta" || key === "$metadata" || key === "$connections" || key === "$positions") continue;
                const result = findTokenInData(value, [...path, key]);
                if (result) return result;
              }
              return null;
            };
            
            const foundToken = findTokenInData(layerData);
            if (foundToken && foundToken.name === token.name) {
              oldToNewIdMap.set(`${layer}.${foundToken.type}.${foundToken.name}`, token.id);
            }
          }
        });
      });
      
      // Now restore connections using the mapping
      data.$connections.forEach((conn: any) => {
        const fromToken = oldToNewIdMap.get(conn.from);
        const toToken = oldToNewIdMap.get(conn.to);
        
        if (fromToken && toToken && fromToken !== toToken) {
          const connection: Connection = {
            id: `conn_${nextTokenId++}`,
            from: fromToken,
            to: toToken,
            fromPort: conn.fromPort || "output",
            toPort: conn.toPort || "input",
            fromSocket: conn.fromSocket,
            toSocket: conn.toSocket,
          };
          newConnections.push(connection);
        }
      });
    } else {
      // Fallback: process connections based on references (original logic)
      Object.values(newTokens).flat().forEach((token) => {
        if (typeof token.value === "string" && token.value.includes(".")) {
          const refValue = token.value.replace(/[{}]/g, '');
          let sourceToken = tokenMap.get(refValue);
          
          if (!sourceToken) {
            const nameOnly = refValue.split('.').pop();
            if (nameOnly) {
              sourceToken = Object.values(newTokens).flat().find(t => t.name === nameOnly);
            }
          }
          
          if (sourceToken && sourceToken.id !== token.id) {
            const connection: Connection = {
              id: `conn_${nextTokenId++}`,
              from: sourceToken.id,
              to: token.id,
              fromPort: "output",
              toPort: "input",
            };
            newConnections.push(connection);
          }
        }
      });
    }
    
    return { newTokens, newConnections };
  };

  // Helper function to determine token type
  const determineTokenType = (obj: any, path: string[]): Token["type"] => {
    if (obj.color !== undefined || obj.value?.startsWith('#')) return "color";
    if (obj.size !== undefined || obj.value?.includes('px') || obj.value?.includes('rem')) return "spacing";
    if (obj.fontSize !== undefined || obj.value?.includes('font')) return "text";
    if (typeof obj.value === 'boolean') return "boolean";
    if (typeof obj.value === 'number') return "number";
    if (typeof obj.value === 'string') return "string";
    
    // Try to determine from path
    const lastPath = path[path.length - 1]?.toLowerCase();
    if (lastPath?.includes('color')) return "color";
    if (lastPath?.includes('size') || lastPath?.includes('spacing')) return "spacing";
    if (lastPath?.includes('font') || lastPath?.includes('text')) return "text";
    
    return "string";
  };

  const handleImport = () => {
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(importData);
      } catch (e) {
        alert("Invalid JSON format");
        return;
      }
      
      let result;
      if (importFormat === "style-dictionary") {
        result = importFromStyleDictionary(parsedData);
      } else if (importFormat === "dtcg") {
        result = importFromDTCG(parsedData);
      } else if (importFormat === "flat-json") {
        result = importFromFlatJSON(parsedData);
      } else if (importFormat === "nested-collections") {
        result = importFromNestedCollections(parsedData);
      } else {
        result = importGenericFormat(parsedData);
      }
      
      // Clear existing data and apply imported data
      markHistory();
      setTokens(result.newTokens);
      setConnections(result.newConnections);
      setTokenGroups([]);
      
      // Try to restore positions from exported data, otherwise auto-position
      let newPositions: { [key: string]: { x: number; y: number } } = {};
      
      if (parsedData.$positions && typeof parsedData.$positions === 'object') {
        // Restore positions from exported data
        const allTokens = Object.values(result.newTokens).flat();
        allTokens.forEach((token: Token) => {
          // Find matching token in exported positions by name and layer
          const matchingPosition = Object.entries(parsedData.$positions).find(([oldId, pos]: [string, any]) => {
            // We need to find the token that was at this position
            // Since IDs change on import, we'll match by name and layer
            return true; // For now, we'll use a simple approach
          });
          
          if (matchingPosition) {
            newPositions[token.id] = matchingPosition[1] as { x: number; y: number };
          }
        });
      }
      
      // If no positions were restored, auto-position tokens
      if (Object.keys(newPositions).length === 0) {
        const allTokens = Object.values(result.newTokens).flat();
        allTokens.forEach((token: Token, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;
          newPositions[token.id] = {
            x: col * 250 + 100,
            y: row * 150 + 100,
          };
        });
      }
      
      setNodePositions(newPositions);
      setIsImportModalOpen(false);
      setImportData("");
      
    } catch (error) {
      alert("Error importing data: " + error);
    }
  };

  const toggleGroupCollapse = (groupId: string) => {
    markHistory();
    setTokenGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, collapsed: !group.collapsed }
          : group,
      ),
    );
  };

  const toggleLayerCollapse = (layer: string) => {
    markHistory();
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
    fromSocket?: "top" | "bottom" | "left" | "right",
    toSocket?: "top" | "bottom" | "left" | "right",
  ) => {
    // Adjust connection points based on socket positions
    let adjustedX1 = x1;
    let adjustedY1 = y1;
    let adjustedX2 = x2;
    let adjustedY2 = y2;

    // Adjust start point based on from socket
    if (fromSocket === "top") {
      adjustedY1 = y1 - 2;
    } else if (fromSocket === "bottom") {
      adjustedY1 = y1 + 2;
    } else if (fromSocket === "left") {
      adjustedX1 = x1 - 2;
    } else if (fromSocket === "right") {
      adjustedX1 = x1 + 2;
    }

    // Adjust end point based on to socket
    if (toSocket === "top") {
      adjustedY2 = y2 - 2;
    } else if (toSocket === "bottom") {
      adjustedY2 = y2 + 2;
    } else if (toSocket === "left") {
      adjustedX2 = x2 - 2;
    } else if (toSocket === "right") {
      adjustedX2 = x2 + 2;
    }

    const dx = adjustedX2 - adjustedX1;
    const dy = adjustedY2 - adjustedY1;
    
    // Create better control points for different connection types
    let cp1x, cp1y, cp2x, cp2y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection (left/right sockets)
      const midX = (adjustedX1 + adjustedX2) / 2;
      cp1x = midX;
      cp1y = adjustedY1;
      cp2x = midX;
      cp2y = adjustedY2;
    } else {
      // Vertical connection (top/bottom sockets)
      const midY = (adjustedY1 + adjustedY2) / 2;
      cp1x = adjustedX1;
      cp1y = midY;
      cp2x = adjustedX2;
      cp2y = midY;
    }
    
    return `M ${adjustedX1} ${adjustedY1} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${adjustedX2} ${adjustedY2}`;
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
      // Transform to flat structure that Figma plugin expects
      tokens: {
        base: tokens.base.map(token => ({
          id: token.id,
          name: token.name,
          value: token.value,
          type: token.type,
          layer: "base"
        })),
        semantic: tokens.semantic.map(token => ({
          id: token.id,
          name: token.name,
          value: token.value,
          type: token.type,
          layer: "semantic"
        })),
        specific: tokens.specific.map(token => ({
          id: token.id,
          name: token.name,
          value: token.value,
          type: token.type,
          layer: "specific"
        }))
      },
      
      // Transform connections to source/target format
      connections: connections.map(conn => ({
        source: conn.from,
        target: conn.to
      })),
      
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

  const exportTokensDTCG = () => {
    const exportData = {
      // Transform to flat structure that Figma plugin expects
      tokens: {
        base: tokens.base.map(token => ({
          id: token.id,
          name: token.name,
          value: token.value,
          type: token.type,
          layer: "base"
        })),
        semantic: tokens.semantic.map(token => ({
          id: token.id,
          name: token.name,
          value: token.value,
          type: token.type,
          layer: "semantic"
        })),
        specific: tokens.specific.map(token => ({
          id: token.id,
          name: token.name,
          value: token.value,
          type: token.type,
          layer: "specific"
        }))
      },
      
      // Transform connections to source/target format
      connections: connections.map(conn => ({
        source: conn.from,
        target: conn.to
      })),
      
      $metadata: {
        version: "1.0",
        exportDate: new Date().toISOString(),
        generator: "DTM - Design Token Manager",
        format: "DTCG",
        totalTokens: Object.values(tokens).flat().length,
        connections: connections.length,
      }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "design-tokens-dtcg.json");
    link.click();
  };

  // Function to save full project data (including coordinates) for internal use
  const saveProjectData = () => {
    const projectData = {
      tokens,
      connections,
      nodePositions,
      tokenGroups,
      collapsedLayers,
      $metadata: {
        version: "1.0",
        saveDate: new Date().toISOString(),
        generator: "DTM - Design Token Manager",
        totalTokens: Object.values(tokens).flat().length,
        connections: connections.length,
        groups: tokenGroups.length
      }
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "dtm-project-full.json");
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

  // New import function for flat JSON structures with automatic layer detection
  const importFromFlatJSON = (data: any) => {
    const newTokens: { [key: string]: Token[] } = { base: [], semantic: [], specific: [] };
    const newConnections: Connection[] = [];
    let nextTokenId = Date.now();
    
    // Create a map to track tokens by their names for connection building
    const tokenMap = new Map<string, Token>();
    
    // First pass: create all tokens and determine their types
    Object.entries(data).forEach(([tokenName, tokenData]: [string, any]) => {
      if (typeof tokenData === 'object' && tokenData !== null) {
        const value = tokenData.$value || tokenData.value || "";
        const type = tokenData.$type || tokenData.type || "color";
        const description = tokenData.$description || tokenData.description || "";
        
        // Determine the layer based on the token name and value
        let layer: "base" | "semantic" | "specific" = "base";
        
        // Check if this token references another token
        const hasReference = typeof value === "string" && value.includes("{") && value.includes("}");
        
        if (hasReference) {
          // Extract the referenced token name
          const refMatch = value.match(/\{([^}]+)\}/);
          if (refMatch) {
            const referencedTokenName = refMatch[1];
            
            // Check what layer the referenced token is in
            const referencedToken = tokenMap.get(referencedTokenName);
            if (referencedToken) {
              // If referenced token is base, this is semantic
              // If referenced token is semantic, this is specific
              if (referencedToken.layer === "base") {
                layer = "semantic";
              } else if (referencedToken.layer === "semantic") {
                layer = "specific";
              } else {
                layer = "semantic"; // Default fallback
              }
            } else {
              // If we haven't processed the referenced token yet, assume semantic
              layer = "semantic";
            }
          }
        } else {
          // No reference means it's a base token
          layer = "base";
        }
        
        // Normalize token type to match our system
        let normalizedType: Token["type"] = "color";
        if (type === "color" || type === "COLOR") normalizedType = "color";
        else if (type === "spacing" || type === "SPACING" || type === "size" || type === "SIZE") normalizedType = "spacing";
        else if (type === "text" || type === "TEXT" || type === "string" || type === "STRING") normalizedType = "text";
        else if (type === "boolean" || type === "BOOLEAN") normalizedType = "boolean";
        else if (type === "number" || type === "NUMBER" || type === "float" || type === "FLOAT") normalizedType = "spacing";
        
        const token: Token = {
          id: `token_${nextTokenId++}`,
          name: tokenName,
          value: value.toString(),
          type: normalizedType,
          layer: layer,
        };
        
        newTokens[layer].push(token);
        tokenMap.set(tokenName, token);
      }
    });
    
    // Second pass: create connections based on references
    Object.values(newTokens).flat().forEach((token) => {
      if (typeof token.value === "string" && token.value.includes("{") && token.value.includes("}")) {
        // Extract the referenced token name
        const refMatch = token.value.match(/\{([^}]+)\}/);
        if (refMatch) {
          const referencedTokenName = refMatch[1];
          const sourceToken = tokenMap.get(referencedTokenName);
          
          if (sourceToken && sourceToken.id !== token.id) {
            const connection: Connection = {
              id: `conn_${nextTokenId++}`,
              from: sourceToken.id,
              to: token.id,
              fromPort: "output",
              toPort: "input",
            };
            newConnections.push(connection);
          }
        }
      }
    });
    
    return { newTokens, newConnections };
  };

  // New import function for nested collection JSON structures
  const importFromNestedCollections = (data: any) => {
    const newTokens: { [key: string]: Token[] } = { base: [], semantic: [], specific: [] };
    const newConnections: Connection[] = [];
    let nextTokenId = Date.now();
    
    // Create a map to track tokens by their full path for connection building
    const tokenMap = new Map<string, Token>();
    
    // First pass: create all tokens from their respective collections
    Object.entries(data).forEach(([collectionName, collectionData]: [string, any]) => {
      if (typeof collectionData === 'object' && collectionData !== null) {
        // Map collection names to our layer system
        let targetLayer: "base" | "semantic" | "specific" = "base";
        if (collectionName === "semantic") targetLayer = "semantic";
        if (collectionName === "specific") targetLayer = "specific";
        
        // Process tokens within this collection
        Object.entries(collectionData).forEach(([tokenName, tokenData]: [string, any]) => {
          if (typeof tokenData === 'object' && tokenData !== null) {
            const value = tokenData.value || tokenData.$value || "";
            const type = tokenData.type || tokenData.$type || "color";
            const description = tokenData.description || tokenData.$description || "";
            
            // Normalize token type to match our system
            let normalizedType: Token["type"] = "color";
            if (type === "color" || type === "COLOR") normalizedType = "color";
            else if (type === "spacing" || type === "SPACING" || type === "size" || type === "SIZE") normalizedType = "spacing";
            else if (type === "text" || type === "TEXT" || type === "string" || type === "STRING") normalizedType = "text";
            else if (type === "boolean" || type === "BOOLEAN") normalizedType = "boolean";
            else if (type === "number" || type === "NUMBER" || type === "float" || type === "FLOAT") normalizedType = "spacing";
            
            const token: Token = {
              id: `token_${nextTokenId++}`,
              name: tokenName,
              value: value.toString(),
              type: normalizedType,
              layer: targetLayer,
            };
            
            newTokens[targetLayer].push(token);
            
            // Store token with multiple reference formats for connection building
            tokenMap.set(tokenName, token); // Just the name
            tokenMap.set(`${collectionName}.${tokenName}`, token); // collection.name format
            tokenMap.set(`${targetLayer}.${tokenName}`, token); // layer.name format
          }
        });
      }
    });
    
    // Second pass: create connections based on cross-collection references
    Object.values(newTokens).flat().forEach((token) => {
      if (typeof token.value === "string" && token.value.includes("{") && token.value.includes("}")) {
        // Extract the referenced token path (e.g., "base.color-base" or "semantic.surface-color")
        const refMatch = token.value.match(/\{([^}]+)\}/);
        if (refMatch) {
          const referencedTokenPath = refMatch[1];
          
          // Try to find the referenced token using the full path
          let sourceToken = tokenMap.get(referencedTokenPath);
          
          // If not found with full path, try alternative formats
          if (!sourceToken) {
            // Try without collection prefix (just the token name)
            const tokenNameOnly = referencedTokenPath.split('.').pop();
            if (tokenNameOnly) {
              sourceToken = tokenMap.get(tokenNameOnly);
            }
          }
          
          if (sourceToken && sourceToken.id !== token.id) {
            const connection: Connection = {
              id: `conn_${nextTokenId++}`,
              from: sourceToken.id,
              to: token.id,
              fromPort: "output",
              toPort: "input",
            };
            newConnections.push(connection);
          }
        }
      }
    });
    
    return { newTokens, newConnections };
  };

  return (
    <div className="h-screen flex dtm-bg-graphite from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Left Panel */}
      <div className={`${isSidebarCollapsed ? 'w-16' : 'w-80'} dtm-bg-secondary/95 backdrop-blur-sm border-r dtm-border-primary overflow-y-auto transition-all duration-500 ease-in-out`}>
        <div className={`${isSidebarCollapsed ? 'p-2' : 'p-5'} relative`}>
          {/* Collapse/Expand button */}
          <div className="absolute top-2 right-2">
            <button
              className="dtm-text-muted hover:dtm-text-primary p-1 rounded transition-colors"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="text-lg">{isSidebarCollapsed ? "→" : "←"}</span>
            </button>
          </div>
          {/* Token Types */}
          {!isSidebarCollapsed ? (
            <div className="mb-8 dtm-tokens-types">
              <h3 className="text-sm font-semibold dtm-text-muted uppercase tracking-wide mb-4">
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
                    className={`p-2 text-xs rounded-md border transition-all flex items-center gap-2 justify-center ${
                      currentTokenType === type
                        ? "dtm-btn-primary dtm-text-primary"
                        : "dtm-btn-secondary hover:dtm-text-primary hover:dtm-border-accent hover:dtm-bg-tertiary"
                    }`}
                    onClick={() => setCurrentTokenType(type)}
                  >
                    {type === "color" && <Palette size={12} />}
                    {type === "text" && <Edit size={12} />}
                    {type === "spacing" && <Grid size={12} />}
                    {type === "boolean" && <Target size={12} />}
                    {type === "string" && <Copy size={12} />}
                    {type === "number" && <Zap size={12} />}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-8 d-none">
              <div className="grid grid-cols-1 gap-2">
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
                    className={`w-8 h-8 dtm-text-primary-75 rounded-md border transition-all flex items-center justify-center ${
                      currentTokenType === type
                        ? "dtm-btn-primary dtm-border-accent"
                        : "dtm-bg-secondary dtm-border-primary dtm-text-primary hover:dtm-btn-primary hover:dtm-border-accent"
                    }`}
                    onClick={() => setCurrentTokenType(type)}
                    title={type.charAt(0).toUpperCase() + type.slice(1)}
                  >
                    {type === "color" && <Palette size={14} />}
                    {type === "text" && <Edit size={14} />}
                    {type === "spacing" && <Grid size={14} />}
                    {type === "boolean" && <Target size={14} />}
                    {type === "string" && <Copy size={14} />}
                    {type === "number" && <Zap size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Token Layers */}
          {!isSidebarCollapsed ? (
            <div className="dtm-token-layers mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold dtm-text-muted uppercase tracking-wide">
                  Token Layers
                </h3>
                <div className="flex gap-1">
                  <button
                    className="text-xs dtm-text-muted hover:dtm-text-primary px-2 py-1 rounded border dtm-border-secondary hover:dtm-border-primary transition-colors flex items-center gap-1"
                    onClick={() => setCollapsedLayers({ base: false, semantic: false, specific: false })}
                    title="Expand all layers"
                  >
                    <Eye size={12} />
                    ▼
                  </button>
                  <button
                    className="text-xs dtm-text-muted hover:dtm-text-primary px-2 py-1 rounded border dtm-border-secondary hover:dtm-border-primary transition-colors flex items-center gap-1"
                    onClick={() => setCollapsedLayers({ base: true, semantic: true, specific: true })}
                    title="Collapse all layers"
                  >
                    <EyeOff size={12} />
                    ▲
                  </button>
                  <button
                    className="text-xs dtm-text-muted hover:dtm-text-primary px-2 py-1 rounded border dtm-border-secondary hover:dtm-border-primary transition-colors"
                    onClick={clearAllCanvas}
                    title="Remove all tokens from canvas"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            <div className="space-y-4">
              {(["base", "semantic", "specific"] as const).map((layer) => (
                <div
                  key={layer}
                  className="dtm-bg-tertiary/30 border dtm-border-primary rounded-md overflow-hidden"
                >
                  {/* Layer Header */}
                  <div className="p-2 dtm-bg-tertiary/50 border-b dtm-border-primary flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        className="dtm-text-muted hover:dtm-text-primary transition-colors p-1 rounded"
                        onClick={() => toggleLayerCollapse(layer)}
                        title={collapsedLayers[layer] ? "Expand layer" : "Collapse layer"}
                      >
                        {collapsedLayers[layer] ? "▶" : "▼"}
                      </button>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            layer === "base" ? "dtm-token-base" :
                            layer === "semantic" ? "dtm-token-semantic" :
                            "dtm-token-specific"
                          }`}
                        />
                        <span className="font-semibold text-sm capitalize dtm-text-primary">
                          {layer} Tokens
                        </span>
                      </div>
                      <span className="text-xs dtm-text-muted">
                        ({tokens[layer]?.length || 0})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="dtm-btn-secondary w-6 h-6 rounded-md text-xs flex items-center justify-center transition-colors"
                        onClick={() => {
                          setCurrentLayer(layer);
                          setIsModalOpen(true);
                        }}
                        title="Add new token"
                      >
                        <Plus size={12} />
                      </button>
                      {tokens[layer]?.length > 0 && (
                        <button
                          className="dtm-btn-secondary w-6 h-6 rounded-md text-xs flex items-center justify-center transition-colors"
                          onClick={() => deleteAllTokensByType(layer)}
                          title={`Delete all ${layer} tokens`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Layer Tokens */}
                  {!collapsedLayers[layer] && (
                    <div className="p-2 space-y-2">
                      {tokens[layer]?.map((token) => (
                        <div
                          key={token.id}
                          className={`dtm-bg-secondary border dtm-border-secondary rounded-md p-2 hover:dtm-bg-secondary/70 transition-all group ${
                            draggedTokenId === token.id ? 'opacity-50 scale-95' : ''
                          } ${
                            dropTargetId === token.id && draggedTokenId !== token.id ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔄 Token item drag over:', token.name);
                            handleTokenDragOver(e, token);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔄 Token item drop event fired on:', token.name);
                            handleTokenDrop(e, token);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="cursor-grab text-xs dtm-text-muted opacity-60 hover:opacity-100"
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  handleTokenDragStart(e, token);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🔄 Reorder drag over:', token.name);
                                  handleTokenDragOver(e, token);
                                }}
                                onDragLeave={(e) => {
                                  e.stopPropagation();
                                  console.log('🔄 Reorder drag leave:', token.name);
                                  handleTokenDragLeave();
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation();
                                  console.log('🔄 Reorder drag end:', token.name);
                                  handleTokenDragEnd();
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🔄 Reorder drop event fired on:', token.name);
                                  handleTokenDrop(e, token);
                                }}
                              >
                                ⋮⋮
                              </div>
                              <div
                                className="flex-1 cursor-grab"
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  onDragFromPanel(token, e);
                                }}
                              >
                                <div className="font-medium text-sm flex items-center gap-2 dtm-text-primary">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      token.layer === "base" ? "dtm-token-base" :
                                      token.layer === "semantic" ? "dtm-token-semantic" :
                                      "dtm-token-specific"
                                    }`}
                                  />
                                  {token.type === "color" &&
                                    token.value.startsWith("#") && (
                                      <div
                                        className="w-3 h-3 rounded border border-white/20"
                                        style={{ backgroundColor: token.value }}
                                      />
                                    )}
                                  {token.name}
                                </div>
                                <div className="text-xs dtm-text-muted break-all">
                                  {token.value}
                                </div>
                                {/* Canvas indicator */}
                                <div className="text-xs mt-1">
                                  {nodePositions[token.id] ? (
                                    <span className="text-green-400">✓ On Canvas</span>
                                  ) : (
                                    <span className="text-orange-400">📋 In Sidebar</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                className="w-6 h-6 dtm-btn-secondary rounded flex items-center justify-center transition-all"
                                onClick={() => editToken(token)}
                                title="Edit token"
                              >
                                <Edit size={12}/>
                              </button>
                              {/* Remove from group button - only show if token is in a group */}
                              {tokenGroups.find(g => g.tokenIds.includes(token.id)) && (
                                <button
                                  className="w-6 h-6 dtm-btn-secondary rounded flex items-center justify-center transition-all"
                                  onClick={() => {
                                    const group = tokenGroups.find(g => g.tokenIds.includes(token.id));
                                    if (group) {
                                      removeTokenFromGroup(group.id, token.id);
                                    }
                                  }}
                                  title="Remove from group"
                                >
                                  <Ungroup size={12} />
                                </button>
                              )}
                              <button
                                className="w-6 h-6 dtm-btn-secondary rounded flex items-center justify-center transition-all"
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          ) : (
            <div className="mb-8 mt-8">
              <div className="space-y-4">
                {(["base", "semantic", "specific"] as const).map((layer) => (
                  <div key={layer} className="flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          layer === "base" ? "dtm-token-base" :
                          layer === "semantic" ? "dtm-token-semantic" :
                          "dtm-token-specific"
                        }`}
                      />
                      <span className="text-xs dtm-text-muted">
                        {tokens[layer]?.length || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Token Groups Section */}
          {tokenGroups.length > 0 && (
            <div className="dtm-tokens-groups">
              <h3 className="text-sm font-semibold dtm-text-muted uppercase tracking-wide mb-4">
                Token Groups
              </h3>
              <div className="space-y-3">
                {tokenGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`dtm-bg-tertiary/30 border dtm-border-primary rounded-md overflow-hidden ${
                      draggedGroupId === group.id ? 'opacity-50 scale-95' : ''
                    } ${
                      dropTargetGroupId === group.id && draggedGroupId !== group.id ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleGroupDragStart(e, group)}
                    onDragOver={(e) => handleGroupDragOver(e, group)}
                    onDragLeave={handleGroupDragLeave}
                    onDragEnd={handleGroupDragEnd}
                    onDrop={(e) => handleGroupDrop(e, group)}
                  >
                    {/* Group Header */}
                    <div className="p-2 dtm-bg-tertiary/50 border-b dtm-border-primary">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            className="dtm-text-muted hover:dtm-text-primary transition-colors"
                            onClick={() => toggleGroupCollapse(group.id)}
                          >
                            {group.collapsed ? "▶" : "▼"}
                          </button>
                          <div className="cursor-grab text-xs dtm-text-muted opacity-60 hover:opacity-100">
                            ⋮⋮
                          </div>
                          <button
                            className={`font-semibold text-sm transition-colors ${
                              selectedGroup === group.id
                                ? "dtm-text-primary"
                                : "dtm-text-secondary hover:dtm-text-primary"
                            }`}
                            onClick={() =>
                              setSelectedGroup(
                                selectedGroup === group.id ? null : group.id,
                              )
                            }
                          >
                            {group.name}
                          </button>
                          <span className="text-xs dtm-text-muted">
                            ({group.tokenIds.length})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="dtm-btn-secondary px-2 py-1 rounded text-xs transition-colors dtm-text-primary-75"
                            onClick={() => editGroup(group)}
                            title="Edit group name"
                          >
                                                                                      <Edit size={12}/>
                              </button>
                              <button
                            className="dtm-btn-secondary px-2 py-1 rounded text-xs transition-colors dtm-text-primary-75"
                            onClick={() => deleteGroup(group.id)}
                            title="Delete group"
                          >
                            <Trash2 size={12} />
                          </button>
                          {selectedGroup === group.id && (
                            <button
                              className="dtm-btn-secondary px-2 py-1 rounded text-xs transition-colors dtm-text-primary-75"
                              onClick={() => ungroupTokens(group.id)}
                              title="Ungroup tokens"
                            >
                                                             <Unlink size={12}/>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Group Tokens */}
                    {!group.collapsed && (
                      <div className="p-2 space-y-2">
                        {group.tokenIds.map((tokenId) => {
                          const token = Object.values(tokens)
                            .flat()
                            .find((t) => t.id === tokenId);
                          if (!token) return null;

                          return (
                            <div
                              key={tokenId}
                              className="dtm-bg-secondary/30 border dtm-border-secondary/50 rounded-md p-2 text-sm group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {token.type === "color" &&
                                    token.value.startsWith("#") && (
                                      <div
                                        className="w-3 h-3 rounded border border-white/20 mr-2"
                                        style={{ backgroundColor: token.value }}
                                      />
                                    )}
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-3 h-3 rounded-full ${
                                        token.layer === "base" ? "dtm-token-base" :
                                        token.layer === "semantic" ? "dtm-token-semantic" :
                                        "dtm-token-specific"
                                      }`}
                                    />
                                    <span className="font-medium dtm-text-primary">
                                      {token.name}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  className="w-5 h-5 dtm-btn-secondary rounded flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                  onClick={() => removeTokenFromGroup(group.id, tokenId)}
                                  title="Remove from group"
                                >
                                  <Ungroup size={10} />
                                </button>
                              </div>
                              <div className="text-xs dtm-text-muted mt-1">
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
        <div className={`absolute top-0 right-5 p-5 px-8 z-40 flex gap-2 items-center transition-all duration-500 ease-in-out ${isTopBarCollapsed ? 'translate-x-full' : ''}`}>
          {/* Collapse/Expand button */}
          <div className="absolute top-4 right-0">
            <button
              className="dtm-text-muted hover:dtm-text-primary p-2 rounded transition-colors dtm-bg-secondary/95 backdrop-blur-sm border dtm-border-primary"
              onClick={() => setIsTopBarCollapsed(!isTopBarCollapsed)}
              title={isTopBarCollapsed ? "Show menu" : "Hide menu"}
            >
              <span className="text-lg">{isTopBarCollapsed ? "⋯" : "→"}</span>
            </button>
          </div>
          {/* Multi-selection Menu */}
          {selectedTokens.size >= 2 && (
            <div className="dtm-bg-secondary/95 backdrop-blur-sm border dtm-border-primary rounded-md p-2 flex items-center gap-3">
              <span className="text-sm dtm-text-primary">
                {selectedTokens.size} tokens selected
              </span>
              <button
                className="dtm-btn-success px-2 py-1 rounded-md text-xs transition-colors flex items-center gap-1"
                onClick={() => setIsGroupModalOpen(true)}
              >
                <Layers size={12} />
                Group Tokens
              </button>
              <button
                className="dtm-btn-secondary px-2 py-1 rounded-md text-xs transition-colors flex items-center gap-1"
                onClick={() => setSelectedTokens(new Set())}
              >
                <X size={12} />
                Clear Selection
              </button>
            </div>
          )}

          {/* Help text for single token selection */}
          {selectedTokens.size === 1 && (
            <div className="dtm-bg-secondary/95 backdrop-blur-sm border dtm-border-primary rounded-md p-2">
              <span className="text-xs dtm-text-muted">
                Hold Ctrl and click more tokens to group them
              </span>
            </div>
          )}

          <div className="flex gap-2 text-xs">
            {/* Undo / Redo */}
            <button
              className={`dtm-btn-secondary p-2 rounded-md transition-all flex items-center gap-2 ${history.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handleUndo}
              disabled={history.length === 0}
              title="Undo"
            >
              <RotateCcw size={16} />
            </button>
            {future.length > 0 && (
              <button
                className="dtm-btn-secondary px-3 py-1 rounded-md transition-all flex items-center gap-2 border dtm-border-primary"
                onClick={handleRedo}
                title="Redo"
              >
                <RotateCw size={16} />
              </button>
            )}

            {/* Save / Manage */}
            <button
              className="dtm-btn-secondary px-4 py-1 rounded-md shadow-lg transition-all flex items-center gap-2"
              onClick={() => {
                setSaveName(currentSetupName ?? "");
                setIsSaveModalOpen(true);
              }}
              title="Save current setup"
            >
              <SaveIcon size={16} />
              {currentSetupName ? `Save (${currentSetupName})` : "Save"}
              {isDirty && <span className="ml-1 text-xs opacity-80">*</span>}
            </button>
            <button
              className="dtm-btn-secondary px-4 py-1 rounded-md transition-all flex items-center gap-2"
              onClick={() => setIsManageModalOpen(true)}
              title="Manage saved setups"
            >
              <FolderOpen size={16} />
              Load
            </button>

            <button
              className="dtm-btn-secondary px-4 py-1 rounded-md shadow-lg transition-all flex items-center gap-2"
              onClick={exportTokens}
              title="Export clean JSON for Figma plugin (no coordinates)"
            >
              <Download size={16} />
              Export SD JSON (Figma)
            </button>
            <button
              className="dtm-btn-secondary px-4 py-1 rounded-md shadow-lg transition-all flex items-center gap-2"
              onClick={exportTokensDTCG}
              title="Export clean JSON for Figma plugin (no coordinates)"
            >
              <Download size={16} />
              Export DTCG JSON (Figma)
            </button>
            <button
              className="dtm-btn-secondary px-4 py-1 rounded-md shadow-lg transition-all flex items-center gap-2"
              onClick={() => setIsImportModalOpen(true)}
              title="Import JSON file from Style Dictionary or DTCG format"
            >
              <Search size={16} />
              Import JSON
            </button>
            <button
              className="dtm-btn-secondary px-4 py-1 rounded-md shadow-lg transition-all flex items-center gap-2"
              onClick={saveToLocalFile}
              title="Save complete project with coordinates and all data"
            >
              <SaveIcon size={16} />
              Save Project (Full)
            </button>
            <button
              className="dtm-btn-secondary px-4 py-1 rounded-md shadow-lg transition-all flex items-center gap-2"
              onClick={() => document.getElementById('load-project-input')?.click()}
              title="Load project from local file"
            >
              <FolderOpen size={16} />
              Load Project
            </button>
            <input
              id="load-project-input"
              type="file"
              accept=".json"
              onChange={loadFromLocalFile}
              style={{ display: 'none' }}
            />
            <button
              className="dtm-btn-secondary px-4 py-1 rounded-md shadow-lg transition-all flex items-center gap-2"
              onClick={toggleTheme}
              title={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
            >
              <Settings size={16} />
              {isDarkTheme ? "Light" : "Dark"}
            </button>
            
            {/* Performance Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 dtm-bg-secondary/50 rounded-md border dtm-border-primary">
              <div className={`w-2 h-2 rounded-full ${
                renderQuality === 'high' ? 'bg-green-400' : 
                renderQuality === 'medium' ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              <span className="text-xs dtm-text-muted">
                {renderQuality === 'high' ? 'High' : 
                 renderQuality === 'medium' ? 'Medium' : 'Low'} Quality
              </span>
            </div>
          </div>
        </div>

        {/* Three dots button when top bar is collapsed */}
        {isTopBarCollapsed && (
          <div className="absolute top-5 right-5 z-40">
            <button
              className="dtm-text-muted hover:dtm-text-primary p-2 rounded transition-colors dtm-bg-secondary/95 backdrop-blur-sm border dtm-border-primary"
              onClick={() => setIsTopBarCollapsed(false)}
              title="Show menu"
            >
              <span className="text-lg">⋯</span>
            </button>
          </div>
        )}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`w-full h-full ${isDraggingCanvas ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={(e) => {
            if (isDraggingCanvas) {
              e.preventDefault();
              setCanvasOffset((prev) => ({
                x: prev.x + e.movementX,
                y: prev.y + e.movementY,
              }));
              // Optimize canvas during dragging
              optimizeCanvas();
            }
          }}
          onDrop={onDropToCanvas}
          onDragOver={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          onWheel={handleWheel}
          title="Canvas Controls: Middle-click drag to pan, Mouse wheel to zoom, Space+click to drag"
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

              // Check if tokens are in groups and their collapsed state
              const fromTokenGroup = tokenGroups.find((group) =>
                group.tokenIds.includes(connection.from)
              );
              const toTokenGroup = tokenGroups.find((group) =>
                group.tokenIds.includes(connection.to)
              );
              
              // Hide connection if BOTH tokens are in DIFFERENT groups and BOTH groups are collapsed
              if (fromTokenGroup && toTokenGroup && 
                  fromTokenGroup.id !== toTokenGroup.id && 
                  fromTokenGroup.canvasCollapsed && 
                  toTokenGroup.canvasCollapsed) {
                return null;
              }

              // Calculate connection start and end points based on socket positions
              let fromX = fromPos.x + 75; // Default to center
              let fromY = fromPos.y + 100; // Default to bottom
              let toX = toPos.x + 75; // Default to center
              let toY = toPos.y; // Default to top

              // Adjust start point based on from socket
              if (connection.fromSocket === "top") {
                fromX = fromPos.x + 75; // Center horizontally
                fromY = fromPos.y - 2;
              } else if (connection.fromSocket === "bottom") {
                fromX = fromPos.x + 75; // Center horizontally
                fromY = fromPos.y + 100 + 2;
              } else if (connection.fromSocket === "left") {
                fromX = fromPos.x - 3;
                fromY = fromPos.y + 50; // Center vertically
              } else if (connection.fromSocket === "right") {
                fromX = fromPos.x + 150 + 3;
                fromY = fromPos.y + 50; // Center vertically
              }

              // Adjust end point based on to socket
              if (connection.toSocket === "top") {
                toX = toPos.x + 75; // Center horizontally
                toY = toPos.y - 2;
              } else if (connection.toSocket === "bottom") {
                toX = toPos.x + 75; // Center horizontally
                toY = toPos.y + 100 + 2;
              } else if (connection.toSocket === "left") {
                toX = toPos.x - 3;
                toY = toPos.y + 50; // Center vertically
              } else if (connection.toSocket === "right") {
                toX = toPos.x + 150 + 3;
                toY = toPos.y + 50; // Center vertically
              }

              const path = createConnectionPath(
                fromX,
                fromY,
                toX,
                toY,
                connection.fromSocket,
                connection.toSocket,
              );



              return (
                <path
                  key={connection.id}
                  d={path}
                  stroke="#ffffff"
                  strokeWidth="2"
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
                strokeWidth="2"
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
                onAddTokenToGroup={addTokenToGroup}
                onRemoveTokenFromGroup={removeTokenFromGroup}
                canvasRef={canvasRef}
                canvasOffset={canvasOffset}
                canvasScale={canvasScale}
                isPanningMode={isSpacePressed || isDraggingCanvas}
                onDragGroupEnd={markHistory}
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
                    onDragEnd={markHistory}
                    connections={connections}
                    isInGroup={!!tokenGroup}
                    onRemoveFromGroup={tokenGroup ? (tokenId) => removeTokenFromGroup(tokenGroup.id, tokenId) : undefined}
                  />
                );
              })}
          </div>

          {/* Bottom-right Controls & Minimap */}
          <div className="absolute bottom-4 right-4 z-50 flex items-end gap-3">
            {/* Zoom Controls */}
            <div className="dtm-bg-secondary/90 backdrop-blur-sm border dtm-border-primary rounded-md p-1 flex items-center gap-1 shadow-lg">
              <button
                className="w-8 h-8 rounded dtm-bg-tertiary hover:dtm-bg-secondary border dtm-border-primary flex items-center justify-center dtm-text-primary"
                onClick={() => zoomAtAnchor(1 / 1.1)}
                title="Zoom Out"
              >
                <Minus size={16} />
              </button>
              <div className="text-xs dtm-text-primary w-14 text-center select-none">
                {Math.round(canvasScale * 100)}%
              </div>
              <button
                className="w-8 h-8 rounded dtm-bg-tertiary hover:dtm-bg-secondary border dtm-border-primary flex items-center justify-center dtm-text-primary"
                onClick={() => zoomAtAnchor(1.1)}
                title="Zoom In"
              >
                <Plus size={16} />
              </button>
              <button
                className="ml-1 px-2 h-8 rounded dtm-bg-tertiary hover:dtm-bg-secondary border dtm-border-primary text-xs dtm-text-primary"
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
              const handleMinimapClick = (e: React.MouseEvent) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                
                // Convert minimap coordinates to canvas coordinates
                const canvasX = (clickX - miniOffsetX) / miniScale + minX;
                const canvasY = (clickY - miniOffsetY) / miniScale + minY;
                
                // Center the view on the clicked position
                const newOffsetX = -(canvasX - viewportSize.width / 2 / canvasScale);
                const newOffsetY = -(canvasY - viewportSize.height / 2 / canvasScale);
                
                setCanvasOffset({ x: newOffsetX, y: newOffsetY });
              };

              const handleMinimapDrag = (e: React.MouseEvent) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const dragX = e.clientX - rect.left;
                const dragY = e.clientY - rect.top;
                
                // Convert minimap coordinates to canvas coordinates
                const canvasX = (dragX - miniOffsetX) / miniScale + minX;
                const canvasY = (dragY - miniOffsetY) / miniScale + minY;
                
                // Update canvas offset to center on dragged position
                const newOffsetX = -(canvasX - viewportSize.width / 2 / canvasScale);
                const newOffsetY = -(canvasY - viewportSize.height / 2 / canvasScale);
                
                setCanvasOffset({ x: newOffsetX, y: newOffsetY });
              };

              return (
                <div className="dtm-bg-primary/80 backdrop-blur-sm border dtm-border-primary rounded-md p-1 shadow-lg">
                  <svg 
                    width={miniW} 
                    height={miniH} 
                    className="block cursor-pointer"
                    onClick={handleMinimapClick}
                    onMouseDown={handleMinimapDrag}
                  >
                    <rect x={0} y={0} width={miniW} height={miniH} fill="hsl(var(--dtm-bg-primary))" rx={8} />
                    {/* Content bounds */}
                    <rect
                      x={miniOffsetX}
                      y={miniOffsetY}
                      width={boundsWidth * miniScale}
                      height={boundsHeight * miniScale}
                      fill="hsl(var(--dtm-bg-secondary))"
                      stroke="hsl(var(--dtm-border-primary))"
                      rx={6}
                    />
                    {/* Nodes */}
                    {positioned.map(({ t, p }) => (
                      <rect
                        key={t.id}
                        x={(p!.x - minX) * miniScale + miniOffsetX}
                        y={(p!.y - minY) * miniScale + miniOffsetY}
                        width={Math.max(4, 150 * miniScale)}
                        height={Math.max(4, 100 * miniScale)}
                        fill="hsl(var(--dtm-primary))"
                        rx={2}
                      />
                    ))}
                    {/* Viewport */}
                    <rect
                      x={viewX}
                      y={viewY}
                      width={viewW}
                      height={viewH}
                      fill="none"
                      stroke="hsl(var(--dtm-border-accent))"
                      strokeWidth="2"
                      strokeDasharray="4,4"
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
          <div className="bg-slate-800 p-4 rounded-lg max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-semibold mb-6">Add New Token</h2>
            <div className="text-sm text-slate-400 mb-4">
              {currentLayer === "base" && "Base tokens define fundamental values (colors, sizes, etc.)"}
              {currentLayer === "semantic" && "Semantic tokens reference base tokens to create meaningful names"}
              {currentLayer === "specific" && "Specific tokens reference semantic or base tokens for specific use cases"}
            </div>
            <div className="text-sm text-blue-400 mb-4">
              💡 After creating a token, drag it from the sidebar to the canvas to place it!
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Token Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
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
                
                {/* For Semantic and Specific tokens, show dropdown of existing tokens */}
                {(currentLayer === "semantic" || currentLayer === "specific") ? (
                  <div className="space-y-2">
                    <select
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
                      value={tokenForm.value}
                      onChange={(e) =>
                        setTokenForm((prev) => ({ ...prev, value: e.target.value }))
                      }
                    >
                      <option value="">Select from existing tokens...</option>
                      {currentLayer === "semantic" && tokens.base.map((token) => (
                        <option key={token.id} value={token.name}>
                          {token.name} ({token.value})
                        </option>
                      ))}
                      {currentLayer === "specific" && [
                        ...tokens.semantic.map((token) => ({ ...token, layer: "semantic" })),
                        ...tokens.base.map((token) => ({ ...token, layer: "base" }))
                      ].map((token) => (
                        <option key={token.id} value={token.name}>
                          [{token.layer}] {token.name} ({token.value})
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-slate-400">
                      💡 Tip: Select an existing token to automatically create a connection
                      {currentLayer === "semantic" && ` (${tokens.base.length} base tokens available)`}
                      {currentLayer === "specific" && ` (${tokens.semantic.length + tokens.base.length} tokens available)`}
                    </div>
                    <div className="text-xs text-slate-400">
                      Or enter a custom value:
                    </div>
                    <input
                      type="text"
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
                      value={tokenForm.value}
                      onChange={(e) =>
                        setTokenForm((prev) => ({ ...prev, value: e.target.value }))
                      }
                      placeholder="Enter custom value or select from dropdown above"
                    />
                  </div>
                ) : (
                  /* For Base tokens, show regular input */
                  <input
                    type="text"
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
                    value={tokenForm.value}
                    onChange={(e) =>
                      setTokenForm((prev) => ({ ...prev, value: e.target.value }))
                    }
                    placeholder={
                      currentTokenType === "color" ? "#4a90e2" : "Enter value..."
                    }
                  />
                )}

                {/* Color Palette for color tokens */}
                {currentTokenType === "color" && (
                  <div className="mt-4 p-2 bg-slate-700/50 rounded-md">
                    <div className="text-sm text-slate-400 mb-3">
                      Choose a color:
                    </div>
                    <div className="grid grid-cols-10 gap-1 mb-3">
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
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-2 py-2 rounded-md transition-colors"
                onClick={() => {
                  setIsModalOpen(false);
                  setTokenForm({ name: "", value: "" });
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 rounded-md transition-colors"
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
          <div className="bg-slate-800 p-4 rounded-lg max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-red-400">
              Confirm Deletion
            </h2>
            <p className="text-slate-300 mb-6">
              Token "
              <strong className="text-red-400">{deleteConfirmation.tokenName}</strong>" will be completely deleted!
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => setDeleteConfirmation(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
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
          <div className="bg-slate-800 p-4 rounded-lg max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-semibold mb-6">Create Token Group</h2>

            <div className="mb-4">
              <p className="text-slate-300 text-sm mb-4">
                Create a group with {selectedTokens.size} selected tokens:
              </p>
              <div className="bg-slate-700/50 p-2 rounded-md mb-4 max-h-32 overflow-y-auto">
                {Array.from(selectedTokens).map((tokenId) => {
                  const token = Object.values(tokens)
                    .flat()
                    .find((t) => t.id === tokenId);
                  return token ? (
                    <div
                      key={tokenId}
                      className="text-sm text-slate-400 flex items-center gap-2 mb-1"
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${
                          token.layer === "base" ? "bg-blue-500" :
                          token.layer === "semantic" ? "bg-green-500" :
                          "bg-red-500"
                        }`}
                      />
                      {token.type === "color" &&
                        token.value.startsWith("#") && (
                          <div
                            className="w-3 h-3 rounded border border-white/20"
                            style={{ backgroundColor: token.value }}
                          />
                        )}
                      {token.name}
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
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ name: e.target.value })}
                  placeholder="e.g., Brand Colors"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => {
                  setIsGroupModalOpen(false);
                  setGroupForm({ name: "" });
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={createGroup}
                disabled={!groupForm.name.trim()}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Setup Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-4 rounded-lg max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4">Save Current Setup</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g., My Setup"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => {
                  setIsSaveModalOpen(false);
                  setSaveName("");
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!saveName.trim()}
                onClick={() => {
                  saveCurrentSetup(saveName.trim());
                  setIsSaveModalOpen(false);
                }}
              >
                {loadAllSetups()[saveName.trim()] ? "Overwrite" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Saved Setups Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-4 rounded-lg max-w-lg w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-semibold mb-6">Saved Setups</h2>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-700 border border-slate-700 rounded-lg">
              {Object.entries(loadAllSetups()).length === 0 && (
                <div className="p-4 text-slate-400 text-sm">No saved setups yet.</div>
              )}
              {Object.entries(loadAllSetups()).map(([name, data]) => (
                <div key={name} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-slate-400">Saved {data._meta?.savedAt ? new Date(data._meta.savedAt).toLocaleString() : ""}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm"
                      onClick={() => {
                        applySnapshot(data);
                        setCurrentSetupName(name);
                        lastSavedHashRef.current = computeHash({ tokens: data.tokens, nodePositions: data.nodePositions, connections: data.connections, tokenGroups: data.tokenGroups, collapsedLayers: data.collapsedLayers });
                        setIsDirty(false);
                        setHistory([]);
                        setFuture([]);
                        setIsManageModalOpen(false);
                      }}
                    >
                      Load
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      onClick={() => {
                        const all = loadAllSetups();
                        delete all[name];
                        saveAllSetups(all);
                        // force re-render by toggling state
                        setIsManageModalOpen(false);
                        setTimeout(() => setIsManageModalOpen(true), 0);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => setIsManageModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Token Modal */}
      {editingToken && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-semibold mb-6">Edit Token</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
                  value={editingToken.name}
                  onChange={(e) => setEditingToken({ ...editingToken, name: e.target.value })}
                  placeholder="Token name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Value</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
                  value={editingToken.value}
                  onChange={(e) => setEditingToken({ ...editingToken, value: e.target.value })}
                  placeholder="Token value"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                <select
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
                  value={editingToken.type}
                  onChange={(e) => setEditingToken({ ...editingToken, type: e.target.value as Token["type"] })}
                >
                  <option value="color">Color</option>
                  <option value="text">Text</option>
                  <option value="spacing">Spacing</option>
                  <option value="boolean">Boolean</option>
                  <option value="string">String</option>
                  <option value="number">Number</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Layer</label>
                <select
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
                  value={editingToken.layer}
                  onChange={(e) => setEditingToken({ ...editingToken, layer: e.target.value as Token["layer"] })}
                >
                  <option value="base">Base</option>
                  <option value="semantic">Semantic</option>
                  <option value="specific">Specific</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => setEditingToken(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!editingToken.name.trim() || !editingToken.value.trim()}
                onClick={updateToken}
              >
                Update Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-semibold mb-6">Edit Group</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Group Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  placeholder="Group name"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => setEditingGroup(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!editingGroup.name.trim()}
                onClick={updateGroup}
              >
                Update Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-2xl w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-semibold mb-6">Import JSON</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Import Format</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="importFormat"
                      value="style-dictionary"
                      checked={importFormat === "style-dictionary"}
                      onChange={(e) => setImportFormat(e.target.value as "style-dictionary" | "dtcg" | "flat-json" | "nested-collections" | "generic")}
                      className="text-blue-500"
                    />
                    <span>Style Dictionary</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="importFormat"
                      value="dtcg"
                      checked={importFormat === "dtcg"}
                      onChange={(e) => setImportFormat(e.target.value as "style-dictionary" | "dtcg" | "flat-json" | "nested-collections" | "generic")}
                      className="text-blue-500"
                    />
                    <span>DTCG</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="importFormat"
                      value="flat-json"
                      checked={importFormat === "flat-json"}
                      onChange={(e) => setImportFormat(e.target.value as "style-dictionary" | "dtcg" | "flat-json" | "nested-collections" | "generic")}
                      className="text-blue-500"
                    />
                    <span>Flat JSON</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="importFormat"
                      value="nested-collections"
                      checked={importFormat === "nested-collections"}
                      onChange={(e) => setImportFormat(e.target.value as "style-dictionary" | "dtcg" | "flat-json" | "nested-collections" | "generic")}
                      className="text-blue-500"
                    />
                    <span>Nested Collections</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">JSON Data</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    onClick={() => setImportData(`{
  "base": {
    "color-base": {
      "type": "color",
      "value": "#00b8c4ff",
      "blendMode": "normal"
    }
  },
  "semantic": {
    "surface-color": {
      "description": "",
      "type": "color",
      "value": "{base.color-base}"
    }
  },
  "specific": {
    "btn-bg-color": {
      "description": "",
      "type": "color",
      "value": "{base.surface-color}"
    }
  }
}`)}
                  >
                    Load Sample Nested Collections
                  </button>
                </div>
                <textarea
                  className="w-full h-64 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-blue-400 focus:outline-none font-mono text-sm"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste your JSON data here..."
                />
              </div>
                              <div className="text-xs text-slate-400">
                  <p><strong>Style Dictionary format:</strong> Tokens organized by layer and type</p>
                  <p><strong>DTCG format:</strong> Design Token Community Group standard format</p>
                  <p><strong>Flat JSON format:</strong> Flat structure with automatic layer detection based on references</p>
                  <p><strong>Nested Collections format:</strong> Tokens organized by collections (base, semantic, specific) with cross-collection references</p>
                </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportData("");
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!importData.trim()}
                onClick={handleImport}
              >
                Import Tokens
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
