import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Add middleware to parse JSON bodies (with increased limit for base64 images/files)
  app.use(express.json({ limit: '50mb' }));

  // API Routes (if any) go here
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/chat', async (req, res) => {
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

      res.json({ text: botResponseText, functionCalls });
    } catch (error: any) {
      console.error('ChatBot API error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Vite Middleware (for serving the frontend)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
