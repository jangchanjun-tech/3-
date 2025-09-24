import { GoogleGenAI, Type } from "@google/genai";
import { Question, Subject } from '../types';
import { SUBJECTS, QUESTIONS_PER_SUBJECT } from '../constants';


if (!process.env.API_KEY) {
    // This error will be caught by the App component and displayed to the user.
    throw new Error("CRITICAL: API_KEY environment variable is not configured.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


const generateSingleQuestion = async (subject: Subject): Promise<Question> => {
    const prompt = `Generate a JSON object for a situational judgment question about the subject "${subject}". 
The JSON must conform to the provided schema. 
The passage must be a detailed and realistic work-related scenario requiring complex judgment, approximately two-thirds of an A4 page in length, presenting a clear dilemma.
Provide exactly 5 options. Assign scores of 1, 2, or 3 to the options.
The explanation should be concise and justify the best course of action.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 },
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        passage: { type: Type.STRING, description: "A detailed, work-related scenario, about 2/3 of an A4 page." },
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
        
        return { ...singleQuestion, subject };

    } catch (error) {
        console.error(`[GeminiService] Error generating question for subject "${subject}":`, error);
        const detailedMessage = error instanceof Error ? error.message : "An unknown error occurred during AI generation.";
        throw new Error(`AI 문제 생성 실패: ${detailedMessage}`);
    }
};

const saveQuestionToSheet = (question: Question): void => {
    fetch('/api/saveQuestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question),
    })
    .then(response => {
        if (!response.ok) {
            console.warn(`[SheetService] Failed to save question. Status: ${response.status}`);
        }
    })
    .catch(error => {
        console.warn('[SheetService] Error saving question to sheet:', error);
    });
};


export const generateFullExamInClient = async (
    onData: (question: Question) => void,
    onError: (errorMessage: string) => void,
    onComplete: () => void
): Promise<void> => {
    try {
        for (const subject of SUBJECTS) {
            for (let i = 0; i < QUESTIONS_PER_SUBJECT; i++) {
                const question = await generateSingleQuestion(subject);
                onData(question);
                saveQuestionToSheet(question); // Fire-and-forget call
            }
        }
        onComplete();
    } catch (error) {
        console.error("시험 문제 생성에 실패했습니다:", error);
        const message = error instanceof Error ? error.message : "알 수 없는 오류로 시험 문제 생성에 실패했습니다.";
        onError(message);
        onComplete();
    }
};