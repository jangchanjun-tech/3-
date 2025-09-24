import { GoogleGenAI, Type } from "@google-genai";

// Self-contained types and constants for the serverless function
enum Subject {
    LEADERSHIP = "지휘감독능력",
    RESPONSIBILITY = "책임감 및 적극성",
    ATTITUDE = "관리자로서의 자세 및 청렴도",
    INNOVATION = "경영의식 및 혁신성",
    SITUATIONAL_RESPONSE = "업무의이해도 및 상황대응력"
}

// Handler function
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        if (!process.env.API_KEY) {
            console.error("CRITICAL: API_KEY environment variable is not set.");
            return res.status(500).json({ error: "Server configuration error: Missing API Key." });
        }
        
        const { subject } = req.body;
        if (!Object.values(Subject).includes(subject)) {
             return res.status(400).json({ error: "A valid subject must be provided." });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const prompt = `Generate a JSON object for a situational judgment question about the subject "${subject}". The JSON must conform to the provided schema. The passage should be 2-3 sentences. Provide 5 options. Assign scores of 1, 2, or 3 to the options. The explanation should be concise.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 },
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        passage: { type: Type.STRING, description: "A 2-3 sentence work-related scenario." },
                        options: {
                            type: Type.ARRAY,
                            description: "An array of exactly 5 possible actions.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING, description: "The action text." },
                                    score: { type: Type.INTEGER, description: "Score: 1 (worst), 2 (suboptimal), or 3 (best)." },
                                },
                                required: ["text", "score"],
                            },
                        },
                        explanation: { type: Type.STRING, description: "A brief explanation of the best course of action." },
                        subject: { type: Type.STRING, enum: [subject] },
                    },
                    required: ["passage", "options", "explanation", "subject"],
                },
            },
        });

        const jsonText = response.text.trim();
        const singleQuestion = JSON.parse(jsonText);
        
        if (!singleQuestion || !singleQuestion.options || singleQuestion.options.length !== 5) {
            throw new Error("AI returned invalid data format (e.g., not 5 options).");
        }
        
        return res.status(200).json(singleQuestion);

    } catch (error) {
        console.error(`[api/generate] Error for subject "${req.body?.subject}":`, error);
        const detailedMessage = error instanceof Error ? error.message : JSON.stringify(error);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ error: `Failed to generate question: ${detailedMessage}` });
    }
}
