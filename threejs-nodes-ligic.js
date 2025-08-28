/**
 * Core 2D Node Editor Logic
 *
 * This JavaScript setup provides the foundational classes and functions
 * for a flat, 2D node-based application. It uses the HTML5 Canvas API
 * for all rendering and mouse event handling. This code is intended
 * to replace an existing SVG drawing system while preserving the
 * application's core logic.
 *
 * It is completely independent of any HTML UI elements and can be
 * integrated into a larger application.
 *
 * @author Gemini AI
 * @version 1.0
 */

// --- Global Constants and State (To be initialized by your application) ---

// You should get a reference to your canvas element and its context
// For example:
// const canvas = document.getElementById('my-node-canvas');
// const ctx = canvas.getContext('2d');

// Global state variables
let nodes = [];
let connections = [];
let isConnecting = false;
let dragNode = null;
let dragOffset = { x: 0, y: 0 };
let startSocket = null;
let mouse = { x: 0, y: 0 };
let temporaryConnection = null;

const NODE_WIDTH = 180;
const NODE_HEIGHT = 120; // Will be adjusted dynamically
const SOCKET_RADIUS = 8;
const SOCKET_SPACING = 30;

// --- Node and Socket Classes ---

class Node {
    /**
     * Represents a single node in the graph.
     * @param {number} id - Unique identifier for the node.
     * @param {number} x - X position of the node.
     * @param {number} y - Y position of the node.
     * @param {object} config - Configuration object for the node.
     * @param {string} [config.title] - The title of the node.
     * @param {Array<object>} [config.inputs] - Array of input sockets.
     * @param {Array<object>} [config.outputs] - Array of output sockets.
     */
    constructor(id, x, y, config = {}) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = NODE_WIDTH;
        this.height = NODE_HEIGHT;
        this.title = config.title || `Node ${id}`;
        this.inputs = config.inputs || [];
        this.outputs = config.outputs || [];

        // Add some default sockets if none are provided
        if (this.inputs.length === 0) {
            for (let i = 0; i < 3; i++) {
                this.inputs.push({ name: `Input ${i + 1}` });
            }
        }
        if (this.outputs.length === 0) {
            for (let i = 0; i < 3; i++) {
                this.outputs.push({ name: `Output ${i + 1}` });
            }
        }

        // Dynamically adjust height for more sockets
        const numSockets = Math.max(this.inputs.length, this.outputs.length);
        this.height = Math.max(NODE_HEIGHT, 40 + (numSockets * SOCKET_SPACING) + 10);
    }

    /**
     * Draws the node and its sockets on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     */
    draw(ctx) {
        // Draw node box
        ctx.fillStyle = '#4b5563';
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 10);
        ctx.fill();
        ctx.stroke();

        // Reset shadows for cleaner drawing of sockets and text
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw title
        ctx.fillStyle = '#f3f4f6';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(this.title, this.x + this.width / 2, this.y + 25);

        // Draw sockets and labels
        this.inputs.forEach((socket, i) => {
            const y = this.y + 40 + (i * SOCKET_SPACING);
            this.drawSocket(ctx, this.x, y, '#ef4444', socket.isHovered);
            ctx.fillStyle = '#e5e7eb';
            ctx.textAlign = 'left';
            ctx.fillText(socket.name, this.x + 15, y + 5);
        });

        this.outputs.forEach((socket, i) => {
            const y = this.y + 40 + (i * SOCKET_SPACING);
            this.drawSocket(ctx, this.x + this.width, y, '#22c55e', socket.isHovered);
            ctx.fillStyle = '#e5e7eb';
            ctx.textAlign = 'right';
            ctx.fillText(socket.name, this.x + this.width - 15, y + 5);
        });
    }

    /**
     * Draws a single socket.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * @param {number} x - X position.
     * @param {number} y - Y position.
     * @param {string} color - Socket color.
     * @param {boolean} isHovered - True if the socket is hovered.
     */
    drawSocket(ctx, x, y, color, isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, SOCKET_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = isHovered ? '#ffff00' : color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * Checks if a point is inside the node.
     * @param {number} x - X coordinate of the point.
     * @param {number} y - Y coordinate of the point.
     * @returns {boolean} - True if the point is inside.
     */
    isPointInNode(x, y) {
        return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
    }

    /**
     * Finds the socket at a given point.
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @returns {object|null} - The socket object or null.
     */
    getSocketAtPoint(x, y) {
        // Check input sockets
        for (let i = 0; i < this.inputs.length; i++) {
            const sockY = this.y + 40 + (i * SOCKET_SPACING);
            const dist = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - sockY, 2));
            if (dist < SOCKET_RADIUS) {
                return { node: this, type: 'input', index: i };
            }
        }
        // Check output sockets
        for (let i = 0; i < this.outputs.length; i++) {
            const sockY = this.y + 40 + (i * SOCKET_SPACING);
            const dist = Math.sqrt(Math.pow(x - (this.x + this.width), 2) + Math.pow(y - sockY, 2));
            if (dist < SOCKET_RADIUS) {
                return { node: this, type: 'output', index: i };
            }
        }
        return null;
    }
}

// --- Drawing Functions ---

/**
 * Draws a smooth, curved connection line between two nodes.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {object} startNode - The starting node.
 * @param {number} startSocketIndex - The index of the starting socket.
 * @param {object} endNode - The ending node.
 * @param {number} endSocketIndex - The index of the ending socket.
 */
function drawConnection(ctx, startNode, startSocketIndex, endNode, endSocketIndex) {
    const startY = startNode.y + 40 + (startSocketIndex * SOCKET_SPACING);
    const endY = endNode.y + 40 + (endSocketIndex * SOCKET_SPACING);
    const startX = startNode.x + startNode.width;
    const endX = endNode.x;

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    const controlPointX1 = startX + (endX - startX) * 0.5;
    const controlPointY1 = startY;
    const controlPointX2 = startX + (endX - startX) * 0.5;
    const controlPointY2 = endY;
    ctx.bezierCurveTo(controlPointX1, controlPointY1, controlPointX2, controlPointY2, endX, endY);
    ctx.stroke();
}

/**
 * The main drawing loop. Clears the canvas and redraws all elements.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 */
function draw(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw connections first
    connections.forEach(conn => {
        drawConnection(ctx, conn.startNode, conn.startSocketIndex, conn.endNode, conn.endSocketIndex);
    });

    // Draw temporary connection line if one is being created
    if (isConnecting && temporaryConnection) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(temporaryConnection.startX, temporaryConnection.startY);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
    }

    // Draw nodes
    nodes.forEach(node => node.draw(ctx));

    requestAnimationFrame(() => draw(ctx));
}

// --- Event Handlers (To be integrated into your main application) ---

/**
 * Handles mouse down events on the canvas.
 * @param {MouseEvent} e - The mouse event object.
 */
function handleMouseDown(e) {
    const rect = e.target.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    // Check for socket click
    for (const node of nodes) {
        const socket = node.getSocketAtPoint(mouse.x, mouse.y);
        if (socket && socket.type === 'output') {
            isConnecting = true;
            startSocket = socket;
            temporaryConnection = {
                startX: socket.node.x + socket.node.width,
                startY: socket.node.y + 40 + (socket.index * SOCKET_SPACING)
            };
            return;
        }
    }

    // Check for node drag
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (node.isPointInNode(mouse.x, mouse.y)) {
            dragNode = node;
            dragOffset.x = mouse.x - node.x;
            dragOffset.y = mouse.y - node.y;

            // Bring the dragged node to the front
            nodes.splice(i, 1);
            nodes.push(dragNode);
            return;
        }
    }
}

/**
 * Handles mouse move events on the canvas.
 * @param {MouseEvent} e - The mouse event object.
 */
function handleMouseMove(e) {
    const rect = e.target.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    if (dragNode) {
        dragNode.x = mouse.x - dragOffset.x;
        dragNode.y = mouse.y - dragOffset.y;
    }

    // Reset hover state for all sockets
    for (const node of nodes) {
        node.inputs.forEach(sock => sock.isHovered = false);
        node.outputs.forEach(sock => sock.isHovered = false);
    }

    if (isConnecting) return;

    // Set hover state for the socket under the cursor
    const foundSocket = findSocketAtPoint(mouse.x, mouse.y);
    if (foundSocket) {
        const node = foundSocket.node;
        if (foundSocket.type === 'input') {
            node.inputs[foundSocket.index].isHovered = true;
        } else {
            node.outputs[foundSocket.index].isHovered = true;
        }
    }
}

/**
 * Handles mouse up events on the canvas.
 * @param {MouseEvent} e - The mouse event object.
 */
function handleMouseUp(e) {
    const rect = e.target.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    if (isConnecting) {
        const endSocket = findSocketAtPoint(mouse.x, mouse.y);
        if (endSocket && endSocket.type === 'input' && startSocket.node.id !== endSocket.node.id) {
            const existingConnection = connections.find(c =>
                c.startNode.id === startSocket.node.id &&
                c.startSocketIndex === startSocket.index &&
                c.endNode.id === endSocket.node.id &&
                c.endSocketIndex === endSocket.index
            );

            if (!existingConnection) {
                connections.push({
                    startNode: startSocket.node,
                    startSocketIndex: startSocket.index,
                    endNode: endSocket.node,
                    endSocketIndex: endSocket.index
                });
            }
        }
        isConnecting = false;
        startSocket = null;
        temporaryConnection = null;
    }

    dragNode = null;
}

// --- Utility Functions ---

/**
 * Finds a socket at a given canvas point.
 * @param {number} x - X coordinate.
 * @param {number} y - Y coordinate.
 * @returns {object|null} - The socket object or null.
 */
function findSocketAtPoint(x, y) {
    for (const node of nodes) {
        const socket = node.getSocketAtPoint(x, y);
        if (socket) {
            return socket;
        }
    }
    return null;
}

// --- Main export for your application to use ---
// You would need to make this file a module and import these functions.
// For example:
// export { Node, draw, handleMouseDown, handleMouseMove, handleMouseUp, nodes, connections };

