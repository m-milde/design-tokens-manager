# Design Token Extractor - Figma Plugin

A Figma plugin that extracts design tokens from your Figma file and saves them as a structured JSON file **optimized for Design Token Manager (DTM) tools**.

## 🎯 **DTM Compatibility**

This plugin exports tokens in a format specifically designed for Design Token Manager tools, allowing you to:

- **Visualize all tokens** on a canvas with proper relationships
- **See connections** between different token types
- **Import directly** into DTM tools without conversion
- **Maintain metadata** for better token management

## ✨ **Enhanced Features**

The plugin now extracts:

- **Colors**: From paint styles (converted to hex)
- **Typography**: Composite tokens with font family, weight, size, and line height
- **Shadows**: Box shadows in CSS-compatible format
- **Spacing**: Auto-detected spacing values from components and frames
- **Border Radius**: Auto-detected corner radius values
- **Metadata**: Figma style IDs and names for traceability

## 🚀 **Quick Installation**

### Install as Development Plugin
1. **Download the plugin files** from this folder
2. **Open Figma** in your browser
3. **Go to Menu** → **Plugins** → **Development** → **Import plugin from manifest**
4. **Select the `manifest.json` file** from this folder
5. **The plugin is now installed!**

## 📖 **Usage**

1. **Open your Figma file** that contains the design tokens you want to extract
2. **Run the plugin** from Plugins → Design Token Extractor
3. **Click "Extract Design Tokens"** to scan your file
4. **Review the extracted tokens** in the preview
5. **Download the JSON file** with your preferred filename
6. **Import into your DTM tool** to visualize tokens and connections

## 🔗 **DTM Output Format**

The plugin generates a JSON file with the following DTM-compatible structure:

```json
{
  "$schema": "https://specs.figma.com/design-tokens",
  "$metadata": {
    "tokenSetOrder": ["colors", "typography", "shadows", "spacing", "radius"]
  },
  "colors": {
    "primary-blue": {
      "$value": "#18a0fb",
      "$type": "color",
      "$description": "Color style: Primary Blue",
      "$extensions": {
        "figma.styleId": "1:2",
        "figma.styleName": "Primary Blue"
      }
    }
  },
  "typography": {
    "heading-large": {
      "$value": {
        "fontFamily": "Inter",
        "fontWeight": "Bold",
        "fontSize": "32px",
        "lineHeight": "40px"
      },
      "$type": "typography",
      "$description": "Typography style: Heading Large"
    }
  }
}
```

## 🎨 **What Gets Extracted**

### Colors
- Extracts from **Paint Styles** in your Figma file
- Converts RGB values to hex format
- Includes style IDs and names for traceability

### Typography
- **Composite tokens** combining all typography properties
- **Font Family**: From text styles
- **Font Weight**: From text styles  
- **Font Size**: From text styles (in pixels)
- **Line Height**: From text styles (in pixels or percentage)

### Shadows
- **Box Shadows**: From effect styles
- Supports both drop shadows and inner shadows
- Converts to CSS-compatible format

### Spacing
- **Auto-detected** from components and frames
- **Padding values**: Left, right, top, bottom
- **Item spacing**: Between layout elements
- **Smart naming**: xs, sm, md, lg, xl, 2xl, 3xl

### Border Radius
- **Auto-detected** from components and frames
- **Corner radius values** from all elements
- **Smart naming**: none, sm, md, lg, xl, 2xl

## 🔧 **Requirements**

Your Figma file should have:
- **Paint Styles** for colors
- **Text Styles** for typography
- **Effect Styles** for shadows
- **Components/Frames** with layout properties for spacing and radius

## 💡 **DTM Integration Benefits**

- **Immediate visualization** of all tokens on canvas
- **Relationship mapping** between token types
- **Hierarchical organization** with proper metadata
- **Traceability** back to Figma styles
- **Standard compliance** with design token specifications

## 📁 **File Structure**
```
design-token-extractor/
├── code.ts                  # Main plugin logic (TypeScript)
├── code.js                  # Compiled plugin code (JavaScript)
├── ui.html                  # Plugin UI interface
├── manifest.json            # Plugin manifest
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── example-dtm-output.json  # DTM-compatible example
├── example-output.json      # Basic example
├── INSTALL.md               # Quick installation guide
└── README.md                # This file
```

## 🚀 **Next Steps for DTM**

1. **Install the plugin** using the instructions above
2. **Extract tokens** from your Figma file
3. **Import the JSON** into your DTM tool
4. **Visualize tokens** on the canvas
5. **Explore relationships** between different token types
6. **Use the metadata** for better token management

## 🔍 **Example Output**

See `example-dtm-output.json` for a complete example of the DTM-compatible format with all token types and metadata.

## 📚 **Development**

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile TypeScript:
   ```bash
   npm run build
   ```

3. For development with auto-compilation:
   ```bash
   npm run watch
   ```

## 🆘 **Troubleshooting**

### No tokens extracted?
- Make sure your Figma file has styles defined (colors, text styles, effects)
- Check that you're running the plugin on the correct file
- Ensure you have edit permissions for the file

### Plugin not working?
- Try refreshing Figma
- Check the browser console for error messages
- Ensure the plugin is properly installed

### DTM import issues?
- Verify the JSON format matches the example
- Check that all required properties are present
- Ensure the schema URL is accessible

## 🤝 **Contributing**

Feel free to submit issues and enhancement requests!

## 📄 **License**

MIT License - feel free to use this plugin in your projects.
