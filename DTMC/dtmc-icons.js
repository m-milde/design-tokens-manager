// ===== DTMC ICON SYSTEM - MATERIAL ICONS VERSION =====

// Material Icons are loaded via CSS, so we just need to add the right classes
function createMaterialIcon(iconName, size = 16) {
    const iconElement = document.createElement('span');
    iconElement.className = 'material-icons';
    iconElement.textContent = iconName;
    iconElement.style.fontSize = `${size}px`;
    iconElement.style.display = 'inline-block';
    iconElement.style.verticalAlign = 'middle';
    return iconElement;
}

// Replace button content with Material Icons
function replaceButtonIcons() {
    console.log('🔄 Starting Material Icons replacement...');
    
    // Control buttons
    const controlButtons = {
        'dtmc-undo-btn': 'undo',
        'dtmc-clear-btn': 'delete',
        'dtmc-export-btn': 'download',
        'dtmc-save-btn': 'save',
        'dtmc-load-btn': 'folder_open'
    };
    
    Object.entries(controlButtons).forEach(([id, iconName]) => {
        const button = document.getElementById(id);
        if (button) {
            const icon = createMaterialIcon(iconName, 18);
            button.innerHTML = '';
            button.appendChild(icon);
            console.log(`✅ Replaced ${id} with ${iconName}`);
        }
    });
    
    // Zoom buttons
    const zoomButtons = {
        'dtmc-zoom-in-btn': 'add',
        'dtmc-zoom-out-btn': 'remove',
        'dtmc-reset-zoom-btn': 'open_in_full',
        'dtmc-minimap-toggle': 'visibility'
    };
    
    Object.entries(zoomButtons).forEach(([id, iconName]) => {
        const button = document.getElementById(id);
        if (button) {
            const icon = createMaterialIcon(iconName, 16);
            button.innerHTML = '';
            button.appendChild(icon);
            console.log(`✅ Replaced ${id} with ${iconName}`);
        }
    });
    
    // Add buttons in sidebar
    document.querySelectorAll('.dtmc-add-btn').forEach(button => {
        const icon = createMaterialIcon('add', 16);
        button.innerHTML = '';
        button.appendChild(icon);
        console.log('✅ Replaced add button with add icon');
    });
    
    // Token type buttons
    const typeIcons = {
        'color': 'palette',
        'spacing': 'space_bar',
        'typography': 'text_fields',
        'number': 'tag',
        'string': 'text_format',
        'boolean': 'check_box'
    };
    
    document.querySelectorAll('.dtmc-type-btn').forEach(button => {
        const type = button.dataset.type;
        if (typeIcons[type]) {
            const icon = createMaterialIcon(typeIcons[type], 16);
            button.innerHTML = '';
            button.appendChild(icon);
            button.appendChild(document.createTextNode(' ' + type.charAt(0).toUpperCase() + type.slice(1)));
            console.log(`✅ Replaced ${type} button with ${typeIcons[type]} icon`);
        }
    });
    
    // Update floating menu icons
    updateFloatingMenuIcons();
    
    console.log('🎉 Material Icons replacement completed!');
}

// Update floating menu icons
function updateFloatingMenuIcons() {
    // Update delete node button
    const deleteNodeBtn = document.getElementById('dtmc-delete-node-btn');
    if (deleteNodeBtn) {
        deleteNodeBtn.innerHTML = '';
        deleteNodeBtn.appendChild(createMaterialIcon('delete', 16));
        deleteNodeBtn.title = 'Delete from canvas';
        console.log('✅ Updated delete node button icon');
    }
    
    // Update delete token button
    const deleteTokenBtn = document.getElementById('dtmc-delete-token-btn');
    if (deleteTokenBtn) {
        deleteTokenBtn.innerHTML = '';
        deleteTokenBtn.appendChild(createMaterialIcon('delete_forever', 16));
        deleteTokenBtn.title = 'Delete token entirely';
        console.log('✅ Updated delete token button icon');
    }
}

// Initialize icon system
function initIconSystem() {
    console.log('🎨 Initializing Material Icons system...');
    
    // Check if Material Icons CSS is loaded
    const materialIconsLoaded = document.querySelector('link[href*="material-icons"]') || 
                               document.querySelector('link[href*="fonts.googleapis.com"]');
    
    if (materialIconsLoaded) {
        console.log('✅ Material Icons CSS loaded, replacing icons...');
        replaceButtonIcons();
        console.log('🎉 Material Icons system ready!');
    } else {
        console.error('❌ Material Icons CSS not loaded!');
        console.log('🔍 Please ensure the Material Icons CSS is included in the HTML head');
    }
}

// Make functions globally available
window.initIconSystem = initIconSystem;
window.replaceButtonIcons = replaceButtonIcons;
window.updateFloatingMenuIcons = updateFloatingMenuIcons;
window.createMaterialIcon = createMaterialIcon;
