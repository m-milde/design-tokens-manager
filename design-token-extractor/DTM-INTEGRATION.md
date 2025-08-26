# DTM Integration Guide

## What is DTM?

Design Token Manager (DTM) tools help you visualize, organize, and manage design tokens in a visual canvas format. They allow you to see the relationships between different token types and maintain a comprehensive design system.

## Why This Plugin is DTM-Optimized

The Design Token Extractor plugin has been specifically enhanced to export tokens in a format that DTM tools can immediately understand and visualize:

### 🔗 **Proper Schema & Metadata**
```json
{
  "$schema": "https://specs.figma.com/design-tokens",
  "$metadata": {
    "tokenSetOrder": ["colors", "typography", "shadows", "spacing", "radius"]
  }
}
```

### 📊 **Structured Token Organization**
- **Colors**: Individual color tokens with hex values
- **Typography**: Composite tokens combining all font properties
- **Shadows**: Box shadow definitions
- **Spacing**: Systematic spacing scale (xs, sm, md, lg, xl, 2xl, 3xl)
- **Radius**: Border radius scale (none, sm, md, lg, xl, 2xl)

### 🏷️ **Rich Metadata**
Each token includes:
- `$value`: The actual token value
- `$type`: Token type for proper categorization
- `$description`: Human-readable description
- `$extensions`: Figma-specific metadata for traceability

## DTM Tools You Can Use

### 1. **Figma Tokens** (Plugin)
- Import the JSON directly
- Visualize tokens in Figma
- Generate CSS/SCSS variables

### 2. **Design Tokens Studio**
- Web-based DTM tool
- Import JSON files
- Visual canvas with relationships

### 3. **Style Dictionary**
- Command-line tool
- Transform tokens to multiple platforms
- Generate code for various frameworks

### 4. **Custom DTM Tools**
- Any tool that follows the design token specification
- Compatible with the exported JSON structure

## Import Process

### Step 1: Extract Tokens
1. Run the Design Token Extractor plugin in Figma
2. Click "Extract Design Tokens"
3. Download the JSON file

### Step 2: Import to DTM Tool
1. Open your DTM tool
2. Look for "Import" or "Load" functionality
3. Select the downloaded JSON file
4. The tool should automatically recognize the structure

### Step 3: Visualize & Organize
1. **Colors**: See your color palette with hex values
2. **Typography**: View font combinations and scales
3. **Spacing**: Understand your spacing system
4. **Shadows**: Review elevation and depth
5. **Radius**: See border radius consistency

## Expected DTM Visualization

### Canvas Layout
```
┌─────────────────────────────────────────────────────────┐
│                     Design Tokens                       │
├─────────────────┬─────────────────┬─────────────────────┤
│     Colors      │   Typography    │      Shadows        │
│                 │                 │                     │
│  Primary Blue   │  Heading Large  │   Card Shadow       │
│  Secondary Gray │   Body Text     │   Button Shadow     │
│   Accent Green  │    Caption      │  Elevated Shadow    │
├─────────────────┼─────────────────┼─────────────────────┤
│     Spacing     │      Radius     │                     │
│                 │                 │                     │
│      xs (4px)   │     none (0px)  │                     │
│      sm (8px)   │      sm (4px)   │                     │
│      md (16px)  │      md (8px)   │                     │
│      lg (24px)  │      lg (16px)  │                     │
│      xl (32px)  │      xl (24px)  │                     │
│     2xl (48px)  │                 │                     │
└─────────────────┴─────────────────┴─────────────────────┘
```

### Token Relationships
- **Color tokens** → Used in typography, shadows, and components
- **Typography tokens** → Applied to text elements
- **Spacing tokens** → Used for padding, margins, and layout
- **Radius tokens** → Applied to borders and corners
- **Shadow tokens** → Used for elevation and depth

## Benefits of DTM Integration

### 🎯 **Visual Organization**
- See all tokens at a glance
- Understand relationships between token types
- Identify gaps in your design system

### 🔄 **Consistency Management**
- Ensure spacing values are systematic
- Maintain color palette consistency
- Standardize typography scales

### 📱 **Multi-Platform Output**
- Generate CSS variables
- Create SCSS maps
- Export for React, Vue, or other frameworks
- Generate design system documentation

### 🚀 **Workflow Efficiency**
- Single source of truth for design tokens
- Easy updates and modifications
- Version control for design decisions

## Troubleshooting DTM Import

### Common Issues

**"Invalid JSON format"**
- Ensure the file was downloaded completely
- Check that the file extension is `.json`
- Verify the file opens in a text editor

**"Missing required properties"**
- The plugin should generate all required properties
- Check that the extraction completed successfully
- Ensure your Figma file has styles defined

**"Schema validation failed"**
- The plugin uses the official Figma design token schema
- Most DTM tools should accept this format
- Check if your DTM tool supports the schema version

### Getting Help

1. **Check the example files** in this folder
2. **Compare your output** with `example-dtm-output.json`
3. **Verify the structure** matches the expected format
4. **Check DTM tool documentation** for import requirements

## Next Steps

1. **Test the plugin** with your Figma file
2. **Import the JSON** into your preferred DTM tool
3. **Explore the visual representation** of your tokens
4. **Identify opportunities** to improve your design system
5. **Generate code** for your development workflow

The Design Token Extractor plugin is designed to bridge the gap between Figma design work and DTM tool visualization, giving you a complete view of your design system tokens and their relationships.
