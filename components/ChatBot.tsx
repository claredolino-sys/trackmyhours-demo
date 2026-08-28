import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import { User, UserRole, AppNotification } from '../types';
import { api } from '../services/api';

interface ChatBotProps {
  user?: User;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  attachment?: {
    name: string;
    type: string;
    data: string;
  };
}

export const ChatBot: React.FC<ChatBotProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Hello! How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validExtensions = ['.jpeg', '.jpg', '.png', '.pdf', '.docx', '.xlsx', '.xlxs'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (validExtensions.includes(fileExtension)) {
        setSelectedFile(file);
      } else {
        alert('Unsupported file type. Please upload .jpeg, .png, .docx, .pdf, or .xlsx files.');
      }
      
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const sendMessage = async (text: string, file: File | null) => {
    if (!text.trim() && !file && !isLoading) return;

    let attachmentData: { name: string; type: string; data: string } | undefined;

    if (file) {
      try {
        const base64 = await readFileAsBase64(file);
        attachmentData = {
          name: file.name,
          type: file.type || 'application/octet-stream',
          data: base64
        };
      } catch (error) {
        console.error("Error reading file:", error);
      }
    }

    const userMessage: Message = { 
      id: Date.now().toString(), 
      sender: 'user', 
      text: text.trim(),
      attachment: attachmentData
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: {
            text: userMessage.text,
            attachment: userMessage.attachment
          },
          user: user
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get chat response');
      }

      const data = await response.json();
      let botResponseText = data.text || "I'm sorry, I couldn't process that request.";

      if (data.functionCalls && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          if (call.name === 'notifyAdmin') {
            const args = call.args;
            
            const notification: AppNotification = {
              id: Date.now().toString(),
              userId: user?.id || 'guest',
              userName: user?.profile?.name || 'Guest User',
              userRole: user?.role || UserRole.STUDENT,
              type: 'MESSAGE',
              message: args.message,
              timestamp: new Date().toISOString(),
              isRead: false
            };
            
            await api.notifications.add(notification);
            botResponseText = "I have sent your message to the Super Admin.";
          } else if (call.name === 'sendProfilePhotoToAdmin') {
            const args = call.args;
            
            // Find the last uploaded photo
            const allMsgs = [...messages, userMessage];
            const lastPhotoMsg = [...allMsgs].reverse().find(m => m.sender === 'user' && m.attachment && m.attachment.type.startsWith('image/'));
            
            if (lastPhotoMsg && lastPhotoMsg.attachment) {
              const notification: AppNotification = {
                id: Date.now().toString(),
                userId: user?.id || 'guest',
                userName: user?.profile?.name || 'Guest User',
                userRole: user?.role || UserRole.STUDENT,
                type: 'PHOTO_UPLOAD',
                message: args.message || 'I would like to update my profile photo.',
                timestamp: new Date().toISOString(),
                isRead: false,
                attachment: lastPhotoMsg.attachment
              };
              
              await api.notifications.add(notification);
              botResponseText = "I have sent your profile photo to the Super Admin for approval.";
            } else {
              botResponseText = "I couldn't find a photo to send. Please upload a photo first.";
            }
          }
        }
      }

      const botMessage: Message = { id: Date.now().toString(), sender: 'bot', text: botResponseText };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('ChatBot error:', error);
      const errorMessage: Message = { id: Date.now().toString(), sender: 'bot', text: 'Sorry, I encountered an error while processing your request. The file type might not be supported by the AI model directly.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input, selectedFile);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion, null);
  };

  const suggestions = [
    "Please send a message to the Super Admin for account creation.",
    "How do I upload a document?",
    "Can you help me upload my profile picture?",
    "How do I log my attendance?",
    "How can I view my total completed hours?",
    "What should I do if I forgot to clock out?",
    "Can you explain how the QR code login works?"
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-700 transition-transform hover:scale-105 z-40 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-fade-in" style={{ height: '500px', maxHeight: '80vh' }}>
          {/* Header */}
          <div className="bg-brand-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Bot size={20} />
              <h3 className="font-bold">TrackMyHours Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-brand-100 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-brand-100 text-brand-600 ml-2' : 'bg-gray-200 text-gray-600 mr-2'}`}>
                    {msg.sender === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.attachment && (
                      <div className={`mb-1 p-2 rounded-lg flex items-center space-x-2 text-xs ${msg.sender === 'user' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {msg.attachment.name.match(/\.(jpeg|jpg|png)$/i) ? <ImageIcon size={14} /> : <FileText size={14} />}
                        <span className="truncate max-w-[150px]">{msg.attachment.name}</span>
                      </div>
                    )}
                    {msg.text && (
                      <div className={`p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 1 && !isLoading && (
              <div className="flex flex-col space-y-2 mt-4 ml-10">
                <p className="text-xs text-gray-500 font-medium px-2">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-left text-xs bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 rounded-xl px-3 py-2 transition-colors shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex flex-row max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 mr-2 flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-gray-200 text-gray-800 rounded-tl-none flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex flex-col">
            {selectedFile && (
              <div className="mb-2 px-3 py-1.5 bg-gray-100 rounded-lg flex items-center justify-between text-xs text-gray-700">
                <div className="flex items-center space-x-2 overflow-hidden">
                  {selectedFile.name.match(/\.(jpeg|jpg|png)$/i) ? <ImageIcon size={14} className="flex-shrink-0" /> : <FileText size={14} className="flex-shrink-0" />}
                  <span className="truncate">{selectedFile.name}</span>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-red-500 ml-2">
                  <X size={14} />
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".jpeg,.jpg,.png,.pdf,.docx,.xlsx,.xlxs"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 text-gray-400 flex items-center justify-center hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors flex-shrink-0"
                title="Attach file (.jpeg, .png, .pdf, .docx, .xlsx)"
              >
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-gray-100 border-transparent rounded-full focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm min-w-0"
              />
              <button
                type="submit"
                disabled={(!input.trim() && !selectedFile) || isLoading}
                className="w-10 h-10 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Send size={16} className="ml-1" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
