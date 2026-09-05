import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  User,
  Clock,
  ChevronRight,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { AiChatMessage } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: AiChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
}

const SAMPLE_QUESTIONS = [
  '이번 주 김○○(김민수)의 주요 변화 알려줘.',
  '이번 달 프로그램 실적 정리해줘.',
  '지난달보다 행동변화가 증가한 이용인 찾아줘.',
  '내일 직원회의 안건 만들어줘.',
  '이번 주 기록 중 누락된 것이 있는지 확인해줘.',
  '시설장에게 보고할 이번 달 주요 사항을 정리해줘.',
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  chatHistory,
  onSendMessage,
  isLoading,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;
    const text = inputPrompt.trim();
    setInputPrompt('');
    await onSendMessage(text);
  };

  const handleSelectSample = (sample: string) => {
    onSendMessage(sample);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5 text-white">
                WelfareFlow AI 업무비서
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 border border-blue-400/30 font-semibold">
                  시설 데이터 질의응답
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                복지시설의 기록, 이상행동, 프로그램, 인수인계 데이터를 실시간 교차 분석합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Prompts (Prompt Section 7) */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
            <span>사회복지사 추천 질의 (클릭 시 즉시 질문):</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(q)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 hover:text-blue-600 transition shrink-0 shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F8FAFC]">
          {chatHistory.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                    WF
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                  }`}
                >
                  <pre className="font-sans whitespace-pre-wrap">{msg.text}</pre>
                  <div
                    className={`mt-1.5 text-[10px] text-right ${
                      isUser ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    나
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-bold animate-pulse">
                WF
              </div>
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-bl-none text-xs text-slate-600 shadow-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>시설 데이터를 검색하고 답변을 구성하고 있습니다...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="자연어로 질문하세요 (예: 이번 주 김○○의 주요 변화 알려줘)"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
