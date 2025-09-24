import React, { useState, useCallback, useMemo } from 'react';
import { Question } from './types';
import { generateFullExamInClient } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';
import QuestionCard from './components/QuestionCard';
import { SUBJECTS, QUESTIONS_PER_SUBJECT } from './constants';

const TOTAL_QUESTIONS = SUBJECTS.length * QUESTIONS_PER_SUBJECT;

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number[]>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const handleStartExam = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setQuestions([]);
    setUserAnswers({});
    setIsSubmitted(false);
    setProgress(0);

    try {
      await generateFullExamInClient(
        (newQuestion) => {
            setQuestions(prev => {
                const updatedQuestions = [...prev, newQuestion];
                setProgress(updatedQuestions.length);
                return updatedQuestions;
            });
        },
        (errorMessage) => {
            setError(errorMessage);
            setIsLoading(false);
        },
        () => {
            setIsLoading(false);
        }
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
      setIsLoading(false);
    }
  }, []);
  
  const handleSelectOption = useCallback((questionIndex: number, optionIndex: number) => {
    setUserAnswers(prev => {
        const currentAnswers = prev[questionIndex] ? [...prev[questionIndex]] : [];
        const optionPosition = currentAnswers.indexOf(optionIndex);

        if(optionPosition > -1) {
            currentAnswers.splice(optionPosition, 1);
        } else {
            if (currentAnswers.length < 2) {
                currentAnswers.push(optionIndex);
            }
        }
        return { ...prev, [questionIndex]: currentAnswers };
    });
  }, []);

  const handleSubmit = () => {
    setIsSubmitted(true);
    window.scrollTo(0, 0);
  };
  
  const totalScore = useMemo(() => {
    if (!isSubmitted) return 0;
    return Object.keys(userAnswers).reduce((total, qIndexStr) => {
        const qIndex = parseInt(qIndexStr, 10);
        const selectedOptionIndexes = userAnswers[qIndex] || [];
        const questionScore = selectedOptionIndexes.reduce((score, oIndex) => {
            return score + (questions[qIndex]?.options[oIndex]?.score || 0);
        }, 0);
        return total + questionScore;
    }, 0);
  }, [isSubmitted, userAnswers, questions]);

  const maxScore = useMemo(() => {
    if (questions.length === 0) return 0;
    return questions.reduce((total, question) => {
        const topScores = question.options
            .map(o => o.score)
            .sort((a, b) => b - a)
            .slice(0, 2);
        return total + topScores.reduce((a, b) => a + b, 0);
    }, 0);
  }, [questions]);

  const resetTest = () => {
      setQuestions([]);
      setIsLoading(false);
      setError(null);
      setUserAnswers({});
      setIsSubmitted(false);
      setProgress(0);
  }

  return (
    <div className="bg-slate-50 min-h-screen text-gray-900">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
                 <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                 <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">AI 문제 생성기</h1>
            </div>
          <p className="text-xl text-gray-600 mt-2">서울교통공사 3급 상황판단역량 시험</p>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-12">
        {questions.length === 0 && !isLoading && !error && (
            <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">전체 과목 모의고사</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                    서울교통공사 3급 상황판단역량 시험의 모든 과목(총 5과목, 10문제)에 대한 모의고사를 시작합니다.
                    준비가 되셨으면 아래 버튼을 눌러 시험을 시작하세요.
                </p>
                <button
                    onClick={handleStartExam}
                    disabled={isLoading}
                    className="px-12 py-4 bg-blue-600 text-white font-bold text-lg rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 disabled:transform-none"
                    >
                    {`시험 시작하기 (${TOTAL_QUESTIONS}문제)`}
                </button>
            </div>
        )}

        {isLoading && (
            <div className="text-center p-10 bg-white rounded-2xl shadow-lg border border-gray-200">
                <LoadingSpinner />
                <p className="mt-6 text-2xl font-bold text-blue-600 animate-pulse">
                    AI가 문제를 생성하고 있습니다... ({progress}/{TOTAL_QUESTIONS})
                </p>
                <p className="mt-2 text-lg text-gray-700">
                    실시간으로 문제가 표시됩니다. 모든 문제가 생성될 때까지<br/>
                    페이지를 벗어나지 마세요. (약 1분 ~ 2분 소요)
                </p>
            </div>
        )}
        
        {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md text-center">
            <p className="font-semibold">오류 발생!</p>
            <p className="mt-2">{error}</p>
            <button onClick={resetTest} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors">
                새로 시작하기
            </button>
        </div>
        )}

        {questions.length > 0 && (
        <div className="space-y-8">
            {isSubmitted && (
                <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-200 sticky top-4 z-10">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">시험 결과</h2>
                    <p className="text-5xl font-extrabold text-blue-600">{totalScore} <span className="text-3xl text-gray-500">/ {maxScore}점</span></p>
                    <button onClick={resetTest} className="mt-8 px-8 py-3 bg-indigo-500 text-white font-bold text-lg rounded-lg shadow-md hover:bg-indigo-600 transform hover:scale-105 transition-all duration-300">
                        새로운 시험 시작하기
                    </button>
                </div>
            )}
            
            {questions.map((q, i) => (
                <QuestionCard
                    key={i}
                    question={q}
                    index={i}
                    isSubmitted={isSubmitted}
                    selectedOptions={userAnswers[i] || []}
                    onSelectOption={handleSelectOption}
                />
            ))}

            {!isSubmitted && questions.length > 0 && !isLoading && (
                <div className="text-center pt-8">
                    <button
                    onClick={handleSubmit}
                    className="px-16 py-5 bg-green-500 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-green-600 transform hover:scale-105 transition-all duration-300"
                    >
                    답안 제출
                    </button>
                </div>
            )}
        </div>
        )}
      </main>
       <footer className="text-center py-8 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} AI Exam Generator. All rights reserved.</p>
        </footer>
    </div>
  );
};

export default App;
