import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  Download,
  Users,
  Calendar,
} from 'lucide-react';
import { FacilityStats } from '../types';

interface StatsEvaluationViewProps {
  stats: FacilityStats;
}

export const StatsEvaluationView: React.FC<StatsEvaluationViewProps> = ({ stats }) => {
  const [auditMode, setAuditMode] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState(false);

  // Evaluation Preparation Mode (Section 13 Requirement)
  const handleRunAuditPrep = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setAuditMode(true);
    }, 1000);
  };

  const handleDownloadAudit = () => {
    setDownloadNotice(true);
    setTimeout(() => setDownloadNotice(false), 3000);
  };

  const auditItems = [
    { code: '평가A-1', title: '개별지원계획(ISP) 수립 및 분기별 점검', status: 'PASS', proof: '14명 전원 ISP 수립 완료 (이행률 100%)' },
    { code: '평가B-2', title: '일일 생활관찰 및 급식·복약 관리 기록', status: 'PASS', proof: '당월 누적 412건 기록 완료 (완료율 96%)' },
    { code: '평가C-3', title: '지역사회 적응 및 외부 문화체험 실적', status: 'PASS', proof: '당월 42회 실시 (보건복지부 기준 월 20회 초과 달성)' },
    { code: '평가D-4', title: '이상행동 및 위기관리 대응 체계', status: 'WARNING', proof: '이상행동 감지 2명에 대한 사례회의록 보완 요망' },
    { code: '평가E-5', title: '종사자 교대근무 인수인계 이행 여부', status: 'PASS', proof: '전자서명 완료율 100% (당일 누적 28건)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            통계 및 보건복지부 시설평가 대응
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              일일 기록의 자동 평가 지표화
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            현장에서 작성된 일상 기록이 자동으로 통계와 평가 지표로 누적되어 평가철마다 겪는 서류 야근을 방지합니다.
          </p>
        </div>

        {/* Audit Prep Button (Section 13) */}
        <button
          id="run-audit-prep-btn"
          onClick={handleRunAuditPrep}
          disabled={isAuditing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
        >
          <ShieldCheck className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? '평가 지표별 증빙 취합 중...' : '[원클릭] 보건복지부 평가자료 준비 모드'}</span>
        </button>
      </div>

      {/* Audit Readiness Banner (When triggered) */}
      {auditMode && (
        <div className="bg-[#0F172A] text-white rounded-2xl p-5 border border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  평가 준비 완료 (Ready for Inspection)
                </span>
                <span className="text-xs text-slate-400">종합 적합률: 94.8%</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                사회복지시설 평가지표별 자동 증빙 포트폴리오 생성 완료
              </h3>
              <p className="text-xs text-slate-400">
                12대 평가 기준에 맞춰 축적된 생활기록, 상담일지, 회의록, 출석부를 지표별로 자동 바인딩했습니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {downloadNotice && (
                <span className="text-xs text-emerald-400 font-bold">다운로드 시작!</span>
              )}
              <button
                onClick={handleDownloadAudit}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>증빙자료 전체 다운로드</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            {auditItems.map((item) => (
              <div
                key={item.code}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold font-mono text-[11px]">
                    {item.code}
                  </span>
                  <span className="font-semibold text-white">{item.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{item.proof}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      item.status === 'PASS'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {item.status === 'PASS' ? '적합 ✓' : '보완요망 ⚠'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Stat Cards (Section 13 exact counts) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">재원 이용인 현황</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {stats.totalResidents}명
            <span className="text-xs font-normal text-slate-500 ml-1.5">정원 15명</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 재원율 93.3%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">근무 종사자 현황</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {stats.totalStaff}명
            <span className="text-xs font-normal text-slate-500 ml-1.5">사회복지사·간호사</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-700 font-semibold flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> 1인당 담당 이용인 1.16명
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">지역사회 활동 실적</span>
          <div className="text-xl font-bold text-blue-600 mt-1">
            총 {stats.totalCommunityActivities}회
          </div>
          <div className="mt-2 text-[11px] text-blue-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> 전월 대비 +18% 증가
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">프로그램 운영 실적</span>
          <div className="text-xl font-bold text-blue-600 mt-1">
            총 {stats.totalProgramSessions}회
          </div>
          <div className="mt-2 text-[11px] text-blue-700 font-semibold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> 100% 계획 달성
          </div>
        </div>
      </div>

      {/* Completion Rates & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Completion Rates Bar */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">업무별 기록 완료율 현황</h3>
            <span className="text-xs text-slate-500 font-medium">2026년 9월 누적</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1 font-semibold text-slate-700">
                <span>생활기록 작성률</span>
                <span className="text-blue-600 font-bold">{stats.completionRates.livingRecord}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stats.completionRates.livingRecord}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-semibold text-slate-700">
                <span>상담기록 작성률</span>
                <span className="text-blue-600 font-bold">{stats.completionRates.counseling}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stats.completionRates.counseling}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-semibold text-slate-700">
                <span>프로그램 진행 및 결과보고율</span>
                <span className="text-blue-600 font-bold">{stats.completionRates.program}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stats.completionRates.program}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-semibold text-slate-700">
                <span>인수인계 작성 및 서명률</span>
                <span className="text-blue-600 font-bold">{stats.completionRates.handover}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stats.completionRates.handover}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Attention / Warning Alerts */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              업무 누락 방지 & 주의사항
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold">
              주의 2건
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="font-bold text-amber-900 block">
                미작성 기록: {stats.pendingRecordsCount}건
              </span>
              <p className="text-slate-600">
                이지훈 이용인 상담기록, 박영희 이용인 야간 투약 관찰기록 미승인 상태입니다.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
              <span className="font-bold text-rose-900 block">
                이상행동 증가 이용인: {stats.abnormalBehaviorAlertCount}명
              </span>
              <p className="text-slate-600">
                김민수 (야외산책 요구 급증), 최선자 (오후 불면 및 배회 빈도 증가)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
              💡 <strong>AI 자동 감사 팁</strong>: 매월 말일 미작성 건이 0건이 되도록 AI 알림이 담당 복지사에게 자동 푸시 발송됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
