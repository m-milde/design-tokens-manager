// Design Token Extractor Plugin
// Extracts design tokens from Figma files and saves them as JSON

figma.showUI(__html__, { width: 400, height: 600 });

interface DesignToken {
  $value: any;
  $type: string;
  $description?: string;
}

interface TokenCollection {
  [key: string]: DesignToken | TokenCollection;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'extract-tokens') {
    try {
      const tokens = await extractAllTokens();
      figma.ui.postMessage({
        type: 'extraction-result',
        success: true,
        tokens: tokens
      });
    } catch (error) {
      console.error('Error extracting tokens:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      figma.ui.postMessage({
        type: 'extraction-result',
        success: false,
        message: `Error extracting tokens: ${errorMessage}`
      });
    }
  }
};

async function extractAllTokens(): Promise<TokenCollection> {
  const tokens: TokenCollection = {};
  
  // Extract color tokens
  const colorTokens = await extractColorTokens();
  if (Object.keys(colorTokens).length > 0) {
    tokens.colors = colorTokens;
  }
  
  // Extract typography tokens
  const typographyTokens = await extractTypographyTokens();
  if (Object.keys(typographyTokens).length > 0) {
    tokens.typography = typographyTokens;
  }
  
  // Extract shadow tokens
  const shadowTokens = await extractShadowTokens();
  if (Object.keys(shadowTokens).length > 0) {
    tokens.shadows = shadowTokens;
  }
  
  return tokens;
}

async function extractColorTokens(): Promise<TokenCollection> {
  const colorTokens: TokenCollection = {};
  
  // Extract from paint styles
  const paintStyles = figma.getLocalPaintStyles();
  for (const style of paintStyles) {
    if (style.paints && style.paints.length > 0) {
      const paint = style.paints[0];
      if (paint.type === 'SOLID') {
        const colorValue = rgbToHex(paint.color.r, paint.color.g, paint.color.b);
        const tokenName = style.name.replace(/\s+/g, '-').toLowerCase();
        colorTokens[tokenName] = {
          $value: colorValue,
          $type: 'color',
          $description: `Color style: ${style.name}`
        };
      }
    }
  }
  
  return colorTokens;
}

async function extractTypographyTokens(): Promise<TokenCollection> {
  const typographyTokens: TokenCollection = {};
  
  // Extract from text styles
  const textStyles = figma.getLocalTextStyles();
  for (const style of textStyles) {
    const tokenName = style.name.replace(/\s+/g, '-').toLowerCase();
    
    // Extract font family
    if (style.fontName && style.fontName.family) {
      typographyTokens[`${tokenName}-family`] = {
        $value: style.fontName.family,
        $type: 'fontFamily',
        $description: `Font family for: ${style.name}`
      };
    }
    
    // Extract font weight
    if (style.fontName && style.fontName.style) {
      typographyTokens[`${tokenName}-weight`] = {
        $value: style.fontName.style,
        $type: 'fontWeight',
        $description: `Font weight for: ${style.name}`
      };
    }
    
    // Extract font size
    if (style.fontSize) {
      typographyTokens[`${tokenName}-size`] = {
        $value: style.fontSize + 'px',
        $type: 'dimension',
        $description: `Font size for: ${style.name}`
      };
    }
    
    // Extract line height
    if (style.lineHeight) {
      if (style.lineHeight.unit === 'PIXELS') {
        const pixelLineHeight = style.lineHeight as { unit: 'PIXELS'; value: number };
        typographyTokens[`${tokenName}-line-height`] = {
          $value: pixelLineHeight.value + 'px',
          $type: 'dimension',
          $description: `Line height for: ${style.name}`
        };
      } else if (style.lineHeight.unit === 'PERCENT') {
        const percentLineHeight = style.lineHeight as { unit: 'PERCENT'; value: number };
        typographyTokens[`${tokenName}-line-height`] = {
          $value: percentLineHeight.value + '%',
          $type: 'dimension',
          $description: `Line height for: ${style.name}`
        };
      }
    }
  }
  
  return typographyTokens;
}

async function extractShadowTokens(): Promise<TokenCollection> {
  const shadowTokens: TokenCollection = {};
  
  // Extract from effects styles
  const effectStyles = figma.getLocalEffectStyles();
  for (const style of effectStyles) {
    if (style.effects && style.effects.length > 0) {
      const shadowEffects = style.effects.filter(effect => 
        effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW'
      );
      
      if (shadowEffects.length > 0) {
        const tokenName = style.name.replace(/\s+/g, '-').toLowerCase();
        const shadowValue = shadowEffects.map(effect => {
          if (effect.type === 'DROP_SHADOW') {
            const shadow = effect as DropShadowEffect;
            return shadow.offset.x + 'px ' + shadow.offset.y + 'px ' + shadow.radius + 'px ' + rgbaToHex(shadow.color.r, shadow.color.g, shadow.color.b, shadow.color.a);
          } else {
            const shadow = effect as InnerShadowEffect;
            return 'inset ' + shadow.offset.x + 'px ' + shadow.offset.y + 'px ' + shadow.radius + 'px ' + rgbaToHex(shadow.color.r, shadow.color.g, shadow.color.b, shadow.color.a);
          }
        }).join(', ');
        
        shadowTokens[tokenName] = {
          $value: shadowValue,
          $type: 'boxShadow',
          $description: `Shadow style: ${style.name}`
        };
      }
    }
  }
  
  return shadowTokens;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function rgbaToHex(r: number, g: number, b: number, a: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  const alpha = Math.round(a * 255).toString(16);
  const alphaHex = alpha.length === 1 ? '0' + alpha : alpha;
  return '#' + toHex(r) + toHex(g) + toHex(b) + alphaHex;
}
