import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2, Bot, FileUp, FileText, Globe, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { useStudentAuth } from '../lib/StudentAuthProvider';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  const allResults: string[] = [];

  // 1. Try our Vercel Serverless Function (production)
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results.map((r: any) => `- **[${r.title}](${r.url})**: ${r.snippet}`).join('\n\n');
      }
    }
  } catch (err) {
    console.warn("Backend search failed or local dev 404. Falling back to direct client-side search.", err);
  }

  // 2. DuckDuckGo Instant Answer API (CORS-friendly, no API key needed)
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl);
    if (ddgRes.ok) {
      const ddgData = await ddgRes.json();
      if (ddgData.AbstractText) {
        allResults.push(`- **[${ddgData.Heading || query}](${ddgData.AbstractURL || '#'})**: ${ddgData.AbstractText}`);
      }
      if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
        ddgData.RelatedTopics.slice(0, 3).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            allResults.push(`- **[${topic.Text.split(' - ')[0] || 'Related'}](${topic.FirstURL})**: ${topic.Text}`);
          }
        });
      }
    }
  } catch (ddgErr) {
    console.warn("DuckDuckGo Instant Answer failed:", ddgErr);
  }

  // 3. Wikipedia OpenSearch (CORS-friendly, never blocked)
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=4&namespace=0&format=json&origin=*`;
    const res = await fetch(wikiUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data[1] && data[1].length > 0) {
        const titles = data[1];
        const snippets = data[2] || [];
        const urls = data[3] || [];
        titles.forEach((title: string, i: number) => {
          allResults.push(`- **[${title}](${urls[i]})**: ${snippets[i] || 'No description available.'}`);
        });
      }
    }
  } catch (wikiErr) {
    console.error("Client-side Wikipedia search failed:", wikiErr);
  }

  if (allResults.length > 0) {
    return allResults.join('\n\n');
  }

  return "No search results found.";
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachment?: {
    type: 'image' | 'pdf';
    name: string;
    url?: string;
  };
  timestamp?: number;
}

// Returns time-based greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
};

const HISTORY_KEY = (userId: string) => `tgpcop_chat_history_${userId}`;
const MAX_HISTORY = 50; // max messages to persist

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-navy-dark/10 bg-[#0d1b3e] text-white shadow-lg font-mono text-xs max-w-full">
      <div className="flex justify-between items-center bg-[#152852] px-4 py-2 text-[11px] text-white/60 border-b border-white/5 font-sans">
        <span className="font-bold uppercase tracking-wider">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all font-medium cursor-pointer"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto leading-relaxed text-left">
        <code className="block select-text whitespace-pre">{value}</code>
      </pre>
    </div>
  );
};

export const AIChatbot: React.FC = () => {
  const { studentProfile } = useStudentAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Build welcome message based on login state ──
  const buildWelcomeMessage = useCallback((profile: typeof studentProfile): ChatMessage => {
    const greeting = getGreeting();
    const firstName = profile?.full_name?.split(' ')[0] || null;
    const content = firstName
      ? `${greeting}, **${firstName}**! 👋 I'm the TGPCOP Council AI Assistant. Great to see you again! How can I help you today?`
      : `Hi there! I'm the TGPCOP Council AI Assistant. How can I help you today?`;
    return { role: 'assistant', content, timestamp: Date.now() };
  }, []);

  // ── Load chat history from localStorage on mount / auth change ──
  useEffect(() => {
    const userId = studentProfile?.id || 'guest';
    const key = HISTORY_KEY(userId);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: ChatMessage[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setMessages(parsed);
          setHistoryLoaded(true);
          return;
        }
      }
    } catch (_) {}
    // No history — show fresh welcome
    setMessages([buildWelcomeMessage(studentProfile)]);
    setHistoryLoaded(true);
  }, [studentProfile?.id]); // re-run when user logs in/out

  // ── Persist chat history to localStorage on every message update ──
  useEffect(() => {
    if (!historyLoaded) return;
    const userId = studentProfile?.id || 'guest';
    const key = HISTORY_KEY(userId);
    try {
      // Only keep last MAX_HISTORY messages, skip base64 image data to save space
      const toSave = messages.slice(-MAX_HISTORY).map(m => ({
        ...m,
        attachment: m.attachment ? { ...m.attachment, url: undefined } : undefined
      }));
      localStorage.setItem(key, JSON.stringify(toSave));
    } catch (_) {}
  }, [messages, historyLoaded, studentProfile?.id]);

  // ── Clear history handler ──
  const handleClearHistory = () => {
    const userId = studentProfile?.id || 'guest';
    localStorage.removeItem(HISTORY_KEY(userId));
    setMessages([buildWelcomeMessage(studentProfile)]);
  };

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
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.warn("AI keys are missing. Using mock response for local UI testing.");
          
          let mockReply = `### 🩺 Study Assistant (Local Test Mode)

Here is a mock response demonstrating the new **premium formatted Markdown** rendering:

#### 1. Labeled Organ Diagram
\`\`\`text
                 [ KIDNEY ANATOMY ]
             
         +-------------------------------+  <- Renal Capsule
         |   =========================   |  
         |  /  _____________________  \\  |  <- Renal Cortex
         | /  /   _     _     _     \\  \\ |  
         | | |   (_)   (_)   (_)     | | |  <- Renal Pyramids (Medulla)
         | | |    \\     /     /      | | |  
         | \\ \\     \\___/_____/       / / |  <- Renal Pelvis
         |  \\ \\_______||____________/ /  |  
         +------------||-----------------+  
                      ||                    <- Ureter (To Bladder)
                      v
\`\`\`

#### 2. Key Structures & Functions
- **Renal Cortex**: The outer zone of the kidney containing the nephrons.
- **Medulla**: Contains renal pyramids regulating water and salt balance.
- **Renal Pelvis**: Funnel-like dilated proximal part of the ureter.

#### 3. Functional Matrix

| Region | Primary Function | Clinical Relevance |
|:---|:---|:---|
| **Cortex** | Ultrafiltration | Glomerulonephritis |
| **Medulla** | Urine concentration | Acute tubular necrosis |
| **Pelvis** | Urine collection | Kidney stones (Calculi) |

> 💡 **Tip:** Add \`VITE_MISTRAL_API_KEY\` to your \`.env.local\` to activate the live LLM assistant!`;

          if (shouldSearch && searchResults) {
            mockReply += `\n\n**Web Search Results (Wikipedia Fallback):**\n${searchResults}`;
          }

          setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: mockReply }]);
            setIsTyping(false);
          }, 1000);
          return;
        }
        
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
          max_tokens: 1024
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
                {studentProfile?.avatar_url ? (
                  <img
                    src={studentProfile.avatar_url}
                    alt={studentProfile.full_name}
                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-display font-bold text-sm leading-tight">
                    {studentProfile?.full_name ? `Hi, ${studentProfile.full_name.split(' ')[0]}!` : 'Council AI Assistant'}
                  </h3>
                  <span className="text-[10px] text-white/60 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{studentProfile ? 'Logged in' : 'Online'}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  title="Clear chat history"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/20 transition-colors group"
                >
                  <Trash2 className="w-4 h-4 text-white/50 group-hover:text-red-400 transition-colors" />
                </button>
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
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => {
                            if (props.href?.startsWith('/')) {
                              return <Link to={props.href} className="text-[#E06D2B] font-bold hover:underline" onClick={() => setIsOpen(false)}>{props.children}</Link>;
                            }
                            return <a {...props} className="text-[#E06D2B] font-bold hover:underline" target="_blank" rel="noopener noreferrer">{props.children}</a>;
                          },
                          code: ({ node, className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !className;
                            const codeString = String(children).replace(/\n$/, '');
                            if (!isInline) {
                              return <CodeBlock language={match ? match[1] : 'text'} value={codeString} />;
                            }
                            return (
                              <code className="bg-[#374151] text-[#93c5fd] px-1.5 py-0.5 rounded font-mono text-xs font-semibold" {...props}>
                                {children}
                              </code>
                            );
                          },
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-3 rounded-xl border border-navy-dark/10 shadow-sm max-w-full">
                              <table className="min-w-full divide-y divide-navy-dark/10 text-left text-xs" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className="bg-gray-50 font-bold text-navy-dark uppercase tracking-wider" {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="px-4 py-2.5 font-bold border-b border-navy-dark/10" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="px-4 py-2 border-b border-navy-dark/5 text-navy-dark/80" {...props} />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-4 border-teal-600 pl-4 italic text-navy-dark/70 my-3 bg-teal-50/20 py-2 pr-3 rounded-r-lg" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc pl-5 my-2 space-y-1 text-navy-dark/95" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal pl-5 my-2 space-y-1 text-navy-dark/95" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="pl-1" {...props} />
                          ),
                          h1: ({ node, ...props }) => (
                            <h1 className="text-lg font-bold text-navy-dark mt-4 mb-2 first:mt-0" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-base font-bold text-navy-dark mt-3 mb-1.5 first:mt-0" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-sm font-bold text-navy-dark mt-2 mb-1 first:mt-0" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="my-1.5 leading-relaxed text-navy-dark/90" {...props} />
                          )
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
