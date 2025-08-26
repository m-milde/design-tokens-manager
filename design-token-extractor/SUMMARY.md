# Design Token Extractor - Summary

## What We Built

A complete Figma plugin that extracts design tokens from Figma files and saves them as structured JSON files.

## Files Created

- **`code.ts`** - TypeScript source code for the plugin
- **`code.js`** - Compiled JavaScript (ready to use)
- **`ui.html`** - User interface for the plugin
- **`manifest.json`** - Plugin configuration
- **`package.json`** - Dependencies and build scripts
- **`tsconfig.json`** - TypeScript configuration
- **`README.md`** - Comprehensive documentation
- **`INSTALL.md`** - Quick installation guide
- **`example-output.json`** - Example of extracted tokens

## How to Use

### 1. Install the Plugin
1. Download the `design-token-extractor` folder
2. Open Figma in your browser
3. Go to Menu → Plugins → Development → Import plugin from manifest
4. Select the `manifest.json` file from the folder

### 2. Extract Tokens
1. Open your Figma file with design styles
2. Run the plugin from Plugins → Design Token Extractor
3. Click "Extract Design Tokens"
4. Download the JSON file

## What Gets Extracted

- **Colors**: From paint styles (converted to hex)
- **Typography**: Font families, weights, sizes, line heights
- **Shadows**: Box shadows (CSS-compatible format)

## Example Output

```json
{
  "colors": {
    "primary-blue": {
      "$value": "#18a0fb",
      "$type": "color",
      "$description": "Color style: Primary Blue"
    }
  },
  "typography": {
    "heading-large-size": {
      "$value": "32px",
      "$type": "dimension",
      "$description": "Font size for: Heading Large"
    }
  }
}
```

## Requirements

Your Figma file needs:
- Paint Styles (for colors)
- Text Styles (for typography)
- Effect Styles (for shadows)

## Benefits

- **Extract design tokens** from existing Figma files
- **Standardized format** following design token conventions
- **Easy integration** with design systems and development workflows
- **Clean JSON output** ready for use in CSS, design systems, or other tools

## Next Steps

1. **Install the plugin** using the instructions above
2. **Test with your Figma file** to see what tokens get extracted
3. **Customize the output** if you need different token types
4. **Integrate with your workflow** - use the JSON in CSS, design systems, etc.

## Support

- Check the `README.md` for detailed documentation
- Use `INSTALL.md` for quick setup
- Review `example-output.json` to see expected results
- The plugin is ready to use immediately!
