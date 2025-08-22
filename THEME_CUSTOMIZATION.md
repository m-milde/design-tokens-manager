# Design Token Manager - Theme Customization Guide

## Overview

The Design Token Manager now uses a comprehensive CSS variable system that allows you to easily customize the entire color theme of the application. All hardcoded "slate" colors have been replaced with custom CSS variables that you can modify to create your own theme.

## How to Customize Colors

### 1. Primary Colors
These are the main brand colors used throughout the application:

```css
--dtm-primary: 217 91% 60%;        /* Main brand color (blue) */
--dtm-primary-hover: 217 91% 50%;  /* Hover state for primary */
--dtm-secondary: 220 13% 91%;      /* Secondary color (light gray) */
--dtm-secondary-hover: 220 13% 81%; /* Hover state for secondary */
--dtm-accent: 217 91% 95%;         /* Accent color (very light blue) */
--dtm-accent-hover: 217 91% 85%;   /* Hover state for accent */
```

### 2. Semantic Colors
These colors have specific meanings and are used for different actions:

```css
--dtm-success: 142 76% 36%;        /* Green - for success actions */
--dtm-success-hover: 142 76% 26%;  /* Hover state for success */
--dtm-warning: 38 92% 50%;         /* Orange - for warnings */
--dtm-warning-hover: 38 92% 40%;   /* Hover state for warning */
--dtm-destructive: 0 84% 60%;      /* Red - for destructive actions */
--dtm-destructive-hover: 0 84% 50%; /* Hover state for destructive */
--dtm-info: 199 89% 48%;           /* Cyan - for informational elements */
--dtm-info-hover: 199 89% 38%;     /* Hover state for info */
```

### 3. Background Colors
These control the background colors throughout the application:

```css
--dtm-bg-primary: 220 14% 96%;     /* Main background */
--dtm-bg-secondary: 220 13% 91%;   /* Secondary background */
--dtm-bg-tertiary: 220 13% 88%;    /* Tertiary background */
--dtm-bg-overlay: 220 14% 96% / 0.95; /* Overlay background */
```

### 4. Text Colors
These control the text colors throughout the application:

```css
--dtm-text-primary: 220 9% 9%;     /* Primary text color */
--dtm-text-secondary: 220 9% 26%;  /* Secondary text color */
--dtm-text-muted: 220 9% 46%;      /* Muted text color */
--dtm-text-inverse: 0 0% 100%;     /* Inverse text color (white) */
```

### 5. Border Colors
These control the border colors throughout the application:

```css
--dtm-border-primary: 220 13% 88%; /* Primary border color */
--dtm-border-secondary: 220 13% 81%; /* Secondary border color */
--dtm-border-accent: 217 91% 60%;  /* Accent border color */
```

### 6. Token Type Colors
These are the colors used for the different token types:

```css
--dtm-token-base: 217 91% 60%;     /* Blue - for base tokens */
--dtm-token-semantic: 142 76% 36%; /* Green - for semantic tokens */
--dtm-token-specific: 0 84% 60%;   /* Red - for specific tokens */
```

## How to Apply Custom Themes

### Method 1: Modify the CSS Variables Directly

1. Open `client/global.css`
2. Find the `:root` section (around line 60)
3. Modify the HSL values for the variables you want to change
4. Save the file and refresh your browser

### Method 2: Create a Custom Theme Class

1. Add a new CSS class in `client/global.css`:

```css
.custom-theme {
  --dtm-primary: 280 90% 60%;        /* Purple theme */
  --dtm-primary-hover: 280 90% 50%;
  --dtm-success: 160 84% 39%;
  --dtm-success-hover: 160 84% 29%;
  --dtm-destructive: 0 72% 51%;
  --dtm-destructive-hover: 0 72% 41%;
  /* ... add more custom colors */
}
```

2. Apply the class to the body element in your HTML or add it programmatically.

### Method 3: Dynamic Theme Switching

The application already includes a theme toggle button that switches between light and dark themes. You can extend this functionality to support multiple custom themes.

## Color Format

All colors use the HSL (Hue, Saturation, Lightness) format:
- **Hue**: 0-360 degrees (color wheel position)
- **Saturation**: 0-100% (color intensity)
- **Lightness**: 0-100% (brightness)

## Example Theme Customizations

### Purple Theme
```css
--dtm-primary: 280 90% 60%;
--dtm-primary-hover: 280 90% 50%;
--dtm-token-base: 280 90% 60%;
--dtm-token-semantic: 160 84% 39%;
--dtm-token-specific: 0 72% 51%;
```

### Orange Theme
```css
--dtm-primary: 25 95% 53%;
--dtm-primary-hover: 25 95% 43%;
--dtm-token-base: 25 95% 53%;
--dtm-token-semantic: 142 76% 36%;
--dtm-token-specific: 0 84% 60%;
```

### Minimalist Gray Theme
```css
--dtm-primary: 220 13% 18%;
--dtm-primary-hover: 220 13% 28%;
--dtm-secondary: 220 14% 96%;
--dtm-secondary-hover: 220 14% 86%;
--dtm-token-base: 220 13% 18%;
--dtm-token-semantic: 220 13% 45%;
--dtm-token-specific: 220 13% 65%;
```

## Available Utility Classes

The application includes utility classes that automatically use the CSS variables:

- `.dtm-bg-primary`, `.dtm-bg-secondary`, `.dtm-bg-tertiary`
- `.dtm-text-primary`, `.dtm-text-secondary`, `.dtm-text-muted`
- `.dtm-border-primary`, `.dtm-border-secondary`, `.dtm-border-accent`
- `.dtm-btn-primary`, `.dtm-btn-secondary`, `.dtm-btn-success`, `.dtm-btn-destructive`, `.dtm-btn-info`
- `.dtm-token-base`, `.dtm-token-semantic`, `.dtm-token-specific`

## Tips for Theme Design

1. **Contrast**: Ensure sufficient contrast between text and background colors for accessibility
2. **Consistency**: Use consistent color relationships across your theme
3. **Semantic Meaning**: Keep the semantic meaning of colors (red for destructive, green for success, etc.)
4. **Testing**: Test your theme in both light and dark modes
5. **Accessibility**: Use tools like WebAIM's contrast checker to ensure your colors meet accessibility standards

## Dark Mode Support

The application automatically supports dark mode through the `.dark` class. When you modify the light theme variables, also update the corresponding dark theme variables in the `.dark` section of the CSS file.

## Browser Support

The CSS custom properties (variables) are supported in all modern browsers:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

For older browsers, you may need to provide fallback colors.
