import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

export const maxDuration = 60; // Allow up to 60 seconds for AI response (Vercel Pro/Hobby limit depending on plan)

export default async function handler(req: any, res: any) {
  // Add CORS headers just in case
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userMessage, user } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const notifyAdminFunction: FunctionDeclaration = {
      name: 'notifyAdmin',
      description: 'Send a message or notification to the Super Admin on behalf of the user. Use this when the user asks to contact the Super Admin, request account creation, or send a message to the Super Admin.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          message: {
            type: Type.STRING,
            description: 'The message to send to the Super Admin.'
          }
        },
        required: ['message']
      }
    };

    const sendProfilePhotoToAdminFunction: FunctionDeclaration = {
      name: 'sendProfilePhotoToAdmin',
      description: 'Send a profile photo to the Super Admin. Use this when the user uploads a photo and asks to send it to the Super Admin as their profile photo.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          message: {
            type: Type.STRING,
            description: 'An optional message to accompany the photo.'
          }
        }
      }
    };

    const systemInstruction = `You are a helpful assistant for the TrackMyHours application.
Your goal is to assist users with their attendance, profile, and general questions about the app.
If the user wants to send a message to the Super Admin, use the notifyAdmin tool.
If the user uploads a photo and wants to send it to the Super Admin as a profile photo, use the sendProfilePhotoToAdmin tool.
If the user is logged in, their name is ${user?.profile?.name || 'Unknown'} and their role is ${user?.role || 'Guest'}.
CRITICAL RULE: If a user asks for passwords, user credentials, or any other sensitive questions, requests, or assistance, you MUST NOT answer it. Refuse politely.
Keep your answers concise and helpful.`;

    const parts: any[] = [];
    if (userMessage.text) {
      parts.push({ text: userMessage.text });
    } else if (userMessage.attachment) {
      parts.push({ text: `I have attached a file named ${userMessage.attachment.name}. Please analyze it.` });
    }
    
    if (userMessage.attachment) {
      let mimeType = userMessage.attachment.type;
      const ext = userMessage.attachment.name.split('.').pop()?.toLowerCase();
      if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (ext === 'xlsx' || ext === 'xlxs') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (ext === 'pdf') mimeType = 'application/pdf';
      if (ext === 'png') mimeType = 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';

      parts.push({
        inlineData: {
          mimeType: mimeType || 'application/octet-stream',
          data: userMessage.attachment.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { role: 'user', parts },
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [notifyAdminFunction, sendProfilePhotoToAdminFunction] }]
      }
    });

    let botResponseText = response.text || "I'm sorry, I couldn't process that request.";
    let functionCalls = response.functionCalls || [];

    return res.json({ text: botResponseText, functionCalls });
  } catch (error: any) {
    console.error('ChatBot API error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
