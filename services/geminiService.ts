import { GoogleGenAI } from "@google/genai";

// Ensure API key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

/**
 * Generates/Edits an image based on an input image and a text prompt.
 * Uses gemini-2.5-flash-image for image-to-image capabilities.
 */
export const generateImageTransformation = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    // Clean base64 string if it contains the data URL prefix
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // Iterate through parts to find the image part
    const parts = response.candidates?.[0]?.content?.parts;
    
    if (!parts) {
      throw new Error("No content generated from the model.");
    }

    let generatedImageUrl = '';

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const base64EncodeString = part.inlineData.data;
        // The model usually returns PNG for generated images
        generatedImageUrl = `data:image/png;base64,${base64EncodeString}`;
        break; // Found the image
      }
    }

    if (!generatedImageUrl) {
      // Fallback check if it returned text explaining why it couldn't generate
      const textPart = parts.find(p => p.text);
      if (textPart && textPart.text) {
        throw new Error(`Model returned text instead of image: ${textPart.text}`);
      }
      throw new Error("No image data found in response.");
    }

    return generatedImageUrl;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};