
import { GoogleGenAI, Type } from "@google/genai";
import { Scenario, OptimizationResult, BusStop } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this mock, we'll proceed, but API calls will fail without a key.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateScenarios(stops: BusStop[]): Promise<Scenario[]> {
  const stopNames = stops.map(s => s.name).join(', ');
  const prompt = `あなたは交通コンサルタントです。福岡県福津市の以下のバス停を含むエリアの改善シナリオを10個生成してください: ${stopNames}。各シナリオは、バス停の統廃合やデマンド交通の導入を組み合わせた具体的な提案にしてください。`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["id", "title", "description"],
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const scenarios = JSON.parse(jsonString);
    // Gemini sometimes doesn't start IDs at 1, so let's re-index them.
    return scenarios.map((s: Omit<Scenario, 'id'>, index: number) => ({ ...s, id: index + 1 }));
  } catch (error) {
    console.error("Error generating scenarios:", error);
    throw new Error("シナリオの生成中にエラーが発生しました。");
  }
}

export async function findOptimalScenario(scenarios: Scenario[]): Promise<OptimizationResult> {
  const scenariosText = scenarios.map(s => `ID ${s.id}: ${s.title} - ${s.description}`).join('\n');
  const prompt = `あなたは交通システム最適化の専門家です。以下の10個のバスルート改善シナリオを評価し、コスト、利便性、カバー範囲の観点から最も優れたシナリオを1つ選んでください。その選択の理由も詳しく説明してください。\n\n対象シナリオ:\n${scenariosText}`;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    optimalScenarioId: { type: Type.INTEGER },
                    justification: { type: Type.STRING },
                },
                required: ["optimalScenarioId", "justification"],
            },
        },
    });
    
    const jsonString = response.text.trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error finding optimal scenario:", error);
    throw new Error("最適シナリオの分析中にエラーが発生しました。");
  }
}