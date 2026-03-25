
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { DataEntry } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async queryKnowledgeBase(query: string, contextData: DataEntry[]): Promise<{ text: string; relevantIds: string[] }> {
    const dataContextStr = contextData.map(d => 
      `[Topic: ${d.topic}, Value: ${d.value} ${d.unit}, Country: ${d.country}, Year: ${d.year}, Source: ${d.source}, ReportID: ${d.reportId || 'N/A'}, ID: ${d.id}]`
    ).join('\n');

    const systemInstruction = `
      You are a specialized Data Privacy Scientist Assistant. Your goal is to help users retrieve and interpret historical risk assessment data.
      
      Historical Context Data provided:
      ${dataContextStr}

      Instructions:
      1. Always prioritize answering using the historical data provided above if it is relevant.
      2. If you use a piece of data, mention the source, year, and its Report ID if available.
      3. If the data isn't in the provided context, state that clearly but try to provide general scientific knowledge as a backup.
      4. Format your response in clean Markdown.
      5. At the end of your response, strictly output a JSON array of the "ID"s of the data points you referenced in your answer, like this: DATA_REFS: ["id1", "id2"].
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: MODEL_NAME,
        contents: query,
        config: {
          systemInstruction,
          temperature: 0.2,
        }
      });

      const text = response.text || "I'm sorry, I couldn't process that request.";
      const refMatch = text.match(/DATA_REFS: \[(.*?)\]/);
      const relevantIds = refMatch 
        ? refMatch[1].split(',').map(s => s.trim().replace(/"/g, '')) 
        : [];
      const cleanedText = text.replace(/DATA_REFS: \[.*?\]/, '').trim();

      return { text: cleanedText, relevantIds };
    } catch (error) {
      console.error("Gemini Query Error:", error);
      return { text: "Error connecting to AI.", relevantIds: [] };
    }
  }

  async extractDataEntries(text: string): Promise<Partial<DataEntry>[]> {
    const systemInstruction = `
      Extract specific data points (statistics, prevalence rates, etc.) from the provided text or links.
      For each data point found, create a structured object with:
      - topic: What the data is about
      - value: The numerical value
      - unit: The unit
      - country: The specific country or region
      - year: The year the data refers to
      - source: The source or link
      - category: One of ['Epidemiology', 'Privacy Metrics', 'Demographics', 'Other']
      - reportId: If a report ID like "DXX-XXX" (e.g., D25-348) is mentioned in context, extract it. Otherwise leave empty string.
      
      Return a JSON array of these objects.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: MODEL_NAME,
        contents: text,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                value: { type: Type.STRING },
                unit: { type: Type.STRING },
                country: { type: Type.STRING },
                year: { type: Type.STRING },
                source: { type: Type.STRING },
                category: { type: Type.STRING },
                reportId: { type: Type.STRING, description: "Extract report ID like D25-348 if present" },
              },
              required: ["topic", "value", "unit", "country", "year", "source", "category", "reportId"]
            }
          }
        }
      });

      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Extraction Error:", error);
      return [];
    }
  }
}

export const gemini = new GeminiService();
