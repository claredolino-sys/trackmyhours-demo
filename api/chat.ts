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
    
    // DEMO FALLBACK MODE: If no API key is provided, use a simulated rule-based chatbot
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      const text = (userMessage?.text || '').toLowerCase();
      let botResponseText = "Thank you for reviewing my portfolio! 🚀 To ensure a seamless experience, I am currently running in a simulated **Demo Mode**.\n\nWhile I can't process open-ended questions without a live API connection, I can demonstrate my core features! Try asking me how to **log attendance**, check **completed hours**, use **QR code login**, or ask me to **contact the admin**.";
      let functionCalls: any[] = [];

      // Handle specific UI suggestions
      if (text.includes('account creation') || text.includes('message to the super admin')) {
        botResponseText = "I have simulated sending a notification to the Super Admin regarding your account creation request.";
        functionCalls.push({
          name: 'notifyAdmin',
          args: { message: userMessage.text || "Request for account creation" }
        });
      } else if (text.includes('upload a document') || text.includes('profile picture') || text.includes('upload my profile')) {
        botResponseText = "To upload a document or profile picture, you can click the paperclip icon next to the chat input field. If you upload a photo, I can simulate sending it to the admin!";
      } else if (text.includes('log my attendance')) {
        botResponseText = "You can log your attendance directly on your Dashboard! Click 'Clock In' or 'Clock Out'. Make sure your camera is allowed so the biometric liveness detection can verify your presence.";
      } else if (text.includes('completed hours')) {
        botResponseText = "You can view your total completed hours right on your main Dashboard. You'll also see an option there to generate and download your Daily Time Record (DTR) as a PDF.";
      } else if (text.includes('forgot to clock out')) {
        botResponseText = "If you forgot to clock out, I can notify the Super Admin to manually adjust your time record. I have gone ahead and simulated sending them a message for you!";
        functionCalls.push({
          name: 'notifyAdmin',
          args: { message: "User forgot to clock out and needs a time adjustment." }
        });
      } else if (text.includes('qr code login')) {
        botResponseText = "The QR code login allows you to sign in instantly! Just click the 'Scan QR' button on the login screen and show your personalized QR code to your device's camera.";
      } 
      // General fallbacks
      else if (text.includes('admin') || text.includes('contact') || text.includes('help')) {
        botResponseText = "Since we are in Demo Mode, I'll go ahead and simulate sending a message to the Super Admin for you.";
        functionCalls.push({
          name: 'notifyAdmin',
          args: { message: userMessage.text || "Demo admin request" }
        });
      } else if (text.includes('hour') || text.includes('attendance') || text.includes('dtr')) {
        botResponseText = "You can view your total hours and generate your DTR PDF directly from your Dashboard! (This is a Demo Mode automated response).";
      } else if (/\bhello\b/.test(text) || /\bhi\b/.test(text) || /\bhey\b/.test(text)) {
        botResponseText = `Hello ${user?.profile?.name || 'there'}! I am the TrackMyHours Assistant running in offline Demo Mode. How can I help you today?`;
      } else if (userMessage.attachment) {
        botResponseText = "I see you attached a file! In full production mode with an API key, I would analyze this image/document for you. In Demo Mode, I'll just acknowledge it looks great!";
        if (text.includes('admin') || text.includes('profile')) {
           functionCalls.push({
             name: 'sendProfilePhotoToAdmin',
             args: { message: "Uploaded a photo in demo mode." }
           });
           botResponseText += " I have also simulated sending this to the admin.";
        }
      }

      // Add a slight delay to make it feel like an AI is "thinking"
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.json({ text: botResponseText, functionCalls });
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
