import { GoogleGenAI, Type } from "@google/genai";
import { Book, RecommendationResponse } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getAIRecommendations = async (
  currentBook: Book,
  viewHistory: Book[],
  allBooks: Book[]
): Promise<RecommendationResponse> => {
  if (!apiKey) {
    console.warn("No API Key provided. Returning mock data.");
    return {
      recommendedBookIds: allBooks.filter(b => b.id !== currentBook.id).slice(0, 3).map(b => b.id),
      reasoning: "API Key missing. Showing random suggestions."
    };
  }

  // Filter out the current book from the catalog provided to AI
  const availableCatalog = allBooks.filter(b => b.id !== currentBook.id).map(b => ({
    id: b.id,
    title: b.title,
    author: b.author,
    genre: b.genre,
    description: b.description
  }));

  const historyTitles = viewHistory.map(b => b.title).join(", ");

  const prompt = `
    You are an expert librarian recommendation engine.
    
    Context:
    The user is currently looking at: "${currentBook.title}" by ${currentBook.author} (${currentBook.genre}).
    The user has recently viewed/shown interest in: [${historyTitles}].
    
    Task:
    From the provided "Available Catalog" JSON below, select exactly 3 books that this user would most likely enjoy based on their current interest and history.
    Provide a "reasoning" paragraph explaining the common themes or why these specific books match their taste.
    
    Available Catalog:
    ${JSON.stringify(availableCatalog)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedBookIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of exactly 3 book IDs from the catalog"
            },
            reasoning: {
              type: Type.STRING,
              description: "A friendly, librarian-style explanation of why these books were chosen."
            }
          },
          required: ["recommendedBookIds", "reasoning"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}') as RecommendationResponse;
    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      recommendedBookIds: [],
      reasoning: "We are having trouble connecting to the AI Librarian at the moment."
    };
  }
};
