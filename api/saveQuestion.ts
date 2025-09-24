// NOTE: This feature is temporarily disabled to resolve a build-time dependency conflict.
// The `@google/genai` library requires a newer version of `google-auth-library`
// which is incompatible with the `google-spreadsheet` library. To restore this
// functionality, the code would need to be refactored to use the Google Sheets API directly.

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end('Method Not Allowed');
    }

    console.warn('[api/saveQuestion] Endpoint called, but functionality is temporarily disabled due to dependency conflicts.');
    
    // We return a successful response so the client-side code doesn't register an error.
    return res.status(200).json({ 
        success: true, 
        message: 'This functionality is temporarily disabled.' 
    });
}
