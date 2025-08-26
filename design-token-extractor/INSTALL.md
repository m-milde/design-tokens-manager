# Quick Installation Guide

## Install as Development Plugin in Figma

1. **Download the plugin files** from this folder
2. **Open Figma** in your browser
3. **Go to Menu** → **Plugins** → **Development** → **Import plugin from manifest**
4. **Select the `manifest.json` file** from this folder
5. **The plugin is now installed!**

## How to Use

1. **Open your Figma file** that contains design tokens
2. **Go to Plugins** → **Design Token Extractor**
3. **Click "Extract Design Tokens"**
4. **Review the extracted tokens** in the preview
5. **Download the JSON file** with your preferred filename

## What Gets Extracted

- **Colors**: From paint styles
- **Typography**: Font families, weights, sizes, and line heights from text styles  
- **Shadows**: Box shadows from effect styles

## Troubleshooting

- Make sure your Figma file has styles defined (colors, text styles, effects)
- Ensure you have edit permissions for the file
- Try refreshing Figma if the plugin doesn't work

## File Structure

```
design-token-extractor/
├── code.js           # Compiled plugin code (ready to use)
├── ui.html           # Plugin interface
├── manifest.json     # Plugin configuration
└── INSTALL.md        # This file
```

The `code.js` file is already compiled and ready to use!
