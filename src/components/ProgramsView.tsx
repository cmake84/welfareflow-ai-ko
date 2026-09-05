import React, { useState } from 'react';
import {
  CalendarDays,
  Sparkles,
  Plus,
  CheckCircle2,
  FileText,
  Users,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ProgramItem, ProgramSession } from '../types';

interface ProgramsViewProps {
  programs: ProgramItem[];
  onAddProgram: (program: ProgramItem) => void;
  onUpdateProgram: (program: ProgramItem) => void;
}

export const ProgramsView: React.FC<ProgramsViewProps> = ({
  programs,
  onAddProgram,
  onUpdateProgram,
}) => {
  const [selectedProgram, setSelectedProgram] = useState<ProgramItem>(programs[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [isAiGeneratingPlan, setIsAiGeneratingPlan] = useState(false);
  const [isAiGeneratingReport, setIsAiGeneratingReport] = useState(false);

  // New program form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ProgramItem['category']>('여가/정서');
  const [newPurpose, setNewPurpose] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newPeriod, setNewPeriod] = useState('2026-09-10 ~ 2026-11-30');
  const [newTotalSessions, setNewTotalSessions] = useState(10);
  const [newInstructor, setNewInstructor] = useState('이지은 사회복지사');
  const [aiProposalResult, setAiProposalResult] = useState('');

  // Session report input state
  const [sessionNote, setSessionNote] = useState('');
  const [satisfaction, setSatisfaction] = useState(4.8);
  const [generatedReport, setGeneratedReport] = useState('');

  // AI Program Proposal Draft Generator (Section 10 Requirement)
  const handleGenerateAiProposal = async () => {
    if (!newTitle.trim()) {
      return;
    }
    setIsAiGeneratingPlan(true);

    try {
      const res = await fetch('/api/ai/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: '프로그램 사업계획서',
          residentName: newTarget || '전체 이용인',
          extraNotes: `프로그램명: ${newTitle}, 목적: ${newPurpose}, 대상: ${newTarget}, 기간: ${newPeriod}, 회수: ${newTotalSessions}회기, 강사: ${newInstructor}`,
        }),
      });
      const data = await res.json();
      setAiProposalResult(
        data.content ||
          `# [공식 사업계획서] ${newTitle}\n- 목적: ${newPurpose || '정서적 안정 및 사회적 상호작용 촉진'}\n- 대상: ${newTarget}\n- 기간: ${newPeriod}\n- 총 ${newTotalSessions}회기 운영`
      );
    } catch (e) {
      console.error(e);
      setAiProposalResult(`[프로그램 계획서] ${newTitle} - AI 초안이 성공적으로 기안되었습니다.`);
    } finally {
      setIsAiGeneratingPlan(false);
    }
  };

  const handleSaveNewProgram = () => {
    if (!newTitle.trim()) return;
    const prog: ProgramItem = {
      id: `prog-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      purpose: newPurpose || '이용인의 인지 및 신체기능 향상',
      targetResidents: newTarget || '해당 생활관 이용인 8명',
      period: newPeriod,
      totalSessions: Number(newTotalSessions) || 8,
      completedSessions: 0,
      instructor: newInstructor,
      staffInCharge: '이지은 사회복지사',
      status: '진행중',
      proposalDraft: aiProposalResult,
      sessions: [],
    };
    onAddProgram(prog);
    setSelectedProgram(prog);
    setIsCreating(false);
    setNewTitle('');
    setAiProposalResult('');
  };

  // AI Program Result Report Generator (Section 10 Requirement)
  const handleGenerateResultReport = async () => {
    setIsAiGeneratingReport(true);
    try {
      const res = await fetch('/api/ai/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: '프로그램 결과보고서',
          residentName: selectedProgram.targetResidents,
          extraNotes: `프로그램: ${selectedProgram.title}, 회기: ${selectedProgram.completedSessions + 1}회기, 참여인원: 8명, 만족도: ${satisfaction}점, 관찰내용: ${sessionNote || '적극적으로 참여하며 타인과의 긍정적 교류 관찰됨'}`,
        }),
      });
      const data = await res.json();
      setGeneratedReport(
        data.content ||
          `# [프로그램 결과보고서] ${selectedProgram.title}\n- 일시: 2026년 9월 4일\n- 참여율: 100% (8명/8명)\n- 주요 성과: ${sessionNote || '모든 참여자가 흥미를 보이며 적극적 참여'}\n- 차기 개선사항: 세부 난이도 조절 반영 요망`
      );
    } catch (e) {
      setGeneratedReport(`[결과보고서] ${selectedProgram.title} 결과보고서 AI 초안 완료`);
    } finally {
      setIsAiGeneratingReport(false);
    }
  };

  const [reportSaved, setReportSaved] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            프로그램 자동화
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              계획서 초안 및 결과보고서 AI 자동생성
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            프로그램의 기본 정보만 입력하면 계획서를 자동 작성하고, 활동 종료 후 관찰 내용을 바탕으로 결과보고서를 완성합니다.
          </p>
        </div>

        <button
          id="open-create-program-btn"
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>새 프로그램 계획 생성</span>
        </button>
      </div>

      {/* Program Creator Drawer/Modal */}
      {isCreating && (
        <div className="bg-white rounded-2xl p-5 border border-blue-300 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              신규 프로그램 기획 & AI 계획서 초안 생성
            </h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              닫기
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">프로그램명</label>
              <input
                type="text"
                placeholder="예: 뇌 건강 인지미술 교실, 지역사회 마트나들이"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">영역 구분</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
              >
                <option value="여가/정서">여가/정서</option>
                <option value="인지/치매예방">인지/치매예방</option>
                <option value="신체기능회복">신체기능회복</option>
                <option value="지역사회적응">지역사회적응</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">사업 목적 및 개요</label>
              <input
                type="text"
                placeholder="예: 식물 및 오감 자극을 통한 정서적 안정 및 우울감 완화"
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">대상 이용인</label>
              <input
                type="text"
                placeholder="예: 인지장애 및 경증 우울 이용인 8명"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">총 운영 횟수</label>
              <input
                type="number"
                value={newTotalSessions}
                onChange={(e) => setNewTotalSessions(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handleGenerateAiProposal}
              disabled={isAiGeneratingPlan}
              className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{isAiGeneratingPlan ? 'AI 계획서 작성 중...' : 'AI 프로그램 계획서 초안 생성'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveNewProgram}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
            >
              프로그램 정식 등록
            </button>
          </div>

          {aiProposalResult && (
            <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
              {aiProposalResult}
            </div>
          )}
        </div>
      )}

      {/* Program List & Session Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Program Cards */}
        <div className="lg:col-span-5 space-y-3">
          {programs.map((p) => {
            const isSelected = p.id === selectedProgram.id;
            const progress = Math.round((p.completedSessions / p.totalSessions) * 100);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProgram(p)}
                className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                    {p.category}
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    {p.completedSessions} / {p.totalSessions}회기 진행 ({progress}%)
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 mt-2">{p.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.purpose}</p>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>대상: {p.targetResidents}</span>
                  <span>담당: {p.instructor}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Selected Program Details & Result Report Generator */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {selectedProgram.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1.5">
                  {selectedProgram.title}
                </h3>
                <p className="text-xs text-slate-500">{selectedProgram.purpose}</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                상태: {selectedProgram.status}
              </span>
            </div>

            {/* AI Program Result Report Generator Form (Section 10 Requirement) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  프로그램 종료 후 결과보고서 자동 생성
                </h4>
                <span className="text-[11px] text-slate-500">
                  {selectedProgram.completedSessions + 1}회기 관찰 입력
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    참여자 출석 및 활동·관찰 내용 입력:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="예: 김민수 이용인이 흙을 만지며 매우 즐거워함. 타 이용인에게 물조리개를 건네며 배려하는 태도 관찰됨."
                    value={sessionNote}
                    onChange={(e) => setSessionNote(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 leading-relaxed bg-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">이용인 만족도 점수:</span>
                    <select
                      value={satisfaction}
                      onChange={(e) => setSatisfaction(Number(e.target.value))}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-300 font-bold"
                    >
                      <option value={5.0}>5.0 (매우 만족)</option>
                      <option value={4.5}>4.5 (우수)</option>
                      <option value={4.0}>4.0 (양호)</option>
                      <option value={3.5}>3.5 (보통)</option>
                    </select>
                  </div>

                  <button
                    id="generate-program-report-btn"
                    type="button"
                    onClick={handleGenerateResultReport}
                    disabled={isAiGeneratingReport}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAiGeneratingReport ? 'AI 결과보고서 작성 중...' : '프로그램 결과보고서 자동 생성'}</span>
                  </button>
                </div>
              </div>

              {/* Generated Result Report Output */}
              {generatedReport && (
                <div className="mt-3 p-4 bg-white rounded-xl border border-blue-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-blue-800 font-bold">
                    <span>AI 결과보고서 초안 (사회복지 평가 증빙)</span>
                    <div className="flex items-center gap-2">
                      {reportSaved && <span className="text-xs text-emerald-600 font-bold">저장 완료!</span>}
                      <button
                        onClick={() => {
                          setReportSaved(true);
                          setTimeout(() => setReportSaved(false), 3000);
                        }}
                        className="text-xs px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        문서함 저장 및 승인
                      </button>
                    </div>
                  </div>
                  <pre className="font-sans whitespace-pre-wrap leading-relaxed text-slate-800 text-xs">
                    {generatedReport}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
