import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Award, Trophy, HelpCircle, CheckCircle, XCircle, 
  ArrowRight, RotateCcw, Loader2, Sparkles, AlertCircle, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStudentAuth } from '../lib/StudentAuthProvider';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_option: number;
  explanation: string;
  subject: string;
  semester: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  subject: string;
}

interface ScoreRecord {
  id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  score: number;
  quizzes_taken: number;
  updated_at: string;
}

export const GPATPrep: React.FC = () => {
  const { studentProfile } = useStudentAuth();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'quiz' | 'flashcards' | 'leaderboard'>('quiz');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  
  // Data States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([]);

  // Quiz Play States
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState<'start' | 'playing' | 'completed'>('start');
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [scoreSaveSuccess, setScoreSaveSuccess] = useState<string | null>(null);

  // Quiz Customization States
  const [quizMode, setQuizMode] = useState<'local' | 'ai'>('local');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiLoadMessage, setAiLoadMessage] = useState('');
  const [aiError, setAiError] = useState('');

  // Flashcards States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [masteredCards, setMasteredCards] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('gpat_mastered_cards');
    return saved ? JSON.parse(saved) : {};
  });

  // Fetch Questions, Flashcards & Leaderboard from Supabase
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Questions
      const { data: questionsData, error: qErr } = await supabase
        .from('gpat_questions')
        .select('*');
      if (qErr) throw qErr;
      setQuestions(questionsData || []);

      // 2. Fetch Flashcards
      const { data: flashcardsData, error: fErr } = await supabase
        .from('gpat_flashcards')
        .select('*');
      if (fErr) throw fErr;
      setFlashcards(flashcardsData || []);

      // 3. Fetch Leaderboard (fetch all to calculate correct percentile rank)
      const { data: leaderboardData, error: lErr } = await supabase
        .from('gpat_scores')
        .select('*')
        .order('score', { ascending: false });
      if (lErr) throw lErr;
      setLeaderboard(leaderboardData || []);

    } catch (err: any) {
      console.error('Error fetching GPAT data:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save mastered cards to localStorage
  useEffect(() => {
    localStorage.setItem('gpat_mastered_cards', JSON.stringify(masteredCards));
  }, [masteredCards]);

  // Start/Restart Quiz
  const handleStartQuiz = () => {
    setQuizMode('local');
    setAiError('');
    if (questions.length === 0) return;
    
    // Filter questions by selected semester and subject
    let filtered = [...questions];
    if (selectedSemester !== 'All') {
      filtered = filtered.filter(q => q.semester === selectedSemester);
    }
    if (selectedSubject !== 'All') {
      filtered = filtered.filter(q => q.subject === selectedSubject);
    }

    if (filtered.length === 0) {
      setAiError(`No questions found in the local bank for ${selectedSemester !== 'All' ? selectedSemester : 'any Semester'} and ${selectedSubject !== 'All' ? selectedSubject : 'any Subject'}. Try generating an AI custom quiz to seed them!`);
      return;
    }
    
    // Pick 5 random questions (or fewer if there are less than 5)
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffled.slice(0, 5));
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setScoreSaveSuccess(null);
    setQuizState('playing');
  };

  const handleStartAIQuiz = async () => {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    const mistralKey = import.meta.env.VITE_MISTRAL_API_KEY;

    if (!groqKey && !mistralKey) {
      setAiError("API Keys are not configured! Please add VITE_GROQ_API_KEY or VITE_MISTRAL_API_KEY to your .env.local file to enable AI custom quizzes.");
      return;
    }

    setIsAILoading(true);
    setAiError("");
    setQuizMode('ai');
    
    const messages = [
      "AI is preparing exam guidelines...",
      "Drafting syllabus-aligned multiple-choice questions...",
      "Constructing clinical case studies...",
      "Validating therapeutic answers and options...",
      "Compiling detailed rationales & explanations...",
      "Ready to start!"
    ];

    let msgIndex = 0;
    setAiLoadMessage(messages[msgIndex]);
    const timer = setInterval(() => {
      if (msgIndex < messages.length - 2) {
        msgIndex++;
        setAiLoadMessage(messages[msgIndex]);
      }
    }, 1200);

    try {
      const isMistral = !!mistralKey;
      const apiKey = isMistral ? mistralKey : groqKey;
      const apiEndpoint = isMistral 
        ? "https://api.mistral.ai/v1/chat/completions" 
        : "https://api.groq.com/openai/v1/chat/completions";

      const prompt = `Generate exactly 5 high-quality GPAT/NIPER competitive exam multiple-choice questions (MCQs) for B.Pharm students.
Target Subject: ${selectedSubject === 'All' ? 'Select appropriate subjects from: Pharmacology, Pharmaceutics, Pharmacognosy, Pharmaceutical Chemistry' : selectedSubject}.
Target Semester: ${selectedSemester === 'All' ? 'Select appropriate semesters from Semester I to VIII' : selectedSemester}.
For each question, provide:
1. "question": The question text.
2. "options": Array of exactly 4 options.
3. "correct_option": The index of the correct option (0, 1, 2, or 3).
4. "explanation": A detailed clinical explanation of why that option is correct.
5. "subject": The pharmacy subject (must be one of: Pharmacology, Pharmaceutics, Pharmacognosy, Pharmaceutical Chemistry).
6. "semester": The B.Pharm semester (must be one of: Semester I, Semester II, Semester III, Semester IV, Semester V, Semester VI, Semester VII, Semester VIII).

Respond ONLY with a valid JSON array of objects with the keys "question", "options", "correct_option", "explanation", "subject", and "semester". Do NOT include markdown code blocks, do NOT include any introductory or concluding text. Just the raw JSON array.`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: isMistral ? "mistral-large-latest" : "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a senior pharmacy professor and GPAT exam curator. You generate accurate, syllabus-aligned multiple-choice questions in strict JSON format." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`AI API responded with status ${response.status}`);
      }

      const resData = await response.json();
      const rawText = resData.choices?.[0]?.message?.content || "";
      
      const jsonStart = rawText.indexOf('[');
      const jsonEnd = rawText.lastIndexOf(']') + 1;
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Invalid response format received from AI.");
      }
      
      const cleanJson = rawText.substring(jsonStart, jsonEnd);
      const parsedQuestions = JSON.parse(cleanJson) as any[];

      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        throw new Error("No questions were generated by the AI.");
      }

      const formattedQuestions: Question[] = parsedQuestions.map((q: any, index: number) => ({
        id: `ai-${index}-${Date.now()}`,
        question: q.question || 'Syllabus Question',
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_option: typeof q.correct_option === 'number' && q.correct_option >= 0 && q.correct_option <= 3 ? q.correct_option : 0,
        explanation: q.explanation || 'Refer to standard pharmacopeia references.',
        subject: q.subject || (selectedSubject === 'All' ? 'Pharmacology' : selectedSubject),
        semester: q.semester || (selectedSemester === 'All' ? 'Semester V' : selectedSemester)
      }));

      setQuizQuestions(formattedQuestions.slice(0, 5));
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setScore(0);
      setScoreSaveSuccess(null);
      setQuizState('playing');
    } catch (err: any) {
      console.error('AI Generation error:', err);
      setAiError(err.message || "Failed to generate questions. Please try again.");
    } finally {
      clearInterval(timer);
      setIsAILoading(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    
    const currentQ = quizQuestions[currentQuestionIndex];
    if (selectedOption === currentQ.correct_option) {
      setScore(prev => prev + 10); // +10 points for correct answer
    }
    
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizState('completed');
      
      const pointsGained = score + (selectedOption === quizQuestions[currentQuestionIndex].correct_option ? 10 : 0);

      // If in AI mode, save these generated questions to public.gpat_questions to grow the bank
      if (quizMode === 'ai' && quizQuestions.length > 0) {
        try {
          await supabase.from('gpat_questions').insert(
            quizQuestions.map(q => ({
              question: q.question,
              options: q.options,
              correct_option: q.correct_option,
              explanation: q.explanation,
              subject: q.subject,
              semester: q.semester
            }))
          );
          console.log("Successfully synced AI questions to Supabase bank!");
        } catch (dbErr) {
          console.warn("Failed to sync AI questions to database:", dbErr);
        }
      }

      // Save Score to database if user is logged in
      if (studentProfile) {
        setIsSavingScore(true);
        try {
          // Check if user already has a score record
          const { data: existingScore, error: fetchErr } = await supabase
            .from('gpat_scores')
            .select('*')
            .eq('user_id', studentProfile.id)
            .maybeSingle();

          if (fetchErr) throw fetchErr;

          if (existingScore) {
            const { error: updateErr } = await supabase
              .from('gpat_scores')
              .update({
                score: existingScore.score + pointsGained,
                quizzes_taken: existingScore.quizzes_taken + 1,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', studentProfile.id);
            if (updateErr) throw updateErr;
          } else {
            const { error: insertErr } = await supabase
              .from('gpat_scores')
              .insert({
                user_id: studentProfile.id,
                student_name: studentProfile.full_name || 'Anonymous Student',
                student_email: studentProfile.email,
                score: pointsGained,
                quizzes_taken: 1
              });
            if (insertErr) throw insertErr;
          }
          
          setScoreSaveSuccess(`Nice work! Added +${pointsGained} points to your profile.`);
          
          // Refresh leaderboard
          const { data: refreshedLeaderboard } = await supabase
            .from('gpat_scores')
            .select('*')
            .order('score', { ascending: false });
          if (refreshedLeaderboard) setLeaderboard(refreshedLeaderboard);

        } catch (err: any) {
          console.error('Failed to save score:', err.message);
        } finally {
          setIsSavingScore(false);
        }
      }
    }
  };

  // Flashcards Filtering
  const uniqueCategories = useMemo(() => {
    const cats = new Set(flashcards.map(c => c.category));
    return ['all', ...Array.from(cats)];
  }, [flashcards]);

  const filteredFlashcards = useMemo(() => {
    if (selectedCategory === 'all') return flashcards;
    return flashcards.filter(c => c.category === selectedCategory);
  }, [flashcards, selectedCategory]);

  const toggleCardFlip = (id: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleMastered = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent card flipping when pressing the mastered button
    setMasteredCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24 text-white">
      <ScienceBackground />
      <div className="absolute top-[20%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <PageHeader
        icon={<BookOpen className="w-6 h-6 text-orange-burnt animate-pulse" />}
        title="GPAT & NIPER Prep Hub"
        subtitle="Hone your pharmacy competitive exam skills with practice quizzes, interactive flashcards, and scoreboard rankings."
        breadcrumb="GPAT Prep"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-6 py-2.5 rounded-full font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 border flex items-center space-x-2 ${
              activeTab === 'quiz'
                ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white border-transparent shadow-lg shadow-orange-burnt/15'
                : 'bg-white/[0.03] hover:bg-white/[0.06] text-white/65 hover:text-white border-white/[0.06]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Practice Quiz</span>
          </button>
          
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`px-6 py-2.5 rounded-full font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 border flex items-center space-x-2 ${
              activeTab === 'flashcards'
                ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white border-transparent shadow-lg shadow-orange-burnt/15'
                : 'bg-white/[0.03] hover:bg-white/[0.06] text-white/65 hover:text-white border-white/[0.06]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Flashcards</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-2.5 rounded-full font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 border flex items-center space-x-2 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white border-transparent shadow-lg shadow-orange-burnt/15'
                : 'bg-white/[0.03] hover:bg-white/[0.06] text-white/65 hover:text-white border-white/[0.06]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* Tab Contents */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
            <p className="text-white/60 font-medium text-sm">Loading exam preparation hub...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* 1. QUIZ TAB */}
            {activeTab === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-3xl mx-auto"
              >
                {quizState === 'start' && (
                  <div className="bg-[#0D1B3E]/85 border border-orange-burnt/25 rounded-3xl p-8 text-center backdrop-blur-md shadow-2xl relative overflow-hidden">
                    {isAILoading ? (
                      <div className="py-12 space-y-6 flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-orange-burnt animate-spin" />
                        <div className="space-y-1">
                          <h4 className="font-display font-bold text-base text-white">AI Generator Engaged</h4>
                          <p className="text-xs text-white/55 animate-pulse">{aiLoadMessage}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                          <Sparkles className="w-40 h-40 text-orange-burnt" />
                        </div>
                        <Award className="w-16 h-16 text-orange-burnt mx-auto mb-4 animate-bounce" />
                        <h3 className="font-display font-extrabold text-2xl mb-2">GPAT & NIPER Practice Quiz</h3>
                        <p className="text-white/60 text-sm max-w-md mx-auto mb-6">
                          Test your pharmacy knowledge with 5 randomized multiple-choice questions. Earn 10 points per correct response!
                        </p>

                        {/* Mode Selectors */}
                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                          <button
                            type="button"
                            onClick={() => setQuizMode('local')}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                              quizMode === 'local'
                                ? 'bg-orange-burnt/10 border-orange-burnt'
                                : 'bg-[#060D1F]/50 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <span className="font-display font-bold text-xs block text-white">Community Bank</span>
                            <span className="text-[10px] text-white/45 block mt-0.5">Quiz using verified peer-contributed questions.</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setQuizMode('ai')}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                              quizMode === 'ai'
                                ? 'bg-orange-burnt/10 border-orange-burnt'
                                : 'bg-[#060D1F]/50 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <span className="font-display font-bold text-xs block text-white flex items-center gap-1">
                              AI Quiz Generator <Sparkles className="w-3.5 h-3.5 text-orange-burnt" />
                            </span>
                            <span className="text-[10px] text-white/45 block mt-0.5">Generate new syllabus questions on-the-fly.</span>
                          </button>
                        </div>

                        {/* Quiz Customization Options */}
                        <div className="bg-[#060D1F]/40 border border-white/5 p-4 rounded-2xl max-w-md mx-auto mb-6 text-left space-y-3.5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] font-extrabold uppercase tracking-widest text-white/45 mb-1.5">
                                Semester
                              </label>
                              <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="w-full bg-[#0D1B3E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-burnt transition-colors"
                              >
                                <option value="All">All Semesters</option>
                                <option value="Semester I">Semester I</option>
                                <option value="Semester II">Semester II</option>
                                <option value="Semester III">Semester III</option>
                                <option value="Semester IV">Semester IV</option>
                                <option value="Semester V">Semester V</option>
                                <option value="Semester VI">Semester VI</option>
                                <option value="Semester VII">Semester VII</option>
                                <option value="Semester VIII">Semester VIII</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] font-extrabold uppercase tracking-widest text-white/45 mb-1.5">
                                Subject
                              </label>
                              <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full bg-[#0D1B3E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-burnt transition-colors"
                              >
                                <option value="All">All Subjects</option>
                                <option value="Pharmacology">Pharmacology</option>
                                <option value="Pharmaceutics">Pharmaceutics</option>
                                <option value="Pharmacognosy">Pharmacognosy</option>
                                <option value="Pharmaceutical Chemistry">Pharmaceutical Chemistry</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {aiError && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-400 max-w-md mx-auto mb-6 flex items-start space-x-2 text-left">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>{aiError}</span>
                          </div>
                        )}

                        {!studentProfile && (
                          <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-4 text-xs text-yellow-400/90 max-w-md mx-auto mb-6 flex items-start space-x-3 text-left">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block">Not Signed In</span>
                              You can still practice, but your scores won't be saved to the prep leaderboard.
                            </div>
                          </div>
                        )}

                        <button
                          onClick={quizMode === 'local' ? handleStartQuiz : handleStartAIQuiz}
                          className="px-8 py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-sm font-display font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                        >
                          {quizMode === 'local' ? 'Start Mock Quiz' : 'Generate Custom Quiz'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {quizState === 'playing' && quizQuestions.length > 0 && (
                  <div className="space-y-6">
                    {/* Header Progress Bar */}
                    <div className="bg-[#0D1B3E]/70 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                      <span className="text-xs font-semibold text-white/50">
                        Question <strong className="text-white">{currentQuestionIndex + 1}</strong> of {quizQuestions.length}
                      </span>
                      <div className="w-32 bg-white/10 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-orange-burnt h-full transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-display font-bold text-orange-burnt">
                        Score: {score} pts
                      </span>
                    </div>

                    {/* Question Card */}
                    <div className="bg-[#0D1B3E]/85 border border-orange-burnt/25 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
                      <span className="bg-orange-burnt/10 text-orange-burnt border border-orange-burnt/20 text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                        {quizQuestions[currentQuestionIndex].subject}
                      </span>
                      <h4 className="font-display font-bold text-lg sm:text-xl text-white leading-snug">
                        {quizQuestions[currentQuestionIndex].question}
                      </h4>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 gap-3.5">
                        {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                          const isSelected = selectedOption === idx;
                          const isCorrect = idx === quizQuestions[currentQuestionIndex].correct_option;
                          
                          let cardStyle = "border-white/10 bg-[#060D1F]/50 hover:bg-[#0F224C]/45 hover:border-orange-burnt/40";
                          if (isSelected) {
                            cardStyle = "border-orange-burnt bg-orange-burnt/10";
                          }
                          if (isAnswerSubmitted) {
                            if (isCorrect) {
                              cardStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-300";
                            } else if (isSelected) {
                              cardStyle = "border-red-500 bg-red-500/10 text-red-300";
                            } else {
                              cardStyle = "border-white/5 bg-[#060D1F]/20 opacity-50 cursor-not-allowed";
                            }
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => handleOptionSelect(idx)}
                              disabled={isAnswerSubmitted}
                              className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all duration-300 flex items-center justify-between ${cardStyle}`}
                            >
                              <span>{option}</span>
                              {isAnswerSubmitted && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 ml-2" />}
                              {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      {isAnswerSubmitted && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 sm:p-5 text-xs text-white/70 leading-relaxed font-sans space-y-1.5"
                        >
                          <span className="font-bold text-orange-burnt uppercase tracking-wider block text-[10px]">
                            Explanation
                          </span>
                          <p>{quizQuestions[currentQuestionIndex].explanation}</p>
                        </motion.div>
                      )}

                      {/* Control Button */}
                      <div className="flex justify-end pt-4">
                        {!isAnswerSubmitted ? (
                          <button
                            onClick={handleSubmitAnswer}
                            disabled={selectedOption === null}
                            className="px-6 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs sm:text-sm font-display font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center space-x-1.5 shadow-md"
                          >
                            <span>Submit Answer</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={handleNextQuestion}
                            className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-display font-bold uppercase tracking-wider rounded-xl transition-all flex items-center space-x-1.5 border border-white/10 shadow-md"
                          >
                            <span>
                              {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {quizState === 'completed' && (
                  <div className="bg-[#0D1B3E]/85 border border-orange-burnt/25 rounded-3xl p-8 text-center backdrop-blur-md shadow-2xl space-y-6">
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-2 animate-bounce" />
                    <h3 className="font-display font-extrabold text-2xl">Quiz Completed!</h3>
                    
                    <div className="max-w-xs mx-auto bg-[#060D1F]/80 p-5 rounded-2xl border border-white/5 space-y-1.5">
                      <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Final Result</span>
                      <div className="text-3xl font-display font-extrabold text-orange-burnt">
                        {score} <span className="text-white/60 text-sm">/ 50 pts</span>
                      </div>
                      <span className="text-xs text-white/50 block">
                        ({score / 10} out of 5 questions correct)
                      </span>
                    </div>

                    {isSavingScore ? (
                      <div className="flex items-center justify-center space-x-2 text-xs text-white/40">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-burnt" />
                        <span>Saving scores to database...</span>
                      </div>
                    ) : scoreSaveSuccess ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-400 max-w-sm mx-auto flex items-center justify-center space-x-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>{scoreSaveSuccess}</span>
                      </div>
                    ) : null}

                    <div className="flex justify-center space-x-4 pt-4">
                      <button
                        onClick={handleStartQuiz}
                        className="px-6 py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs font-display font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center space-x-1.5"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Retry Quiz</span>
                      </button>
                      <button
                        onClick={() => {
                          setQuizState('start');
                          setQuizQuestions([]);
                        }}
                        className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-display font-bold uppercase tracking-wider rounded-xl border border-white/5 transition-all"
                      >
                        Back to Menu
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. FLASHCARDS TAB */}
            {activeTab === 'flashcards' && (
              <motion.div
                key="flashcards"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* Category Filters */}
                <div className="flex flex-wrap items-center justify-center gap-2 border-b border-white/5 pb-6">
                  {uniqueCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full font-display text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        selectedCategory === cat
                          ? 'bg-orange-burnt/15 border-orange-burnt text-orange-burnt'
                          : 'bg-white/[0.02] hover:bg-white/[0.04] text-white/50 border-white/[0.05]'
                      }`}
                    >
                      {cat.replace('-', ' ')}
                    </button>
                  ))}
                </div>

                {filteredFlashcards.length === 0 ? (
                  <div className="text-center py-16 bg-[#0D1B3E]/60 rounded-3xl border border-orange-burnt/15 max-w-sm mx-auto p-6">
                    <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="font-display font-bold text-white/70 text-base">No flashcards found</h3>
                    <p className="text-white/40 text-xs mt-1">Check back later for newly added items.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFlashcards.map(card => {
                      const isFlipped = flippedCards[card.id] || false;
                      const isMastered = masteredCards[card.id] || false;

                      return (
                        <div
                          key={card.id}
                          className="h-72 cursor-pointer relative perspective"
                          onClick={() => toggleCardFlip(card.id)}
                        >
                          <div 
                            className={`w-full h-full duration-500 transform-style preserve-3d relative ${
                              isFlipped ? 'rotate-y-180' : ''
                            }`}
                          >
                            {/* FRONT OF THE CARD */}
                            <div className="absolute inset-0 backface-hidden w-full h-full bg-[#0D1B3E]/85 border border-orange-burnt/25 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                              <div className="flex items-center justify-between">
                                <span className="bg-orange-burnt/10 text-orange-burnt text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded border border-orange-burnt/20">
                                  {card.subject}
                                </span>
                                <span className="text-[10px] text-white/45 font-semibold">
                                  {card.category}
                                </span>
                              </div>
                              <div className="text-center py-6">
                                <h3 className="font-display font-extrabold text-xl text-white tracking-wide">
                                  {card.front}
                                </h3>
                              </div>
                              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                <button
                                  onClick={(e) => handleToggleMastered(e, card.id)}
                                  className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                                    isMastered 
                                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                                      : 'bg-white/[0.02] border-white/10 text-white/35 hover:text-emerald-400 hover:border-emerald-500/40'
                                  }`}
                                  title={isMastered ? "Mastered" : "Mark Mastered"}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest flex items-center">
                                  Tap to flip <ArrowRight className="w-3 h-3 ml-1" />
                                </span>
                              </div>
                            </div>

                            {/* BACK OF THE CARD */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full bg-[#071330] border border-orange-burnt/40 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-[10px] text-orange-burnt font-bold uppercase tracking-wider">
                                  Definition / Details
                                </span>
                                <span className="text-[10px] text-white/40">{card.front}</span>
                              </div>
                              <div className="flex-grow flex items-center justify-center overflow-y-auto py-2">
                                <p className="text-white/85 text-xs sm:text-sm leading-relaxed text-center font-sans">
                                  {card.back}
                                </p>
                              </div>
                              <div className="text-center text-[9px] font-bold text-white/20 uppercase tracking-widest border-t border-white/5 pt-2">
                                Tap to flip back
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. LEADERBOARD TAB */}
            {activeTab === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-3xl mx-auto"
              >
                <div className="bg-[#0D1B3E]/80 border border-orange-burnt/25 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
                  <div className="flex items-center space-x-3 pb-2 border-b border-white/5">
                    <Trophy className="w-6 h-6 text-yellow-500 shrink-0" />
                    <div>
                      <h3 className="font-display font-extrabold text-lg">Top Prep Scoreboard</h3>
                      <p className="text-white/40 text-[11px]">Rankings updated dynamically as mock quizzes are completed.</p>
                    </div>
                  </div>

                  {leaderboard.length === 0 ? (
                    <div className="text-center py-10 text-white/40 text-xs">
                      No points recorded yet. Be the first to play and rank!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-white/40 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">
                            <th className="py-3 px-4">Rank</th>
                            <th className="py-3 px-4">Student</th>
                            <th className="py-3 px-4 text-center">Quizzes Taken</th>
                            <th className="py-3 px-4 text-center">Percentile</th>
                            <th className="py-3 px-4 text-right">Accumulated Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboard.slice(0, 10).map((record, index) => {
                            const isMe = studentProfile && record.user_id === studentProfile.id;
                            let rankBadge = `${index + 1}`;
                            if (index === 0) rankBadge = '🥇';
                            else if (index === 1) rankBadge = '🥈';
                            else if (index === 2) rankBadge = '🥉';

                            // Calculate percentile based on the complete list of scores
                            const allScores = leaderboard.map(r => r.score);
                            const below = allScores.filter(s => s < record.score).length;
                            const equal = allScores.filter(s => s === record.score).length;
                            const total = allScores.length;
                            const percentile = total > 0 ? Math.round((((below + 0.5 * equal) / total) * 100) * 10) / 10 : 0;

                            return (
                              <tr 
                                key={record.id}
                                className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${
                                  isMe ? 'bg-orange-burnt/10 hover:bg-orange-burnt/15' : ''
                                }`}
                              >
                                <td className="py-3.5 px-4 font-display font-bold text-sm">
                                  {rankBadge}
                                </td>
                                <td className="py-3.5 px-4 flex items-center space-x-2">
                                  <div className="font-bold text-white flex items-center space-x-1.5">
                                    <span>{record.student_name}</span>
                                    {isMe && (
                                      <span className="bg-orange-burnt text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-widest scale-90">
                                        You
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-center text-white/60">
                                  {record.quizzes_taken}
                                </td>
                                <td className="py-3.5 px-4 text-center font-display font-bold text-orange-burnt">
                                  {percentile}%tile
                                </td>
                                <td className="py-3.5 px-4 text-right font-display font-black text-orange-burnt text-sm sm:text-base">
                                  {record.score} <span className="text-[10px] font-bold text-white/40 uppercase">pts</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}

      </div>
    </div>
  );
};

export default GPATPrep;
