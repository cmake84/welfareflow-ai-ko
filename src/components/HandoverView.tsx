import React, { useState } from 'react';
import {
  Repeat,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Printer,
  Calendar,
  Layers,
} from 'lucide-react';
import { HandoverReport, HandoverResidentItem } from '../types';

interface HandoverViewProps {
  handover: HandoverReport;
  onUpdateHandover: (report: HandoverReport) => void;
}

export const HandoverView: React.FC<HandoverViewProps> = ({
  handover,
  onUpdateHandover,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSignConfirmed, setIsSignConfirmed] = useState(false);

  // AI Auto-Handover Generator (Section 11 Requirement)
  const handleAutoGenerateHandover = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftType: handover.shiftType,
          date: handover.date,
        }),
      });
      const data = await res.json();
      if (data && data.data) {
        onUpdateHandover({
          ...handover,
          ...data.data,
          status: 'REVIEWED',
        });
      }
    } catch (e) {
      console.error('Handover API error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSignConfirm = () => {
    onUpdateHandover({
      ...handover,
      status: 'CONFIRMED',
      toWorker: '김정숙 야간전담 생활지원사 (서명 완료)',
    });
    setIsSignConfirmed(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            인수인계 (Handover)
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              낮 동안의 모든 기록 자동 취합
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            생활기록, 상담, 투약, 이상행동을 AI가 교대 근무자를 위한 핵심 인수인계 보고서로 자동 요약합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="generate-handover-ai-btn"
            onClick={handleAutoGenerateHandover}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? '일일 기록 취합 및 요약 중...' : 'AI 인수인계 보고서 자동 취합 생성'}</span>
          </button>
        </div>
      </div>

      {/* Handover Report Document Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        {/* Meta Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              일자: {handover.date}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
              근무 교대: {handover.shiftType}
            </span>
            <span className="text-slate-500">인계자: <strong className="text-slate-900">{handover.fromWorker}</strong></span>
            <span className="text-slate-500">인수자: <strong className="text-slate-900">{handover.toWorker}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">문서 상태:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                handover.status === 'CONFIRMED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {handover.status === 'CONFIRMED' ? '상호 확인 및 서명완료' : '인수 대기 및 검토 필요'}
            </span>
          </div>
        </div>

        {/* 1. 오늘 주요 시설 사항 */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            1. 오늘 시설 주요 사항 (AI 요약)
          </h3>
          <ul className="list-disc list-inside space-y-1.5 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-800">
            {handover.todayKeyEvents.map((event, idx) => (
              <li key={idx} className="leading-relaxed">{event}</li>
            ))}
          </ul>
        </div>

        {/* 2. 이용인별 특이사항 (Priority Badges Section 11) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              2. 이용인별 야간/교대 특이사항 (중요도 표시)
            </h3>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-rose-700 font-bold">🔴 반드시 확인</span>
              <span className="flex items-center gap-1 text-amber-700 font-bold">🟡 확인 필요</span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">🟢 일반사항</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {handover.residentItems.map((item, idx) => {
              const borderClass =
                item.priority === 'HIGH'
                  ? 'border-rose-300 bg-rose-50/40'
                  : item.priority === 'MEDIUM'
                  ? 'border-amber-300 bg-amber-50/40'
                  : 'border-slate-200 bg-slate-50/60';

              const badgeColor =
                item.priority === 'HIGH'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : item.priority === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300';

              const priorityLabel =
                item.priority === 'HIGH'
                  ? '🔴 반드시 확인'
                  : item.priority === 'MEDIUM'
                  ? '🟡 확인 필요'
                  : '🟢 일반사항';

              return (
                <div key={idx} className={`p-4 rounded-xl border ${borderClass} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{item.residentName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {priorityLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
                    조치사항: {item.actionRequired}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. 내일 예정 사항 */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            3. 내일 예정 주요 일정
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {handover.tomorrowSchedule.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Sign-off Area */}
        <div className="p-4 bg-[#0F172A] text-white rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <div>
              <div className="font-bold text-xs sm:text-sm">교대 근무자 서명 및 확인</div>
              <div className="text-[11px] text-slate-400">
                인계받은 야간 전담 요원은 모든 특이사항과 긴급 환자를 확인한 후 서명합니다.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-white"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄</span>
            </button>
            <button
              id="confirm-handover-sign-btn"
              onClick={handleSignConfirm}
              disabled={handover.status === 'CONFIRMED'}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{handover.status === 'CONFIRMED' ? '서명 확인 완료됨' : '야간 근무자 전자 서명'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
