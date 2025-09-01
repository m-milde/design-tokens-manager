// ===== FIXED FLOATING MENU FUNCTIONS =====

// Show floating menu at specified position
function showFloatingMenu(x, y, node) {
    const menu = document.getElementById('dtmc-floating-menu');
    if (!menu) return;
    
    // Get canvas position and calculate menu position
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the center of the node in screen coordinates
    const nodeCenterX = rect.left + (node.x + NODE_WIDTH / 2) * zoomLevel + panOffset.x;
    const nodeTopY = rect.top + node.y * zoomLevel + panOffset.y;
    
    // Position menu 10px above the node and centered horizontally
    const menuWidth = 180; // Match CSS min-width
    const menuX = nodeCenterX - menuWidth / 2;
    const menuY = nodeTopY - 10; // 10px above the node
    
    menu.style.left = menuX + 'px';
    menu.style.top = menuY + 'px';
    
    // Reset transform and opacity for animation
    menu.style.transform = 'translateY(20px)';
    menu.style.opacity = '0';
    menu.style.display = 'block';
    
    // Trigger animation
    requestAnimationFrame(() => {
        menu.style.transform = 'translateY(0)';
        menu.style.opacity = '1';
    });
    
    // Store reference to the node for delete operations
    menu.dataset.nodeId = nodes.indexOf(node);
    
    console.log(`🎯 Floating menu shown for node: ${node.name}`);
    console.log(`📍 Node center: (${nodeCenterX}, ${nodeTopY}), Menu position: (${menuX}, ${menuY})`);
}

// Hide floating menu
function hideFloatingMenu() {
    const menu = document.getElementById('dtmc-floating-menu');
    if (menu) {
        // Animate out
        menu.style.transform = 'translateY(20px)';
        menu.style.opacity = '0';
        
        // Hide after animation
        setTimeout(() => {
            menu.style.display = 'none';
            menu.dataset.nodeId = '';
        }, 300);
    }
}

// Delete node from canvas
function deleteNodeFromCanvas() {
    const menu = document.getElementById('dtmc-floating-menu');
    const nodeIndex = parseInt(menu.dataset.nodeId);
    
    if (nodeIndex >= 0 && nodeIndex < nodes.length) {
        const node = nodes[nodeIndex];
        console.log(`🗑️ Deleting node from canvas: ${node.name}`);
        
        // Remove all connections involving this node
        connections = connections.filter(conn => 
            conn.startNode !== node && conn.endNode !== node
        );
        
        // Remove the node
        nodes.splice(nodeIndex, 1);
        
        // Save state and re-render
        saveState();
        render();
        hideFloatingMenu();
        
        console.log(`✅ Node ${node.name} deleted from canvas`);
    }
}

// Delete token entirely (from both canvas and sidebar)
function deleteTokenEntirely() {
    const menu = document.getElementById('dtmc-floating-menu');
    const nodeIndex = parseInt(menu.dataset.nodeId);
    
    if (nodeIndex >= 0 && nodeIndex < nodes.length) {
        const node = nodes[nodeIndex];
        console.log(`🗑️ Deleting token entirely: ${node.name}`);
        
        // Remove all connections involving this node
        connections = connections.filter(conn => 
            conn.startNode !== node && conn.endNode !== node
        );
        
        // Remove the node from canvas
        nodes.splice(nodeIndex, 1);
        
        // Remove the token from the sidebar
        const layer = node.layer;
        if (tokens[layer]) {
            tokens[layer] = tokens[layer].filter(t => t.name !== node.name);
            console.log(`🗑️ Removed token ${node.name} from ${layer} layer`);
        }
        
        // Save state and re-render
        saveState();
        render();
        renderSidebar();
        hideFloatingMenu();
        
        console.log(`✅ Token ${node.name} deleted entirely`);
    }
}

// Fixed drawSocket function with proper hover detection
function drawSocket(x, y, type, isConnected, node) {
    // Get CSS variables for socket styling
    const socketRadius = parseCSSValue(getCSSVariable('--dtmc-socket-radius'));
    const socketConnectedColor = getCSSVariable('--dtmc-socket-connected-color');
    const socketDisconnectedColor = getCSSVariable('--dtmc-socket-disconnected-color');
    const socketStrokeColor = getCSSVariable('--dtmc-socket-stroke-color');
    const socketStrokeWidth = parseCSSValue(getCSSVariable('--dtmc-socket-stroke-width'));
    const socketInnerCircleRadius = parseCSSValue(getCSSVariable('--dtmc-socket-inner-circle-radius'));
    const socketPlusSize = parseCSSValue(getCSSVariable('--dtmc-socket-plus-size'));
    
    // Check if mouse is hovering over the entire node (bubble)
    const rect = canvas.getBoundingClientRect();
    const mouseX = (lastMousePos.x - rect.left - panOffset.x) / zoomLevel;
    const mouseY = (lastMousePos.y - rect.top - panOffset.y) / zoomLevel;
    
    const isHoveringOverNode = mouseX >= node.x && mouseX <= node.x + NODE_WIDTH &&
                               mouseY >= node.y && mouseY <= node.y + NODE_HEIGHT;
    
    // Draw socket background
    if (isConnected) {
        ctx.fillStyle = socketConnectedColor;
    } else {
        ctx.fillStyle = socketDisconnectedColor;
    }
    
    ctx.beginPath();
    ctx.arc(x, y, socketRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw socket border with hover effect
    if (isHoveringOverNode) {
        // White border when hovering over the bubble
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = socketStrokeWidth * 1.5;
        ctx.stroke();
    } else {
        // No border when not hovering (transparent)
        // Don't draw border
    }
    
    // Draw socket content
    if (isConnected) {
        // When connected, just fill with connected color
        // (border already drawn above if hovering)
    } else {
        // When not connected, draw appropriate symbol
        if (type === 'input') {
            // Draw small circle inside for input sockets
            ctx.fillStyle = socketStrokeColor;
            ctx.beginPath();
            ctx.arc(x, y, socketInnerCircleRadius, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            // Draw plus sign for output sockets
            ctx.strokeStyle = socketStrokeColor;
            ctx.lineWidth = socketStrokeWidth;
            ctx.beginPath();
            ctx.moveTo(x - socketPlusSize, y);
            ctx.lineTo(x + socketPlusSize, y);
            ctx.moveTo(x, y - socketPlusSize);
            ctx.lineTo(x, y + socketPlusSize);
            ctx.stroke();
        }
    }
}
