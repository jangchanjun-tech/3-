import { GoogleSpreadsheet } from 'https://esm.sh/google-spreadsheet@4.1.1';
import { JWT } from 'https://esm.sh/google-auth-library@10.3.0';

// Types are duplicated here to make the serverless function self-contained,
// as it cannot reliably import from other project files like '../types'.
enum Subject {
    LEADERSHIP = "지휘감독능력",
    RESPONSIBILITY = "책임감 및 적극성",
    ATTITUDE = "관리자로서의 자세 및 청렴도",
    INNOVATION = "경영의식 및 혁신성",
    SITUATIONAL_RESPONSE = "업무의이해도 및 상황대응력"
}

interface Option {
    text: string;
    score: number;
}

interface Question {
    passage: string;
    options: Option[];
    explanation: string;
    subject: Subject;
}


const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

const HEADERS = [
    'Year', 'Date', 'Subject', 'Passage', 
    'Option 1 Text', 'Option 1 Score', 
    'Option 2 Text', 'Option 2 Score',
    'Option 3 Text', 'Option 3 Score',
    'Option 4 Text', 'Option 4 Score',
    'Option 5 Text', 'Option 5 Score',
    'Explanation'
];

const serviceAccountAuth = new JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end('Method Not Allowed');
    }

    if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
        console.error("Google Sheets environment variables are not configured.");
        return res.status(500).json({ error: "Server configuration error for Google Sheets." });
    }

    try {
        const question: Question = req.body;

        if (!question || !question.passage || !question.options || question.options.length !== 5) {
            return res.status(400).json({ error: 'Invalid question data provided.' });
        }
        
        await doc.loadInfo();
        const year = new Date().getFullYear().toString();
        let sheet = doc.sheetsByTitle[year];

        if (!sheet) {
            sheet = await doc.addSheet({ title: year, headerValues: HEADERS });
        }
        
        const now = new Date();
        const rowData = {
            'Year': year,
            'Date': now.toLocaleDateString('ko-KR'),
            'Subject': question.subject,
            'Passage': question.passage,
            'Option 1 Text': question.options[0].text,
            'Option 1 Score': question.options[0].score,
            'Option 2 Text': question.options[1].text,
            'Option 2 Score': question.options[1].score,
            'Option 3 Text': question.options[2].text,
            'Option 3 Score': question.options[2].score,
            'Option 4 Text': question.options[3].text,
            'Option 4 Score': question.options[3].score,
            'Option 5 Text': question.options[4].text,
            'Option 5 Score': question.options[4].score,
            'Explanation': question.explanation,
        };

        await sheet.addRow(rowData);

        return res.status(200).json({ success: true, message: `Question saved to sheet '${year}'.` });

    } catch (error) {
        console.error('[api/saveQuestion] Error:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return res.status(500).json({ error: 'Failed to save data to Google Sheet.', details: message });
    }
}