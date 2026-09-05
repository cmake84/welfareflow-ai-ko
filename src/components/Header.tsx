import React from 'react';
import {
  Sparkles,
  PlusCircle,
  Shield,
  Bell,
  ChevronDown,
  Cloud,
} from 'lucide-react';
import { UserRole, NavMenu } from '../types';

interface HeaderProps {
  activeMenu: NavMenu;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenRecordModal: () => void;
  onOpenAiAssistant: () => void;
  onNavigateToRecords?: () => void;
  onOpenGoogleDriveModal?: () => void;
  isGoogleDriveConnected?: boolean;
  googleUserEmail?: string | null;
  lastDriveSyncTime?: string | null;
  isDriveSyncing?: boolean;
  isSharedDriveMode?: boolean;
}

const MENU_TITLES: Record<NavMenu, string> = {
  TODAY: '오늘의 업무',
  RESIDENTS: '이용인 관리',
  RECORDS: '기록 관리',
  CASE: '사례 관리',
  PROGRAMS: '프로그램',
  HANDOVER: '인수인계',
  STAFF: '직원 관리',
  DOCUMENTS: '문서·보고',
  STATS: '통계 및 평가',
  AI_ASSISTANT: 'AI 업무비서',
};

const ROLE_LABELS: Record<UserRole, { title: string; badge: string; desc: string }> = {
  DIRECTOR: { title: '시설장 (정원호)', badge: 'bg-indigo-600 text-white', desc: '전체 데이터 조회 및 최종 승인 권한' },
  ADMIN: { title: '관리자 (김철수)', badge: 'bg-blue-700 text-white', desc: '직원·업무·문서 관리' },
  SOCIAL_WORKER: { title: '사회복지사 (이지은)', badge: 'bg-blue-600 text-white', desc: '담당 이용인 기록 및 사례관리' },
  CARE_WORKER: { title: '생활지원원 (김정숙)', badge: 'bg-amber-600 text-white', desc: '생활기록 및 인수인계' },
  NURSE: { title: '간호사 (강수연)', badge: 'bg-rose-600 text-white', desc: '건강 및 바이탈 기록' },
  VIEWER: { title: '조회 전용 (평가관)', badge: 'bg-slate-600 text-white', desc: '필요 자료 열람' },
};

export const Header: React.FC<HeaderProps> = ({
  activeMenu,
  currentRole,
  onRoleChange,
  onOpenRecordModal,
  onOpenAiAssistant,
  onNavigateToRecords,
  onOpenGoogleDriveModal,
  isGoogleDriveConnected = false,
  googleUserEmail,
  lastDriveSyncTime,
  isDriveSyncing = false,
  isSharedDriveMode = false,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shrink-0 transition-colors z-20">
      {/* Title & Date */}
      <div className="flex items-center gap-3 sm:gap-4">
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <span>{MENU_TITLES[activeMenu] || '오늘의 업무'}</span>
          {isSharedDriveMode && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold border border-indigo-200">
              공유 열람 중
            </span>
          )}
        </h1>
        <span className="text-slate-500 text-xs sm:text-sm font-medium">
          2026.09.04 금요일
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-Time Persistence Badge */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold select-none"
          title="모든 수정사항이 웹 서버 및 로컬에 실시간 자동 저장되어 페이지를 새로고침하더라도 100% 안전하게 유지됩니다."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px]">실시간 저장됨</span>
        </div>

        {/* Google Drive Web Cloud Sync Button */}
        <button
          id="header-google-drive-btn"
          type="button"
          onClick={onOpenGoogleDriveModal}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
            isGoogleDriveConnected
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
          }`}
          title={
            isGoogleDriveConnected
              ? `구글 드라이브 연동됨 (${googleUserEmail || ''})`
              : '구글 드라이브 웹 클라우드 저장 및 백업 연동'
          }
        >
          <Cloud
            className={`w-3.5 h-3.5 ${
              isGoogleDriveConnected ? 'text-emerald-600' : 'text-blue-600'
            } ${isDriveSyncing ? 'animate-bounce' : ''}`}
          />
          <span className="hidden md:inline">
            {isGoogleDriveConnected ? '드라이브 연동' : '구글 드라이브 저장'}
          </span>
          {isGoogleDriveConnected ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <span className="hidden sm:inline text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded">
              웹 저장
            </span>
          )}
        </button>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] text-white flex items-center justify-center rounded-full border-2 border-white font-bold leading-none">
            3
          </span>
          <button
            aria-label="알림"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Record Submission Status Button */}
        <button
          onClick={onNavigateToRecords}
          className="hidden md:inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
        >
          <span>기록 제출 현황</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </button>

        {/* RBAC Role Selector Dropdown */}
        <div className="relative group">
          <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium cursor-pointer transition">
            <Shield className="w-3.5 h-3.5 text-slate-700" />
            <span className="text-slate-800 hidden lg:inline">권한:</span>
            <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${ROLE_LABELS[currentRole].badge}`}>
              {ROLE_LABELS[currentRole].title.split(' ')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <select
            aria-label="사용자 권한 변경"
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          >
            {Object.entries(ROLE_LABELS).map(([key, item]) => (
              <option key={key} value={key}>
                {item.title} - {item.desc}
              </option>
            ))}
          </select>
        </div>

        {/* AI Assistant Quick Trigger */}
        <button
          id="header-ai-assistant-btn"
          onClick={onOpenAiAssistant}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>AI 비서</span>
        </button>

        {/* Primary Action Button: High Density Blue */}
        <button
          id="header-quick-record-btn"
          onClick={onOpenRecordModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">새 일일 기록 작성</span>
          <span className="sm:hidden">기록 작성</span>
        </button>
      </div>
    </header>
  );
};
