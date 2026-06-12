import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2, Bot, FileUp, FileText, Globe, Maximize2, Minimize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';
import { bPharmSyllabus } from '../data/syllabus';
import { examsData } from '../data/exams';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const compressImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Keep aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressedDataUrl);
    };
    img.onerror = (err) => {
      reject(err);
    };
  });
};

interface AttachedFile {
  type: 'image' | 'pdf';
  name: string;
  url?: string; // base64 preview URL for images
  text?: string; // extracted text for PDFs
  images?: string[]; // rendered PDF pages as base64 images
}

const performWebSearch = async (query: string): Promise<string> => {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error("Search proxy failed");
    
    const data = await res.json();
    const htmlContent = data.contents;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const results: string[] = [];
    
    const resultDivs = doc.querySelectorAll('.result');
    const limit = Math.min(resultDivs.length, 5); // get top 5 results
    
    for (let i = 0; i < limit; i++) {
      const div = resultDivs[i];
      const titleEl = div.querySelector('.result__title a');
      const snippetEl = div.querySelector('.result__snippet');
      if (titleEl && snippetEl) {
        const title = titleEl.textContent?.trim() || '';
        let link = titleEl.getAttribute('href') || '';
        
        // Decode DDG redirect URL if needed (e.g. //duckduckgo.com/l/?uddg=URL)
        if (link.includes('uddg=')) {
          const parts = link.split('uddg=');
          if (parts[1]) {
            link = decodeURIComponent(parts[1].split('&')[0]);
          }
        }
        if (link.startsWith('//')) link = 'https:' + link;
        const snippet = snippetEl.textContent?.trim() || '';
        results.push(`- **[${title}](${link})**: ${snippet}`);
      }
    }
    
    if (results.length === 0) return "No results found.";
    return results.join('\n\n');
  } catch (err) {
    console.error("Search error:", err);
    return "Search failed.";
  }
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachment?: {
    type: 'image' | 'pdf';
    name: string;
    url?: string;
  };
}

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi there! I am the TGPCOP Council AI Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping || isSearching) return;

    const userMessage = input.trim();
    setInput('');

    // Capture current attachment to include in the message history and to construct the prompt
    const currentAttachment = attachedFile ? {
      type: attachedFile.type,
      name: attachedFile.name,
      url: attachedFile.type === 'image' ? attachedFile.url : (attachedFile.images?.[0] || undefined)
    } : undefined;

    const savedAttachedFile = attachedFile;
    const shouldSearch = webSearchEnabled;

    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage, 
      attachment: currentAttachment 
    }]);
    
    // Clear the attachment from input area
    setAttachedFile(null);
    
    let searchResults = "";
    if (shouldSearch) {
      setIsSearching(true);
      try {
        searchResults = await performWebSearch(userMessage);
      } catch (err) {
        console.error("Web search failed:", err);
        searchResults = "Search query failed.";
      }
      setIsSearching(false);
    }

    setIsTyping(true);

    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      const mistralKey = import.meta.env.VITE_MISTRAL_API_KEY;
      
      if (!groqKey && !mistralKey) {
        throw new Error("AI is not configured. Missing API Key (Groq or Mistral).");
      }

      const isMistral = !!mistralKey;
      const apiKey = isMistral ? mistralKey : groqKey;
      const apiEndpoint = isMistral 
        ? "https://api.mistral.ai/v1/chat/completions" 
        : "https://api.groq.com/openai/v1/chat/completions";

      let systemInstruction = `You are a friendly and helpful AI assistant for the Tulsiramji Gaikwad Patil College of Pharmacy (TGPCOP), Nagpur Student Council. You help students with their queries regarding campus life, events, and council activities. 
      
Additionally, you are a highly knowledgeable academic tutor. If a student asks you an educational or syllabus-related question (for example, "what is a bone", "explain pharmacology", etc.), you must provide a clear, accurate, and helpful academic explanation.

DEVELOPER/CREATOR INFORMATION:
If a student or anyone asks you who developed, built, created, or maintains this website, you MUST clearly state that it was developed by Shreyash Borkar (Developer & Technical Head) and you can contact him at developer@tgpcopcouncil.online.

STUDENT COUNCIL EXECUTIVE & REPRESENTATIVE MEMBERS (2026):
If someone asks who holds a role, or who the members/representatives are, use this official list to answer:
- President: Tushar Kalbhut (B.Pharm III Year)
- Vice President: Harshal Hatwar (B.Pharm II Year)
- General Secretary: Vinay Deogade (B.Pharm II Year)
- Secretary: Varsha Damahe (B.Pharm III Year)
- Treasurers: Laksh Jaiswal (B.Pharm II Year) and Rohan Bhil (B.Pharm III Year)
- NSS Incharge: Shivam Waghmare (B.Pharm III Year)
- Cultural Secretary: Shruti Kamble (B.Pharm II Year)
- Overall Secretary: Mr. Akash Gaiwad (B.Pharm III Year)
- Events & Workshop Coordinator: Nayan Thote (B.Pharm I Year)
- Anti-Ragging Incharge: Anjali Hardas (B.Pharm I Year)
- College Issues Representative: Nandini Rajurkar (B.Pharm III Year)
- Social Media Incharge: Himani Kambale (B.Pharm I Year)

IMPORTANT DIAGRAM INSTRUCTION:
If a student asks you to draw, show, create, or explain a diagram/image of a biological organ or process (e.g. kidney, heart, neuron, cell membrane, synapse, etc.), you must construct a clean, highly readable text-based ASCII diagram or flow block diagram inside a markdown code block. Do NOT say you cannot draw or show images; always provide a readable ASCII diagram structure (similar to a block diagram or labeled ASCII organ drawing) so they can study the parts and connections easily.

Keep answers concise, helpful, and polite.`;

      systemInstruction += `\n\nYou have access to the following website pages. If a student asks for information related to these, provide them with the direct link:
- Home: /
- Council Members: /council
- Ask a Question / FAQ: /ask
- Notices & Circulars: /notices
- Events & Activities: /events
- Gallery & Media: /gallery
- Achievements: /achievements
- Newsletter: /newsletter
- Complaints & Grievances: /complaint
- Mentorship Program: /mentors
- Student Profile & Dashboard: /profile
- Academic Calendar: /calendar
- Leaderboard: /leaderboard
- Message Board: /board
- Store & Merchandise: /store
- Contact Us: /contact
- Report a Bug: /report
- Voting & Elections: /vote
- Pay Fees / Payments: /pay

If a student asks about university exams, results, ERP, or the DBATU portal, provide this direct link: [DBATU ERP Portal](https://mis.dbatu.ac.in/erp/).

Here is the official B.Pharm Syllabus. If a student asks about the syllabus or subjects for a specific semester, use this to answer their query:
${bPharmSyllabus}

Here is the upcoming University Examination Schedule for Summer 2026. If a student asks about their exam dates, subjects, or timings, use this exact schedule:
${JSON.stringify(examsData, null, 2)}

When providing links, use markdown format like this: [Click here for Notices](/notices).`;

      if (shouldSearch && searchResults) {
        systemInstruction += `\n\nWEB SEARCH RESULTS:\nHere are the top results from a live web search for the query "${userMessage}". Use this context to answer the student's question accurately with up-to-date information:\n---\n${searchResults}\n---\nInclude relevant search citation links in your answer if helpful.`;
      }

      let modelToUse = "";
      if (isMistral) {
        modelToUse = savedAttachedFile ? "pixtral-12b-2409" : "mistral-small-latest";
      } else {
        modelToUse = savedAttachedFile ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile";
      }
      
      let userContent: any = userMessage;

      if (savedAttachedFile) {
        if (savedAttachedFile.type === 'image' && savedAttachedFile.url) {
          userContent = [
            { type: "text", text: userMessage },
            { type: "image_url", image_url: { url: savedAttachedFile.url } }
          ];
        } else if (savedAttachedFile.type === 'pdf') {
          // If we have rendered images for the PDF, send them to the vision model
          if (savedAttachedFile.images && savedAttachedFile.images.length > 0) {
            userContent = [
              { 
                type: "text", 
                text: `${userMessage}\n\n[PDF Text Context:\n${savedAttachedFile.text?.substring(0, 15000)}]` 
              },
              ...savedAttachedFile.images.map(imgUrl => ({
                type: "image_url",
                image_url: { url: imgUrl }
              }))
            ];
          } else {
            // Text-only PDF fallback
            systemInstruction += `\n\nThe student has uploaded a PDF document named "${savedAttachedFile.name}". Here is the extracted text from the PDF:\n\n---\n${savedAttachedFile.text?.substring(0, 30000)}\n---\n\nUse this text to answer their query.`;
          }
        }
      }

      // Map conversation history
      const apiMessages: any[] = [
        { role: "system", content: systemInstruction }
      ];

      // Add previous messages (with attachment text hints, but no base64 images to save tokens/bandwidth)
      messages.forEach(m => {
        if (m.content === 'Hi there! I am the TGPCOP Council AI Assistant. How can I help you today?') return;
        
        let contentText = m.content;
        if (m.attachment) {
          contentText = `[Attached ${m.attachment.type}: ${m.attachment.name}] ${contentText}`;
        }
        
        apiMessages.push({
          role: m.role,
          content: contentText
        });
      });

      // Add the current user message (with userContent structure)
      apiMessages.push({
        role: "user",
        content: userContent
      });

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: apiMessages,
          temperature: 0.5,
          max_tokens: 250
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI API Error:", errText);
        let detailedError = response.statusText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) {
            detailedError = parsed.error.message;
          } else if (parsed?.message) {
            detailedError = parsed.message;
          }
        } catch (_) {}
        throw new Error(`API request failed with status ${response.status}: ${detailedError}`);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 50MB
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size exceeds 50MB limit. Please upload a smaller file.");
      return;
    }

    setIsUploading(true);

    try {
      if (file.type.startsWith('image/')) {
        // Handle Image
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const rawBase64 = reader.result as string;
            const compressedBase64 = await compressImage(rawBase64);
            setAttachedFile({
              type: 'image',
              name: file.name,
              url: compressedBase64
            });
            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: `I have received your image: **${file.name}**. I can analyze its content. What would you like to ask about it?` }
            ]);
          } catch (compressErr) {
            console.error("Compression error:", compressErr);
            alert("Failed to process the image.");
          } finally {
            setIsUploading(false);
          }
        };
        reader.onerror = () => {
          alert("Failed to read the image file.");
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        // Handle PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        const maxPages = Math.min(pdf.numPages, 30); // Limit to 30 pages
        
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }

        // Render first 3 pages as base64 images (for visual inspection/scanned PDFs)
        const pdfImages: string[] = [];
        const numPagesToRender = Math.min(pdf.numPages, 3);
        for (let i = 1; i <= numPagesToRender; i++) {
          try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.0 }); // lowered scale to 1.0 to reduce payload size
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              await page.render({ canvasContext: context, viewport, canvas }).promise;
              const base64Image = canvas.toDataURL('image/jpeg', 0.6); // lowered quality to 0.6 to reduce payload size
              pdfImages.push(base64Image);
            }
          } catch (err) {
            console.warn(`Failed to render PDF page ${i} to image:`, err);
          }
        }

        setAttachedFile({
          type: 'pdf',
          name: file.name,
          text: fullText,
          images: pdfImages
        });
        
        const assistantMsg = pdfImages.length > 0
          ? `I have successfully read your PDF: **${file.name}** (extracted text and rendered the first ${pdfImages.length} page(s) for visual search). What would you like to know about it?`
          : `I have successfully read your PDF: **${file.name}**. What would you like to know about it?`;

        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: assistantMsg }
        ]);
        setIsUploading(false);
      } else {
        alert("Please upload a valid image or PDF file.");
        setIsUploading(false);
      }
    } catch (error) {
      console.error("File upload/processing error:", error);
      alert("Failed to process the uploaded file. Please make sure it is not corrupted.");
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
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
            className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-navy-dark/10 shadow-navy-dark/20 transition-all duration-300 ${
              isFullScreen
                ? 'w-[calc(100vw-2rem)] md:w-[800px] h-[calc(100vh-4rem)]'
                : 'w-[350px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-6rem)]'
            }`}
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
              <div className="flex items-center space-x-1">
                <button 
                  type="button"
                  onClick={() => setIsFullScreen(prev => !prev)}
                  title={isFullScreen ? "Minimize Chat" : "Maximize Chat"}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4 text-white/80" /> : <Maximize2 className="w-4 h-4 text-white/80" />}
                </button>
                <button 
                  type="button"
                  onClick={() => { setIsOpen(false); setIsFullScreen(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>
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
                        : 'bg-white text-navy-dark border border-navy-dark/10 rounded-tl-sm shadow-sm prose prose-sm prose-orange max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0'
                    }`}
                  >
                    {msg.attachment && (
                      <div className="mb-2 max-w-full overflow-hidden rounded-lg border border-white/20 bg-black/10 p-1">
                        {msg.attachment.type === 'image' && msg.attachment.url && (
                          <img 
                            src={msg.attachment.url} 
                            alt="Attached file preview" 
                            className="max-h-32 w-full rounded object-cover" 
                          />
                        )}
                        {msg.attachment.type === 'pdf' && (
                          <div className="flex items-center space-x-2 p-1.5 text-xs text-white">
                            <FileText className="w-4 h-4 shrink-0 text-orange-200" />
                            <span className="truncate font-sans font-medium">{msg.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => {
                            if (props.href?.startsWith('/')) {
                              return <Link to={props.href} className="text-[#E06D2B] font-bold hover:underline" onClick={() => setIsOpen(false)}>{props.children}</Link>;
                            }
                            return <a {...props} className="text-[#E06D2B] font-bold hover:underline" target="_blank" rel="noopener noreferrer">{props.children}</a>;
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              
              {isSearching && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-4 bg-white border border-navy-dark/10 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-xs text-navy-dark/50 font-medium">Searching the web...</span>
                  </div>
                </div>
              )}
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

            {/* Context Badge */}
            {attachedFile && (
              <div className="bg-purple-50 border-t border-purple-100 px-3 py-1.5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2 text-purple-700">
                  {attachedFile.type === 'image' ? (
                    attachedFile.url ? (
                      <img src={attachedFile.url} alt="Thumbnail" className="w-5 h-5 rounded object-cover border border-purple-200" />
                    ) : (
                      <FileUp className="w-3.5 h-3.5" />
                    )
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] font-bold font-sans truncate max-w-[200px]">
                    Attachment: {attachedFile.name}
                  </span>
                </div>
                <button onClick={() => setAttachedFile(null)} className="text-purple-400 hover:text-red-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-navy-dark/10 flex items-center space-x-2 shrink-0">
              <input
                type="file"
                accept="application/pdf,image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Upload Image or PDF (up to 50MB)"
                className="w-10 h-10 flex items-center justify-center bg-gray-50 text-navy-dark/60 rounded-xl border border-navy-dark/10 hover:bg-gray-100 transition-colors shrink-0 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setWebSearchEnabled(prev => !prev)}
                title="Toggle Web Search"
                className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors shrink-0 ${
                  webSearchEnabled
                    ? 'bg-purple-50 text-purple-600 border-purple-300 ring-2 ring-purple-100'
                    : 'bg-gray-50 text-navy-dark/60 border-navy-dark/10 hover:bg-gray-100'
                }`}
              >
                <Globe className="w-4 h-4" />
              </button>
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
