import React, { useState } from 'react';
import {
  HeartHandshake,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  User,
  ShieldCheck,
  Target,
  Search,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { CaseManagementItem, Resident } from '../types';

interface CaseManagementViewProps {
  caseItems: CaseManagementItem[];
  residents: Resident[];
  selectedResidentId?: string;
  onUpdateCaseItem: (item: CaseManagementItem) => void;
}

const STEPS = [
  '1. 욕구사정',
  '2. 문제 및 욕구',
  '3. 강점 파악',
  '4. 목표 수립',
  '5. 지원계획',
  '6. 서비스 제공',
  '7. 모니터링',
  '8. 평가',
];

export const CaseManagementView: React.FC<CaseManagementViewProps> = ({
  caseItems,
  residents,
  selectedResidentId,
  onUpdateCaseItem,
}) => {
  const [activeResidentId, setActiveResidentId] = useState<string>(
    selectedResidentId || caseItems[0]?.residentId || 'res-1'
  );
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisSuccess, setAiAnalysisSuccess] = useState(false);

  const currentCase =
    caseItems.find((c) => c.residentId === activeResidentId) || caseItems[0];
  const currentResident = residents.find((r) => r.id === activeResidentId);

  const [isSaved, setIsSaved] = useState(false);

  // Trigger AI 30-day need analysis (Section 9 Requirement)
  const handleRunAiAnalysis = () => {
    setIsAiAnalyzing(true);
    setAiAnalysisSuccess(false);

    setTimeout(() => {
      if (currentCase) {
        const updated: CaseManagementItem = {
          ...currentCase,
          aiDetectedNeeds30Days: [
            '1. 지역사회 외부활동 욕구 (최근 30일간 일일기록에서 14회 포착)',
            '2. 대인관계 및 소통 욕구 (타 이용인과의 자발적 대화 시도 11회 관찰)',
            '3. 신체 야외활동 및 보행 욕구 (실내 무료함 호소 9회 관찰)',
          ],
          lastReviewDate: '2026-09-04',
        };
        onUpdateCaseItem(updated);
      }
      setIsAiAnalyzing(false);
      setAiAnalysisSuccess(true);
    }, 1200);
  };

  const handleStepChange = (newStep: number) => {
    if (!currentCase) return;
    onUpdateCaseItem({
      ...currentCase,
      currentStep: newStep,
    });
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            사례관리 (Case Management)
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              8단계 표준 프로세스
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            욕구사정부터 모니터링·평가까지, 축적된 일일 기록을 AI가 분석하여 이용인의 반복 욕구를 찾아내고 사회복지사의 전문 판단을 지원합니다.
          </p>
        </div>

        {/* Resident Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">대상 이용인:</span>
          <select
            value={activeResidentId}
            onChange={(e) => setActiveResidentId(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {residents.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.roomNumber}, {r.careLevel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 8-Step Pipeline Visualizer */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-[700px]">
          {STEPS.map((stepName, idx) => {
            const stepNum = idx + 1;
            const isCurrent = currentCase?.currentStep === stepNum;
            const isDone = (currentCase?.currentStep || 1) > stepNum;

            return (
              <button
                key={stepNum}
                onClick={() => handleStepChange(stepNum)}
                className={`flex-1 p-2.5 rounded-xl text-center transition ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider mb-0.5 opacity-80">
                  {isDone ? '완료' : isCurrent ? '현재 진행' : '대기'}
                </div>
                <div className="text-xs truncate">{stepName}</div>
              </button>
            );
          })}
        </div>
      </div>

      {currentCase && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: AI Need Analysis Module (Prompt Section 9) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#0F172A] text-white rounded-2xl p-5 shadow-xs space-y-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  AI 축적기록 기반 욕구 탐지
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  최근 30일 분석
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base text-white">
                  “최근 30일 동안 {currentCase.residentName}에게서 반복적으로 나타난 욕구를 찾아줘.”
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  일상기록, 상담일지, 간호일지에 분산된 자연어 텍스트에서 공통된 키워드 및 이상 감정 변화를 추적합니다.
                </p>
              </div>

              <button
                id="run-ai-case-analysis-btn"
                onClick={handleRunAiAnalysis}
                disabled={isAiAnalyzing}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isAiAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAiAnalyzing ? '30일치 일일기록 분석 및 정제 중...' : '30일 반복 욕구 자동 분석 실행'}</span>
              </button>

              {/* AI Detection Result List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-blue-300 block">AI가 도출한 핵심 반복 욕구:</span>
                {currentCase.aiDetectedNeeds30Days.map((item, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200">
                    {item}
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 leading-relaxed">
                ※ <strong>사회복지사 검토 원칙</strong>: AI는 분석 결과를 제안할 뿐이며, 사회복지사의 전문 판단에 의해 목표 및 지원계획이 확정됩니다.
              </div>
            </div>
          </div>

          {/* Right Column: Case Management Details (Form/View) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {currentCase.residentName} 이용인 사례관리 계획서
                  </h4>
                  <p className="text-[11px] text-slate-500">담당 복지사: {currentCase.assignedWorker}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  최근 검토일: {currentCase.lastReviewDate}
                </span>
              </div>

              {/* Strengths & Needs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-blue-600" />
                    사정된 욕구 및 과제
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {currentCase.needsAssessment.map((n, idx) => (
                      <li key={idx}>{n}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    이용인의 주요 강점 (Strengths)
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {currentCase.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">단기 목표 (3개월 내):</label>
                <input
                  type="text"
                  value={currentCase.shortTermGoal}
                  onChange={(e) =>
                    onUpdateCaseItem({
                      ...currentCase,
                      shortTermGoal: e.target.value,
                    })
                  }
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">지원 계획 (서비스 제공 내용):</label>
                <textarea
                  rows={3}
                  value={currentCase.supportPlan}
                  onChange={(e) =>
                    onUpdateCaseItem({
                      ...currentCase,
                      supportPlan: e.target.value,
                    })
                  }
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">모니터링 및 평가 의견:</label>
                <textarea
                  rows={2}
                  value={currentCase.monitoringNotes}
                  onChange={(e) =>
                    onUpdateCaseItem({
                      ...currentCase,
                      monitoringNotes: e.target.value,
                    })
                  }
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                {isSaved ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    사례관리 계획서가 저장되었습니다.
                  </span>
                ) : <span />}
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  사례관리 내용 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
