# DTM Token Sync - Figma Plugin

This Figma plugin allows you to sync your Design Token Manager (DTM) tokens directly to Figma Variables, preserving all connections and relationships between tokens.

## 🚀 Features

- **Direct Token Sync**: Import tokens directly from your DTM app to Figma
- **Preserved Connections**: All token relationships and aliases are maintained
- **Variable Collections**: Automatically creates organized variable collections by layer
- **Light/Dark Modes**: Supports multiple design modes
- **Real-time Sync**: Connect and sync whenever you need to update tokens

## 📋 Prerequisites

1. **DTM App Running**: Your Design Token Manager must be running locally
2. **Figma Desktop App**: This plugin works with Figma Desktop (not web)
3. **Local Development**: Plugin connects to `localhost:8080` by default

## 🛠️ Installation

### Option 1: Development Installation (Recommended for testing)

1. **Clone or download** this plugin folder
2. **Open Figma Desktop**
3. **Go to Plugins** → **Development** → **New Plugin**
4. **Click "Import plugin from manifest"**
5. **Select the `manifest.json` file** from this folder
6. **Click "Import"**

### Option 2: Production Installation

1. **Package the plugin** (see Development section below)
2. **Install from Figma Community** (when published)
3. **Or distribute the packaged plugin file**

## 🔌 Usage

### Step 1: Start Your DTM App

Make sure your Design Token Manager is running on `localhost:8080`:

```bash
npm run dev
# or
npm start
```

### Step 2: Open the Plugin in Figma

1. **Right-click** in Figma
2. **Select "Plugins"** → **"DTM Token Sync"**
3. **Plugin window opens**

### Step 3: Connect to DTM

1. **Click "Connect to DTM App"**
2. **Plugin connects** to your local DTM server
3. **Token count displays** showing available tokens

### Step 4: Sync Tokens

1. **Click "Sync Tokens to Figma"**
2. **Plugin creates** Figma Variables for all tokens
3. **Variable collections** are organized by layer (Base, Semantic, Specific)
4. **Aliases are created** for connected tokens
5. **Success notification** appears when complete

## 🏗️ How It Works

### Token Structure

The plugin expects tokens in this format:

```json
{
  "tokens": {
    "base": [
      {
        "id": "token_1",
        "name": "color-primary",
        "value": "#3b82f6",
        "type": "color",
        "layer": "base"
      }
    ],
    "semantic": [
      {
        "id": "token_2",
        "name": "color-primary-default",
        "value": "{base.color-primary}",
        "type": "color",
        "layer": "semantic"
      }
    ]
  },
  "connections": [
    {
      "id": "conn_1",
      "from": "token_1",
      "to": "token_2",
      "fromPort": "output",
      "toPort": "input"
    }
  ]
}
```

### Variable Creation

- **Base Layer**: Creates foundation variables (colors, spacing, etc.)
- **Semantic Layer**: Creates semantic variables that reference base tokens
- **Specific Layer**: Creates component-specific variables that reference semantic tokens
- **Connections**: Automatically creates aliases between connected tokens

### Supported Token Types

- **Color**: Hex, RGB, HSL values
- **Spacing**: Numeric values (pixels, rems, etc.)
- **Typography**: Text values
- **Border Radius**: Numeric values
- **Shadow**: Numeric values
- **Custom**: Any other type becomes a text variable

## 🔧 Development

### Project Structure

```
figma-plugin/
├── manifest.json      # Plugin configuration
├── code.js           # Main plugin logic
├── ui.html           # Plugin UI
└── README.md         # This file
```

### Building for Production

1. **Install dependencies** (if any)
2. **Test thoroughly** in development mode
3. **Package the plugin**:
   - Zip the plugin folder
   - Or use Figma's plugin packaging tools

### Customization

- **API Endpoint**: Change `localhost:8080` in `ui.html` to your server
- **Token Types**: Add new token types in `code.js`
- **UI Styling**: Modify `ui.html` CSS
- **Variable Modes**: Add more modes beyond Light/Dark

## 🌐 API Integration

### DTM App Requirements

Your DTM app must expose an API endpoint at `/api/tokens` that returns:

```typescript
interface TokenData {
  tokens: {
    [layer: string]: Token[];
  };
  connections: Connection[];
}

interface Token {
  id: string;
  name: string;
  value: string;
  type: string;
  layer: string;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  fromPort: string;
  toPort: string;
  fromSocket?: string;
  toSocket?: string;
}
```

### Example API Response

```json
{
  "tokens": {
    "base": [
      {
        "id": "color-primary",
        "name": "color-primary",
        "value": "#3b82f6",
        "type": "color",
        "layer": "base"
      }
    ]
  },
  "connections": []
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to connect to DTM App"**
   - Ensure DTM app is running on `localhost:8080`
   - Check that `/api/tokens` endpoint exists
   - Verify CORS settings allow Figma plugin

2. **"Error syncing tokens"**
   - Check browser console for detailed errors
   - Verify token data format matches expected schema
   - Ensure all required fields are present

3. **Variables not appearing in Figma**
   - Check Figma Variables panel
   - Verify variable collections were created
   - Look for error notifications

### Debug Mode

Enable debug logging in the plugin:

1. **Open browser console** (F12)
2. **Look for plugin messages**
3. **Check network requests** to your API

## 📚 Resources

- [Figma Plugin API Documentation](https://www.figma.com/plugin-docs/)
- [Figma Variables API](https://www.figma.com/plugin-docs/api/properties/figma-variables/)
- [Design Tokens Specification](https://design-tokens.github.io/community-group/format/)

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter issues:

1. **Check this README** for troubleshooting steps
2. **Review the code** for potential issues
3. **Open an issue** with detailed error information
4. **Include your token data structure** (sanitized)

---

**Happy token syncing! 🎨✨**

