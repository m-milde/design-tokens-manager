import React, { useState, useRef, useCallback, useEffect } from "react";
import { Trash2, X, Plus, Download, Minus, RotateCcw, RotateCw, Save as SaveIcon, FolderOpen, Upload, Pencil, Ungroup } from "lucide-react";

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
  onDragEnd?: () => void;
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
      {/* Input Port */}
      <div
        className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 dtm-bg-white border-2 rounded-full cursor-crosshair hover:scale-125"
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
        {token.name}
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
            <X size={10} />
          </button>
          <button
            className="w-6 h-6 dtm-btn-primary rounded flex items-center justify-center transition-all text-xs"
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
        </div>
      )}

      {/* Output Port */}
      <div
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 dtm-bg-white border-2 rounded-full cursor-crosshair transition-all hover:scale-125"
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
  const [importFormat, setImportFormat] = useState<"style-dictionary" | "dtcg">("style-dictionary");

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
    if (!tokenForm.name || !tokenForm.value) return;

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

        markHistory();
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
    };

    markHistory();
    setTokenGroups((prev) => [...prev, newGroup]);
    setSelectedTokens(new Set());
    setIsGroupModalOpen(false);
    setGroupForm({ name: "" });
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
      if (layer === "_meta") return;
      
      // Map layer names to our system
      let targetLayer: "base" | "semantic" | "specific" = "base";
      if (layer === "semantic" || layer === "semantic-tokens") targetLayer = "semantic";
      if (layer === "specific" || layer === "specific-tokens") targetLayer = "specific";
      
      Object.entries(layerData).forEach(([type, typeData]: [string, any]) => {
        Object.entries(typeData).forEach(([name, tokenData]: [string, any]) => {
          const token: Token = {
            id: `token_${nextTokenId++}`,
            name,
            value: (tokenData as any).value || "",
            type: type as Token["type"],
            layer: targetLayer,
          };
          
          newTokens[targetLayer].push(token);
          // Store token with its original name for connection building
          tokenMap.set(`${targetLayer}.${name}`, token);
        });
      });
    });
    
    // Now process connections based on references
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
        
        if (sourceToken) {
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
      if (layer === "_meta") return;
      
      // Map layer names to our system
      let targetLayer: "base" | "semantic" | "specific" = "base";
      if (layer === "semantic" || layer === "semantic-tokens") targetLayer = "semantic";
      if (layer === "specific" || layer === "specific-tokens") targetLayer = "specific";
      
      Object.entries(layerData).forEach(([type, typeData]: [string, any]) => {
        Object.entries(typeData).forEach(([name, tokenData]: [string, any]) => {
          const token: Token = {
            id: `token_${nextTokenId++}`,
            name,
            value: (tokenData as any).$value || "",
            type: type as Token["type"],
            layer: targetLayer,
          };
          
          newTokens[targetLayer].push(token);
          // Store token with its original name for connection building
          tokenMap.set(`${targetLayer}.${type}.${name}`, token);
        });
      });
    });
    
    // Process connections for DTCG format
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
        
        if (sourceToken) {
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
    
    return { newTokens, newConnections };
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
      } else {
        result = importFromDTCG(parsedData);
      }
      
      // Clear existing data and apply imported data
      markHistory();
      setTokens(result.newTokens);
      setConnections(result.newConnections);
      setNodePositions({});
      setTokenGroups([]);
      
      // Auto-position tokens on canvas
      const allTokens = Object.values(result.newTokens).flat();
      const newPositions: { [key: string]: { x: number; y: number } } = {};
      
      allTokens.forEach((token: Token, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        newPositions[token.id] = {
          x: col * 250 + 100,
          y: row * 150 + 100,
        };
      });
      
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

  const exportTokensDTCG = () => {
    const dtcg: any = {};
    const mapType = (t: Token["type"]) => {
      if (t === "color") return "color";
      if (t === "text" || t === "spacing") return "dimension";
      if (t === "boolean") return "boolean";
      if (t === "string") return "string";
      if (t === "number") return "number";
      return t;
    };
    Object.keys(tokens).forEach((layer) => {
      if (!dtcg[layer]) dtcg[layer] = {};
      tokens[layer].forEach((token) => {
        if (!dtcg[layer][token.type]) dtcg[layer][token.type] = {};
        let value: string = token.value;
        if (value.startsWith("{") && value.endsWith("}")) {
          const ref = value.slice(1, -1);
          const [refLayer, refName] = ref.split(".");
          value = `${refLayer}.${token.type}.${refName}`;
        }
        dtcg[layer][token.type][token.name] = {
          $value: value,
          $type: mapType(token.type),
        };
      });
    });
    const dataStr = JSON.stringify(dtcg, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "design-tokens-dtcg.json");
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
                    className={`p-2 text-xs rounded-md border transition-all ${
                      currentTokenType === type
                        ? "dtm-btn-primary dtm-text-primary"
                        : "dtm-btn-secondary hover:dtm-text-primary hover:dtm-border-accent hover:dtm-bg-tertiary"
                    }`}
                    onClick={() => setCurrentTokenType(type)}
                  >
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
                    className={`w-8 h-8 dtm-text-primary-75 rounded-md border transition-all ${
                      currentTokenType === type
                        ? "dtm-btn-primary dtm-border-accent"
                        : "dtm-bg-secondary dtm-border-primary dtm-text-primary hover:dtm-btn-primary hover:dtm-border-accent"
                    }`}
                    onClick={() => setCurrentTokenType(type)}
                    title={type.charAt(0).toUpperCase() + type.slice(1)}
                  />
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
                    className="text-xs dtm-text-muted hover:dtm-text-primary px-2 py-1 rounded border dtm-border-secondary hover:dtm-border-primary transition-colors"
                    onClick={() => setCollapsedLayers({ base: false, semantic: false, specific: false })}
                    title="Expand all layers"
                  >
                    ▼
                  </button>
                  <button
                    className="text-xs dtm-text-muted hover:dtm-text-primary px-2 py-1 rounded border dtm-border-secondary hover:dtm-border-primary transition-colors"
                    onClick={() => setCollapsedLayers({ base: true, semantic: true, specific: true })}
                    title="Collapse all layers"
                  >
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
                          className="dtm-bg-secondary border dtm-border-secondary rounded-md p-2 hover:dtm-bg-secondary/70 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className="flex-1 cursor-grab"
                              draggable
                              onDragStart={(e) => onDragFromPanel(token, e)}
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
                            </div>
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                className="w-6 h-6 dtm-btn-secondary rounded flex items-center justify-center transition-all"
                                onClick={() => editToken(token)}
                                title="Edit token"
                              >
                                <Pencil size={12}/>
                              </button>
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
            <div className="mb-8">
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
                    className="dtm-bg-tertiary/30 border dtm-border-primary rounded-md overflow-hidden"
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
                            <Pencil size={12}/>
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
                              <Ungroup size={12}/>
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
                              className="dtm-bg-secondary/30 border dtm-border-secondary/50 rounded-md p-2 text-sm"
                            >
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
                className="dtm-btn-success px-2 py-1 rounded-md text-xs transition-colors"
                onClick={() => setIsGroupModalOpen(true)}
              >
                Group Tokens
              </button>
              <button
                className="dtm-btn-secondary px-2 py-1 rounded-md text-xs transition-colors"
                onClick={() => setSelectedTokens(new Set())}
              >
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
              title="Export in Style Dictionary format"
            >
              <Upload size={16} />
              Export SD JSON
            </button>
            <button
              className="dtm-btn-secondary px-4 py-1 rounded-md shadow-lg transition-all flex items-center gap-2"
              onClick={exportTokensDTCG}
              title="Export in Design Token Community Group format"
            >
              <Upload size={16} />
              Export DTCG JSON
            </button>
            <button
              className="dtm-btn-secondary px-4 py-1 rounded-md shadow-lg transition-all flex items-center gap-2"
              onClick={() => setIsImportModalOpen(true)}
              title="Import JSON file from Style Dictionary or DTCG format"
            >
              <Download size={16} />
              Import JSON
            </button>
            <button
              className="dtm-btn-secondary px-4 py-1 rounded-md shadow-lg transition-all flex items-center gap-2"
              onClick={toggleTheme}
              title={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
            >
              <span className="text-lg">{isDarkTheme ? "☼" : "☾"}</span>
              {isDarkTheme ? "" : ""}
            </button>
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
              return (
                <div className="dtm-bg-primary/80 backdrop-blur-sm border dtm-border-primary rounded-md p-1 shadow-lg">
                  <svg width={miniW} height={miniH} className="block">
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
          <div className="bg-slate-800 p-4 rounded-lg max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-semibold mb-6">Add New Token</h2>

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
                      onChange={(e) => setImportFormat(e.target.value as "style-dictionary" | "dtcg")}
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
                      onChange={(e) => setImportFormat(e.target.value as "style-dictionary" | "dtcg")}
                      className="text-blue-500"
                    />
                    <span>DTCG</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">JSON Data</label>
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
