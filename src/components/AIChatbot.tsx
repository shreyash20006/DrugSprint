import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2, Bot } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi there! I am the TGPCOP Council AI Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqKey) {
        throw new Error("AI is not configured. Missing GROQ API Key.");
      }

      // Convert history for Groq (OpenAI format)
      const apiMessages = [
        { role: "system", content: "You are a friendly and helpful AI assistant for the TGPCOP (Tatyasaheb Kore College of Pharmacy) Student Council. You help students with their queries regarding campus life, events, and council activities. Keep answers concise, helpful, and polite. Do not use markdown." },
        ...messages.filter(m => m.content !== 'Hi there! I am the TGPCOP Council AI Assistant. How can I help you today?').map(m => ({ 
          role: m.role, 
          content: m.content 
        })),
        { role: "user", content: userMessage }
      ];

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: apiMessages,
          temperature: 0.5,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Groq API Error:", errText);
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      const generatedText = result.choices?.[0]?.message?.content?.trim();

      if (generatedText) {
        setMessages(prev => [...prev, { role: 'assistant', content: generatedText }]);
      } else {
        throw new Error("No response generated.");
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Oops! I couldn't process that: ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-[#E06D2B] rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform z-50 border-2 border-white/20 shadow-purple-500/30"
          >
            <Bot className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-[350px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-navy-dark/10 shadow-navy-dark/20"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-navy-dark to-[#152852] p-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm leading-tight">Council AI Assistant</h3>
                  <span className="text-[10px] text-white/60 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Online</span>
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-3 rounded-2xl text-sm font-sans leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-orange-burnt text-white rounded-tr-sm shadow-md shadow-orange-burnt/10' 
                        : 'bg-white text-navy-dark border border-navy-dark/10 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-4 bg-white border border-navy-dark/10 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-xs text-navy-dark/50 font-medium">AI is typing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-navy-dark/10 flex items-center space-x-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-navy-dark/10 rounded-xl outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm font-sans transition-all text-navy-dark placeholder:text-navy-dark/30"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 flex items-center justify-center bg-navy-dark text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
