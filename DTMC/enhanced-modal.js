// Enhanced Modal Functions

// Open enhanced modal
function openModal() {
    const modal = document.getElementById('dtmc-token-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalTokenType = document.getElementById('modal-token-type');
    
    // Update modal title and token type
    modalTitle.textContent = `Create New ${selectedTokenType.charAt(0).toUpperCase() + selectedTokenType.slice(1)} Token`;
    modalTokenType.textContent = selectedTokenType.charAt(0).toUpperCase() + selectedTokenType.slice(1);
    
    // Show appropriate value section based on token type and layer
    showAppropriateValueSection();
    
    // Populate reference dropdown if needed
    if (selectedLayer !== 'primitive') {
        populateReferenceDropdown();
    }
    
    modal.style.display = 'block';
    document.getElementById('token-name').focus();
}

// Show appropriate value section based on token type and layer
function showAppropriateValueSection() {
    const colorSection = document.getElementById('color-token-section');
    const referenceSection = document.getElementById('reference-token-section');
    const simpleSection = document.getElementById('simple-value-section');
    
    // Hide all sections first
    colorSection.style.display = 'none';
    referenceSection.style.display = 'none';
    simpleSection.style.display = 'none';
    
    if (selectedTokenType === 'color' && selectedLayer === 'primitive') {
        // Color token in primitive layer - show color palette
        colorSection.style.display = 'block';
    } else if (selectedLayer !== 'primitive') {
        // Non-primitive layer - show reference dropdown
        referenceSection.style.display = 'block';
    } else {
        // Other token types in primitive layer - show simple input
        simpleSection.style.display = 'block';
    }
}

// Populate reference dropdown with available tokens
function populateReferenceDropdown() {
    const dropdown = document.getElementById('token-reference-dropdown');
    const countSpan = document.getElementById('available-tokens-count');
    
    // Clear existing options
    dropdown.innerHTML = '<option value="">Select from existing tokens...</option>';
    
    let availableTokens = [];
    
    // Collect tokens from all layers except the current one
    Object.keys(tokens).forEach(layer => {
        if (layer !== selectedLayer) {
            tokens[layer].forEach(token => {
                availableTokens.push({
                    layer: layer,
                    name: token.name,
                    value: token.value,
                    displayText: `${layer}.${token.name} (${token.value})`
                });
            });
        }
    });
    
    // Add options to dropdown
    availableTokens.forEach(token => {
        const option = document.createElement('option');
        option.value = JSON.stringify(token);
        option.textContent = token.displayText;
        dropdown.appendChild(option);
    });
    
    // Update count
    countSpan.textContent = `${availableTokens.length} tokens available`;
    
    // Add change event listener
    dropdown.onchange = function() {
        const selectedValue = this.value;
        if (selectedValue) {
            const tokenData = JSON.parse(selectedValue);
            document.getElementById('token-value-custom').value = `{${tokenData.layer}.${tokenData.name}}`;
        }
    };
}

// Setup color swatch click events
function setupColorSwatchEvents() {
    const colorSwatches = document.querySelectorAll('.dtmc-color-swatch');
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', function() {
            // Remove selected class from all swatches
            colorSwatches.forEach(s => s.classList.remove('selected'));
            // Add selected class to clicked swatch
            this.classList.add('selected');
            // Update the token value input
            const colorValue = this.getAttribute('data-color');
            document.getElementById('token-value').value = colorValue;
        });
    });
}

// Close enhanced modal
function closeModal() {
    document.getElementById('dtmc-token-modal').style.display = 'none';
    
    // Clear all input fields
    document.getElementById('token-name').value = '';
    document.getElementById('token-value').value = '';
    document.getElementById('token-value-custom').value = '';
    document.getElementById('token-value-simple').value = '';
    
    // Reset color swatch selection
    document.querySelectorAll('.dtmc-color-swatch').forEach(swatch => {
        swatch.classList.remove('selected');
    });
    
    // Reset dropdown
    const dropdown = document.getElementById('token-reference-dropdown');
    if (dropdown) {
        dropdown.selectedIndex = 0;
    }
}

// Create enhanced token
function createToken() {
    const name = document.getElementById('token-name').value.trim();
    
    if (!name) {
        alert('Please enter a token name');
        return;
    }
    
    let value = '';
    
    // Get value based on the visible section
    if (selectedTokenType === 'color' && selectedLayer === 'primitive') {
        // Color token - get from color input
        value = document.getElementById('token-value').value.trim();
    } else if (selectedLayer !== 'primitive') {
        // Non-primitive layer - get from custom value input
        value = document.getElementById('token-value-custom').value.trim();
    } else {
        // Simple value - get from simple input
        value = document.getElementById('token-value-simple').value.trim();
    }
    
    if (!value) {
        alert('Please enter a token value');
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
