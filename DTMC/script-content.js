    <script>
        // Canvas setup
        const canvas = document.getElementById('dtmc-canvas');
        const ctx = canvas.getContext('2d');
        
        // Constants
        const SOCKET_RADIUS = 12;
        const NODE_WIDTH = 200;
        const NODE_HEIGHT = 120;
        
        // State
        let nodes = [];
        let connections = [];
        let selectedNode = null;
        let isDragging = false;
        let isPanning = false;
        let panOffset = { x: 0, y: 0 };
        let lastMousePos = { x: 0, y: 0 };
        let isConnecting = false;
        let connectionStart = null;
        let startSocket = null;
        let endSocket = null;
        let selectedTokenType = 'color';
        let selectedLayer = null;
        let tokens = {
            primitive: [],
            base: [],
            semantic: [],
            specific: []
        };
        let undoStack = [];
        let dragPreview = null;
        let draggedToken = null;

        // Initialize
        function init() {
            console.log('🎯 DTMC Interactive Sidebar System Loaded!');
            console.log('Features: Token Types, Layers, Drag & Drop, Modal Creation');
            
            setupEventListeners();
            setupSidebar();
            loadSampleTokens();
            resizeCanvas();
            render();
        }

        // Setup event listeners
        function setupEventListeners() {
            // Canvas events
            canvas.addEventListener('mousedown', handleMouseDown);
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseup', handleMouseUp);
            canvas.addEventListener('wheel', handleWheel);
            
            // Control buttons
            document.getElementById('dtmc-clear-btn').addEventListener('click', clearAll);
            document.getElementById('dtmc-undo-btn').addEventListener('click', undo);
            document.getElementById('dtmc-export-btn').addEventListener('click', exportJSON);
            
            // Modal events
            document.getElementById('dtmc-cancel-btn').addEventListener('click', closeModal);
            document.getElementById('dtmc-create-btn').addEventListener('click', createToken);
            
            // Window events
            window.addEventListener('resize', resizeCanvas);
        }

        // Setup sidebar functionality
        function setupSidebar() {
            // Token type selection
            document.querySelectorAll('.dtmc-type-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.dtmc-type-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedTokenType = btn.dataset.type;
                    console.log('Selected token type:', selectedTokenType);
                });
            });

            // Add token buttons
            document.querySelectorAll('.dtmc-add-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    selectedLayer = btn.dataset.layer;
                    openModal();
                });
            });
        }

        // Load sample tokens
        function loadSampleTokens() {
            tokens.primitive = [
                { name: 'primary-blue', value: '#4a90e2', type: 'color' },
                { name: 'secondary-purple', value: '#805ad5', type: 'color' },
                { name: 'font-size-base', value: '16px', type: 'number' }
            ];
            
            tokens.base = [
                { name: 'color-brand', value: '{primitive.primary-blue}', type: 'color' }
            ];
            
            tokens.semantic = [
                { name: 'button-bg', value: '{base.color-brand}', type: 'color' }
            ];
            
            tokens.specific = [];
            
            renderSidebar();
        }

        // Render sidebar
        function renderSidebar() {
            Object.keys(tokens).forEach(layer => {
                const container = document.getElementById(`${layer}-tokens`);
                container.innerHTML = '';
                
                tokens[layer].forEach(token => {
                    const tokenElement = createTokenElement(token, layer);
                    container.appendChild(tokenElement);
                });
            });
        }

        // Create token element for sidebar
        function createTokenElement(token, layer) {
            const div = document.createElement('div');
            div.className = 'dtmc-token-item';
            div.draggable = true;
            div.dataset.tokenName = token.name;
            div.dataset.tokenValue = token.value;
            div.dataset.tokenType = token.type;
            div.dataset.layer = layer;
            
            div.innerHTML = `
                <div class="dtmc-token-name">${token.name}</div>
                <div class="dtmc-token-value">${token.value}</div>
            `;
            
            // Drag events
            div.addEventListener('dragstart', (e) => handleDragStart(e, token, layer));
            div.addEventListener('dragend', handleDragEnd);
            
            return div;
        }

        // Handle drag start
        function handleDragStart(e, token, layer) {
            draggedToken = { ...token, layer };
            dragPreview = e.target.cloneNode(true);
            dragPreview.style.position = 'absolute';
            dragPreview.style.opacity = '0.8';
            dragPreview.style.pointerEvents = 'none';
            dragPreview.style.zIndex = '1000';
            document.body.appendChild(dragPreview);
            
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', JSON.stringify(draggedToken));
        }

        // Handle drag end
        function handleDragEnd() {
            if (dragPreview) {
                document.body.removeChild(dragPreview);
                dragPreview = null;
            }
            draggedToken = null;
        }

        // Open modal
        function openModal() {
            document.getElementById('dtmc-token-modal').style.display = 'block';
            document.getElementById('token-name').focus();
        }

        // Close modal
        function closeModal() {
            document.getElementById('dtmc-token-modal').style.display = 'none';
            document.getElementById('token-name').value = '';
            document.getElementById('token-value').value = '';
        }

        // Create token
        function createToken() {
            const name = document.getElementById('token-name').value.trim();
            const value = document.getElementById('token-value').value.trim();
            
            if (!name || !value) {
                alert('Please fill in both name and value');
                return;
            }
            
            const newToken = {
                name,
                value,
                type: selectedTokenType
            };
            
            tokens[selectedLayer].push(newToken);
            renderSidebar();
            closeModal();
            
            // Update any existing nodes with this token
            updateNodesWithToken(newToken);
            
            console.log(`Created ${selectedLayer} token:`, newToken);
        }

        // Mouse event handlers
        function handleMouseDown(e) {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - panOffset.x) / 1;
            const y = (e.clientY - rect.top - panOffset.y) / 1;
            
            // Check if clicking on a socket
            const socketInfo = getSocketAtPoint(x, y);
            if (socketInfo) {
                isConnecting = true;
                connectionStart = socketInfo.node;
                startSocket = socketInfo.socket;
                return;
            }
            
            // Check if clicking on a node
            const clickedNode = getNodeAtPoint(x, y);
            if (clickedNode) {
                selectedNode = clickedNode;
                isDragging = true;
                lastMousePos = { x: e.clientX, y: e.clientY };
                return;
            }
            
            // Start panning
            isPanning = true;
            lastMousePos = { x: e.clientX, y: e.clientY };
        }

        function handleMouseMove(e) {
            if (isConnecting) {
                // Handle connection preview
                render();
                drawConnectionPreview(e);
                return;
            }
            
            if (isDragging && selectedNode) {
                const deltaX = e.clientX - lastMousePos.x;
                const deltaY = e.clientY - lastMousePos.y;
                
                selectedNode.x += deltaX;
                selectedNode.y += deltaY;
                
                lastMousePos = { x: e.clientX, y: e.clientY };
                render();
                return;
            }
            
            if (isPanning) {
                const deltaX = e.clientX - lastMousePos.x;
                const deltaY = e.clientY - lastMousePos.y;
                
                panOffset.x += deltaX;
                panOffset.y += deltaY;
                
                lastMousePos = { x: e.clientX, y: e.clientY };
                render();
            }
        }

        function handleMouseUp(e) {
            if (isConnecting) {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left - panOffset.x) / 1;
                const y = (e.clientY - rect.top - panOffset.y) / 1;
                
                const socketInfo = getSocketAtPoint(x, y);
                if (socketInfo && socketInfo.node !== connectionStart) {
                    // Validate connection (output to input only)
                    if (startSocket === 'right' || startSocket === 'bottom') {
                        if (socketInfo.socket === 'top' || socketInfo.socket === 'left') {
                            // Create connection
                            const connection = {
                                startNode: connectionStart,
                                endNode: socketInfo.node,
                                startSocket: startSocket,
                                endSocket: socketInfo.socket
                            };
                            
                            connections.push(connection);
                            saveState();
                            
                            // Update values after connection
                            updateNodeValues(connectionStart);
                            updateNodeValues(socketInfo.node);
                            
                            console.log(`Connected ${connectionStart.name} to ${socketInfo.node.name}`);
                        } else {
                            console.warn('Invalid connection: Can only connect output to input sockets');
                        }
                    } else {
                        console.warn('Invalid connection: Can only start from output sockets');
                    }
                }
                
                isConnecting = false;
                connectionStart = null;
                startSocket = null;
                render();
                return;
            }
            
            isDragging = false;
            isPanning = false;
            selectedNode = null;
        }

        function handleWheel(e) {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            // Implement zoom logic here if needed
        }

        // Helper functions
        function getNodeAtPoint(x, y) {
            for (let i = nodes.length - 1; i >= 0; i--) {
                const node = nodes[i];
                if (x >= node.x && x <= node.x + NODE_WIDTH &&
                    y >= node.y && y <= node.y + NODE_HEIGHT) {
                    return node;
                }
            }
            return null;
        }

        function getSocketAtPoint(x, y) {
            for (const node of nodes) {
                const sockets = [
                    { x: node.x + NODE_WIDTH / 2, y: node.y, type: 'input', socket: 'top' },
                    { x: node.x, y: node.y + NODE_HEIGHT / 2, type: 'input', socket: 'left' },
                    { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2, type: 'output', socket: 'right' },
                    { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT, type: 'output', socket: 'bottom' }
                ];
                
                for (const socket of sockets) {
                    const distance = Math.sqrt((x - socket.x) ** 2 + (y - socket.y) ** 2);
                    if (distance <= SOCKET_RADIUS) {
                        return { node, ...socket };
                    }
                }
            }
            return null;
        }

        function drawConnectionPreview(e) {
            if (!connectionStart) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - panOffset.x) / 1;
            const y = (e.clientY - rect.top - panOffset.y) / 1;
            
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            const startPoint = getSocketPosition(connectionStart, startSocket);
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            
            ctx.setLineDash([]);
        }

        function getSocketPosition(node, socket) {
            switch (socket) {
                case 'top': return { x: node.x + NODE_WIDTH / 2, y: node.y };
                case 'left': return { x: node.x, y: node.y + NODE_HEIGHT / 2 };
                case 'right': return { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 };
                case 'bottom': return { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT };
                default: return { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT / 2 };
            }
        }

        // Canvas drop handling
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (!draggedToken) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - panOffset.x) / 1;
            const y = (e.clientY - rect.top - panOffset.y) / 1;
            
            // Create new node from token
            const newNode = {
                id: Date.now(),
                x: x - NODE_WIDTH / 2,
                y: y - NODE_HEIGHT / 2,
                name: draggedToken.name,
                value: draggedToken.value,
                type: draggedToken.type,
                layer: draggedToken.layer
            };
            
            nodes.push(newNode);
            saveState();
            render();
            
            console.log('Created node from token:', newNode);
        });

        // Rendering
        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Apply pan offset
            ctx.save();
            ctx.translate(panOffset.x, panOffset.y);
            
            // Draw connections
            connections.forEach(connection => {
                drawConnection(connection.startNode, connection.endNode, connection.startSocket, connection.endSocket);
            });
            
            // Draw nodes
            nodes.forEach(node => {
                drawNode(node);
            });
            
            ctx.restore();
        }

        function drawNode(node) {
            // Node background
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.roundRect(node.x, node.y, NODE_WIDTH, NODE_HEIGHT, 12);
            ctx.fill();
            ctx.stroke();
            
            // Node content
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'center';
            
            // Layer label
            ctx.fillStyle = '#64748b';
            ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText(node.layer.toUpperCase(), node.x + NODE_WIDTH / 2, node.y + 20);
            
            // Token name
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText(node.name, node.x + NODE_WIDTH / 2, node.y + 45);
            
            // Token value
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText(node.value, node.x + NODE_WIDTH / 2, node.y + 70);
            
            // Draw sockets
            drawSockets(ctx, node);
        }

        function drawSockets(ctx, node) {
            // Top socket (INPUT - red)
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(node.x + NODE_WIDTH / 2, node.y, SOCKET_RADIUS, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Left socket (INPUT - red)
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(node.x, node.y + NODE_HEIGHT / 2, SOCKET_RADIUS, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Right socket (OUTPUT - green)
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(node.x + NODE_WIDTH, node.y + NODE_HEIGHT / 2, SOCKET_RADIUS, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Bottom socket (OUTPUT - green)
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(node.x + NODE_WIDTH / 2, node.y + NODE_HEIGHT, SOCKET_RADIUS, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }

        function drawConnection(startNode, endNode, startSocket, endSocket) {
            const startPoint = getSocketPosition(startNode, startSocket);
            const endPoint = getSocketPosition(endNode, endSocket);
            
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3;
            
            // Create curved connection
            const controlPoint1 = {
                x: startPoint.x + (endPoint.x - startPoint.x) * 0.5,
                y: startPoint.y
            };
            const controlPoint2 = {
                x: startPoint.x + (endPoint.x - startPoint.x) * 0.5,
                y: endPoint.y
            };
            
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.bezierCurveTo(
                controlPoint1.x, controlPoint1.y,
                controlPoint2.x, controlPoint2.y,
                endPoint.x, endPoint.y
            );
            ctx.stroke();
        }

        // Utility functions
        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            render();
        }

        function saveState() {
            undoStack.push({
                nodes: JSON.parse(JSON.stringify(nodes)),
                connections: JSON.parse(JSON.stringify(connections))
            });
            
            if (undoStack.length > 20) {
                undoStack.shift();
            }
        }

        function undo() {
            if (undoStack.length > 0) {
                const previousState = undoStack.pop();
                nodes = previousState.nodes;
                connections = previousState.connections;
                render();
            }
        }

        function clearAll() {
            if (confirm('Are you sure you want to clear all nodes and connections?')) {
                nodes = [];
                connections = [];
                undoStack = [];
                render();
            }
        }

        function exportJSON() {
            const data = {
                tokens: tokens,
                nodes: nodes,
                connections: connections
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dtmc-tokens.json';
            a.click();
            URL.revokeObjectURL(url);
        }

        // Update nodes when tokens change
        function updateNodesWithToken(token) {
            nodes.forEach(node => {
                if (node.name === token.name && node.layer === selectedLayer) {
                    node.value = token.value;
                    console.log(`Updated existing node: ${node.name} with value: ${node.value}`);
                }
            });
            render();
        }

        // Initialize when page loads
        window.onload = init;
    </script>
</body>
</html>
