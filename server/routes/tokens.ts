import { Request, Response } from "express";

// This would typically connect to your database or state
// For now, we'll create a mock endpoint that returns the structure
export const handleTokens = async (_req: Request, res: Response) => {
  try {
    // In a real implementation, you would:
    // 1. Connect to your database/storage
    // 2. Fetch the current token state
    // 3. Return the data in the format expected by Figma
    
    const tokenData = {
      tokens: {
        base: [
          {
            id: "token_base_1",
            name: "color-primary",
            value: "#3b82f6",
            type: "color",
            layer: "base"
          },
          {
            id: "token_base_2",
            name: "color-secondary", 
            value: "#6b7280",
            type: "color",
            layer: "base"
          },
          {
            id: "token_base_3",
            name: "spacing-xs",
            value: "4",
            type: "spacing",
            layer: "base"
          },
          {
            id: "token_base_4",
            name: "spacing-sm",
            value: "8",
            type: "spacing",
            layer: "base"
          },
          {
            id: "token_base_5",
            name: "border-radius-sm",
            value: "4",
            type: "borderRadius",
            layer: "base"
          }
        ],
        semantic: [
          {
            id: "token_semantic_1",
            name: "color-primary-default",
            value: "{base.color-primary}",
            type: "color",
            layer: "semantic"
          },
          {
            id: "token_semantic_2",
            name: "color-primary-hover",
            value: "{base.color-primary}",
            type: "color",
            layer: "semantic"
          },
          {
            id: "token_semantic_3",
            name: "spacing-card",
            value: "{base.spacing-sm}",
            type: "spacing",
            layer: "semantic"
          }
        ],
        specific: [
          {
            id: "token_specific_1",
            name: "button-primary-bg",
            value: "{semantic.color-primary-default}",
            type: "color",
            layer: "specific"
          },
          {
            id: "token_specific_2",
            name: "button-primary-padding",
            value: "{semantic.spacing-card}",
            type: "spacing",
            layer: "specific"
          }
        ]
      },
      connections: [
        {
          id: "conn_1",
          from: "token_base_1",
          to: "token_semantic_1",
          fromPort: "output",
          toPort: "input",
          fromSocket: "bottom",
          toSocket: "top"
        },
        {
          id: "conn_2",
          from: "token_base_1",
          to: "token_semantic_2",
          fromPort: "output",
          toPort: "input",
          fromSocket: "bottom",
          toSocket: "top"
        },
        {
          id: "conn_3",
          from: "token_base_4",
          to: "token_semantic_3",
          fromPort: "output",
          toPort: "input",
          fromSocket: "bottom",
          toSocket: "top"
        },
        {
          id: "conn_4",
          from: "token_semantic_1",
          to: "token_specific_1",
          fromPort: "output",
          toPort: "input",
          fromSocket: "bottom",
          toSocket: "top"
        },
        {
          id: "conn_5",
          from: "token_semantic_3",
          to: "token_specific_2",
          fromPort: "output",
          toPort: "input",
          fromSocket: "bottom",
          toSocket: "top"
        }
      ]
    };

    res.json(tokenData);
  } catch (error) {
    console.error("Error fetching tokens:", error);
    res.status(500).json({ 
      error: "Failed to fetch tokens",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

