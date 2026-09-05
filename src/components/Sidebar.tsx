import React from 'react';
import {
  CheckSquare,
  Users,
  FileEdit,
  HeartHandshake,
  CalendarDays,
  Repeat,
  FileText,
  BarChart3,
  Bot,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { NavMenu } from '../types';

interface SidebarProps {
  activeMenu: NavMenu;
  onSelectMenu: (menu: NavMenu) => void;
  pendingTasksCount: number;
  hasBehaviorAlert: boolean;
}

interface MenuItem {
  id: NavMenu;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeClass?: string;
  category: 'DAILY' | 'MANAGEMENT' | 'INSIGHTS';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  pendingTasksCount,
  hasBehaviorAlert,
}) => {
  const dailyItems: MenuItem[] = [
    {
      id: 'TODAY',
      label: '오늘의 업무',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : undefined,
      badgeClass: 'bg-amber-400/20 text-amber-300 border border-amber-400/30',
      category: 'DAILY',
    },
    {
      id: 'RESIDENTS',
      label: '이용인 관리',
      icon: Users,
      badge: hasBehaviorAlert ? '주의' : undefined,
      badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold',
      category: 'DAILY',
    },
    {
      id: 'RECORDS',
      label: '기록 관리',
      icon: FileEdit,
      category: 'DAILY',
    },
  ];

  const managementItems: MenuItem[] = [
    {
      id: 'CASE',
      label: '사례 관리',
      icon: HeartHandshake,
      category: 'MANAGEMENT',
    },
    {
      id: 'PROGRAMS',
      label: '프로그램',
      icon: CalendarDays,
      category: 'MANAGEMENT',
    },
    {
      id: 'HANDOVER',
      label: '인수인계',
      icon: Repeat,
      badge: '대기',
      badgeClass: 'bg-blue-400/20 text-blue-300 border border-blue-400/30',
      category: 'MANAGEMENT',
    },
    {
      id: 'STAFF',
      label: '직원 관리',
      icon: UserCheck,
      category: 'MANAGEMENT',
    },
  ];

  const insightsItems: MenuItem[] = [
    {
      id: 'DOCUMENTS',
      label: '문서·보고',
      icon: FileText,
      category: 'INSIGHTS',
    },
    {
      id: 'STATS',
      label: '통계 및 평가',
      icon: BarChart3,
      category: 'INSIGHTS',
    },
  ];

  const renderNavGroup = (title: string, items: MenuItem[]) => (
    <div className="space-y-1">
      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {title}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeMenu === item.id;
        return (
          <button
            key={item.id}
            id={`sidebar-menu-${item.id.toLowerCase()}`}
            onClick={() => onSelectMenu(item.id)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${item.badgeClass}`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="w-full lg:w-56 bg-[#0F172A] text-white flex flex-col shrink-0 lg:min-h-screen">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-sm shadow-blue-500/30">
          W
        </div>
        <div className="min-w-0">
          <span className="font-bold tracking-tight text-base text-white block truncate">
            WelfareFlow AI
          </span>
          <span className="text-[10px] text-blue-400 font-medium block">
            사회복지 자동화
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-x-auto lg:overflow-x-visible">
        {renderNavGroup('Daily', dailyItems)}
        {renderNavGroup('Management', managementItems)}
        {renderNavGroup('Insights', insightsItems)}

        {/* AI Assistant Special Card */}
        <div className="pt-1">
          <button
            id="sidebar-menu-ai-assistant"
            onClick={() => onSelectMenu('AI_ASSISTANT')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left font-bold ${
              activeMenu === 'AI_ASSISTANT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 border border-blue-400/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              <span>AI 업무비서</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold uppercase">
              Live
            </span>
          </button>
        </div>
      </nav>

      {/* User Profile Card at bottom */}
      <div className="p-4 border-t border-slate-800 mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            복지
          </div>
          <div className="text-xs min-w-0">
            <div className="font-semibold text-white truncate">이지은 사회복지사</div>
            <div className="text-slate-400 text-[11px] truncate">늘푸른 복지타운</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
