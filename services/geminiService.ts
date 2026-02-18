import { GoogleGenAI } from "@google/genai";

// Use process.env.API_KEY directly as required by guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMarketInsight = async (assetSymbol: string, currentPrice: number, history: any[]) => {
  try {
    // Fixed: Property 'json' does not exist on type 'JSON'. Changed to JSON.stringify.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following market data for ${assetSymbol}: Current Price: $${currentPrice}. Recent price points: ${JSON.stringify(history.slice(-5))}. 
      Provide a very brief (max 30 words) trading recommendation and logic. Keep it professional but aggressive like a forex trader.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Market volatility is high. Use caution when entering new positions.";
  }
};