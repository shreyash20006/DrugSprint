import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Award, Trophy, HelpCircle, CheckCircle, XCircle, 
  ArrowRight, RotateCcw, Loader2, AlertCircle, ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStudentAuth } from '../../lib/StudentAuthProvider';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_option: number;
  explanation: string;
  subject: string;
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

  // Tabs
  const [activeTab, setActiveTab] = useState<'quiz' | 'flashcards' | 'leaderboard'>('quiz');

  // Loading and Data States
  const [isLoading, setIsLoading] = useState(true);
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

  // Flashcards States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [masteredCards, setMasteredCards] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('gpat_mastered_cards');
    return saved ? JSON.parse(saved) : {};
  });

  // Fetch from Supabase
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: qData, error: qErr } = await supabase.from('gpat_questions').select('*');
      if (qErr) throw qErr;
      setQuestions(qData || []);

      const { data: fData, error: fErr } = await supabase.from('gpat_flashcards').select('*');
      if (fErr) throw fErr;
      setFlashcards(fData || []);

      const { data: lData, error: lErr } = await supabase
        .from('gpat_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);
      if (lErr) throw lErr;
      setLeaderboard(lData || []);
    } catch (err: any) {
      console.error('Mobile GPAT fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Start Quiz
  const handleStartQuiz = () => {
    if (questions.length === 0) return;
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffled.slice(0, 5));
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setScoreSaveSuccess(null);
    setQuizState('playing');
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    const currentQ = quizQuestions[currentQuestionIndex];
    if (selectedOption === currentQ.correct_option) {
      setScore(prev => prev + 10);
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
      if (studentProfile) {
        setIsSavingScore(true);
        try {
          const { data: existingScore, error: fetchErr } = await supabase
            .from('gpat_scores')
            .select('*')
            .eq('user_id', studentProfile.id)
            .maybeSingle();

          if (fetchErr) throw fetchErr;

          const pointsGained = score + (selectedOption === quizQuestions[currentQuestionIndex].correct_option ? 10 : 0);

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

          setScoreSaveSuccess(`Score logged: +${pointsGained} points!`);
          
          const { data: refreshedLeaderboard } = await supabase
            .from('gpat_scores')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);
          if (refreshedLeaderboard) setLeaderboard(refreshedLeaderboard);
        } catch (err: any) {
          console.error('Mobile score save error:', err.message);
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
    e.stopPropagation();
    const updated = { ...masteredCards, [id]: !masteredCards[id] };
    setMasteredCards(updated);
    localStorage.setItem('gpat_mastered_cards', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 pb-6 pt-4 text-white">
      {/* Welcome Hero */}
      <section className="space-y-1">
        <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
          Exam Prep
        </span>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight leading-tight">
          GPAT & NIPER Hub
        </h2>
        <p className="font-sans text-xs text-white/50 leading-relaxed">
          Prepare for competitive pharmacy entrance exams on the go.
        </p>
      </section>

      {/* Tabs */}
      <div className="bg-[#0F1E42]/85 border border-white/5 p-1 rounded-xl flex shadow-md overflow-x-auto gap-1">
        {(['quiz', 'flashcards', 'leaderboard'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-grow text-center py-2.5 px-3 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeTab === tab ? 'bg-orange-burnt text-white' : 'text-white/45'
            }`}
          >
            {tab === 'quiz' ? 'Mock Quiz' : tab === 'flashcards' ? 'Flashcards' : 'Leaderboard'}
          </button>
        ))}
      </div>

      {/* Contents */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-2" />
          <p className="text-xs text-white/50">Loading prep details...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Mock Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              {quizState === 'start' && (
                <div className="bg-[#0F1E42]/80 border border-white/5 p-6 rounded-2xl text-center space-y-4 shadow-md">
                  <Award className="w-12 h-12 text-orange-burnt mx-auto" />
                  <div>
                    <h3 className="font-display font-bold text-sm text-white">Daily Prep Challenge</h3>
                    <p className="text-[11px] text-white/50 mt-1 leading-normal">
                      Answer 5 random syllabus questions. Earn 10 points per correct answer!
                    </p>
                  </div>
                  
                  {!studentProfile && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-[10px] text-yellow-400 text-left flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Log in to save your results to the community scoreboard.</span>
                    </div>
                  )}

                  <button
                    onClick={handleStartQuiz}
                    className="w-full py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs font-display font-bold uppercase tracking-wider rounded-xl shadow-lg border border-white/10 active:scale-[0.98] transition-transform"
                  >
                    Start Quick Quiz
                  </button>
                </div>
              )}

              {quizState === 'playing' && quizQuestions.length > 0 && (
                <div className="space-y-4">
                  {/* Progress & Current Score */}
                  <div className="flex items-center justify-between text-[11px] text-white/60 bg-[#0F1E42]/50 p-3 rounded-xl border border-white/5">
                    <span>Q: <strong>{currentQuestionIndex + 1}</strong>/5</span>
                    <span className="text-orange-burnt font-bold">{score} Points</span>
                  </div>

                  {/* Question Container */}
                  <div className="bg-[#0F1E42]/80 border border-orange-burnt/25 p-5 rounded-2xl space-y-4 shadow-md">
                    <span className="bg-orange-burnt/10 text-orange-burnt text-[8px] font-bold uppercase px-2 py-0.5 rounded border border-orange-burnt/25">
                      {quizQuestions[currentQuestionIndex].subject}
                    </span>
                    <h4 className="font-display font-bold text-sm text-white leading-snug">
                      {quizQuestions[currentQuestionIndex].question}
                    </h4>

                    {/* Options list */}
                    <div className="space-y-2">
                      {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                        const isSelected = selectedOption === idx;
                        const isCorrect = idx === quizQuestions[currentQuestionIndex].correct_option;

                        let style = "border-white/5 bg-[#0A1128]/60 text-white/80";
                        if (isSelected) {
                          style = "border-orange-burnt bg-orange-burnt/10 text-white";
                        }
                        if (isAnswerSubmitted) {
                          if (isCorrect) {
                            style = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold";
                          } else if (isSelected) {
                            style = "border-red-500 bg-red-500/10 text-red-400";
                          } else {
                            style = "border-white/[0.02] bg-[#0A1128]/20 opacity-40";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            disabled={isAnswerSubmitted}
                            onClick={() => handleOptionSelect(idx)}
                            className={`w-full p-3 text-left rounded-xl border text-[11px] transition-all flex items-center justify-between ${style}`}
                          >
                            <span>{option}</span>
                            {isAnswerSubmitted && isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {isAnswerSubmitted && (
                      <div className="bg-[#0A1128]/50 border border-white/5 rounded-xl p-3 text-[10px] text-white/60 leading-normal font-sans">
                        <strong className="text-orange-burnt block uppercase text-[8px] tracking-wider mb-0.5">Explanation</strong>
                        {quizQuestions[currentQuestionIndex].explanation}
                      </div>
                    )}

                    {/* Footer Controls */}
                    <div className="flex justify-end pt-2">
                      {!isAnswerSubmitted ? (
                        <button
                          onClick={handleSubmitAnswer}
                          disabled={selectedOption === null}
                          className="px-4 py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-[11px] font-display font-bold uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50 flex items-center"
                        >
                          Submit <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          className="px-4 py-2.5 bg-white/5 border border-white/10 text-white text-[11px] font-display font-bold uppercase tracking-wider rounded-xl transition-all flex items-center"
                        >
                          {currentQuestionIndex < quizQuestions.length - 1 ? 'Next' : 'Finish'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {quizState === 'completed' && (
                <div className="bg-[#0F1E42]/80 border border-orange-burnt/25 p-6 rounded-2xl text-center space-y-4 shadow-md">
                  <Trophy className="w-12 h-12 text-yellow-500 mx-auto animate-bounce" />
                  <h3 className="font-display font-bold text-sm text-white">Quiz Finished!</h3>

                  <div className="bg-[#0A1128]/60 p-4 rounded-xl border border-white/5 max-w-xs mx-auto">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider block">Score Earned</span>
                    <span className="text-xl font-display font-black text-orange-burnt">{score} <small className="text-white/60 text-xs">/ 50 pts</small></span>
                  </div>

                  {isSavingScore ? (
                    <div className="flex items-center justify-center space-x-1.5 text-[10px] text-white/40">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-burnt" />
                      <span>Saving to leaderboard...</span>
                    </div>
                  ) : scoreSaveSuccess ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-[10px] text-emerald-400 flex items-center justify-center space-x-1.5">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{scoreSaveSuccess}</span>
                    </div>
                  ) : null}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleStartQuiz}
                      className="flex-1 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs font-display font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1 active:scale-[0.98]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retry
                    </button>
                    <button
                      onClick={() => {
                        setQuizState('start');
                        setQuizQuestions([]);
                      }}
                      className="flex-1 py-3 bg-white/5 border border-white/10 text-white/80 rounded-xl text-xs font-display font-bold uppercase tracking-wider"
                    >
                      Menu
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Flashcards Tab */}
          {activeTab === 'flashcards' && (
            <div className="space-y-4">
              {/* Category selector */}
              <div className="flex overflow-x-auto gap-1.5 pb-2 scrollbar-none">
                {uniqueCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[9px] font-display font-bold uppercase tracking-wider transition-all border shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-orange-burnt text-white border-transparent'
                        : 'bg-white/[0.02] text-white/50 border-white/5'
                    }`}
                  >
                    {cat.replace('-', ' ')}
                  </button>
                ))}
              </div>

              {filteredFlashcards.length === 0 ? (
                <div className="text-center py-10 bg-[#0F1E42]/60 rounded-xl border border-white/5">
                  <HelpCircle className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-xs text-white/50">No flashcards available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFlashcards.map(card => {
                    const isFlipped = flippedCards[card.id] || false;
                    const isMastered = masteredCards[card.id] || false;

                    return (
                      <div
                        key={card.id}
                        onClick={() => toggleCardFlip(card.id)}
                        className="h-44 relative perspective cursor-pointer"
                      >
                        <div 
                          className={`w-full h-full duration-500 transform-style preserve-3d relative ${
                            isFlipped ? 'rotate-y-180' : ''
                          }`}
                        >
                          {/* FRONT */}
                          <div className="absolute inset-0 backface-hidden bg-[#0F1E42]/85 border border-orange-burnt/25 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                            <div className="flex justify-between items-center text-[8px] text-white/40 font-bold uppercase">
                              <span className="bg-orange-burnt/10 text-orange-burnt border border-orange-burnt/20 px-1.5 py-0.5 rounded">
                                {card.subject}
                              </span>
                              <span>{card.category}</span>
                            </div>
                            <h3 className="font-display font-bold text-center text-sm text-white tracking-wide py-2">
                              {card.front}
                            </h3>
                            <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[8px] font-bold text-white/30 uppercase tracking-wider">
                              <button
                                onClick={(e) => handleToggleMastered(e, card.id)}
                                className={`p-1 rounded ${
                                  isMastered 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/35' 
                                    : 'bg-white/[0.02] text-white/20 border border-white/5'
                                }`}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <span>Tap to flip</span>
                            </div>
                          </div>

                          {/* BACK */}
                          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#071330] border border-orange-burnt/40 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                            <div className="border-b border-white/5 pb-1 text-[8px] text-white/45 flex justify-between">
                              <span>Mechanism / Info</span>
                              <span>{card.front}</span>
                            </div>
                            <div className="flex-grow flex items-center justify-center overflow-y-auto">
                              <p className="text-[10px] leading-relaxed text-white/80 text-center font-sans">
                                {card.back}
                              </p>
                            </div>
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest text-center">
                              Tap to flip back
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="bg-[#0F1E42]/80 border border-orange-burnt/25 p-4 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                <Trophy className="w-4.5 h-4.5 text-yellow-500" />
                <span className="font-display font-bold text-xs">Top Performance Board</span>
              </div>

              {leaderboard.length === 0 ? (
                <p className="text-center py-6 text-xs text-white/40">No entries yet.</p>
              ) : (
                <div className="space-y-1">
                  {leaderboard.map((record, index) => {
                    const isMe = studentProfile && record.user_id === studentProfile.id;
                    let medal = `${index + 1}`;
                    if (index === 0) medal = '🥇';
                    else if (index === 1) medal = '🥈';
                    else if (index === 2) medal = '🥉';

                    return (
                      <div 
                        key={record.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border border-white/[0.02] text-xs transition-colors ${
                          isMe ? 'bg-orange-burnt/10 border-orange-burnt/20' : 'bg-[#0A1128]/30'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-xs">{medal}</span>
                          <span className="font-bold truncate max-w-[140px] flex items-center gap-1">
                            {record.student_name}
                            {isMe && <span className="bg-orange-burnt text-[7px] text-white px-1.5 py-0.5 rounded font-black uppercase">Me</span>}
                          </span>
                        </div>
                        <div className="text-right font-display font-extrabold text-orange-burnt">
                          {record.score} <span className="text-[8px] text-white/30 font-bold uppercase">pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default GPATPrep;
