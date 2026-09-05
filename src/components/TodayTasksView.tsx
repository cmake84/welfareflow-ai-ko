import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  FileEdit,
  Mic,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Search,
  Eye,
  X,
  Archive,
  FolderKanban,
  CheckCheck,
  CalendarDays,
} from 'lucide-react';
import { DailyTask, MonthlyTask, WelfareRecord, Resident, NavMenu } from '../types';

interface TodayTasksViewProps {
  tasks: DailyTask[];
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, category: DailyTask['category']) => void;
  onDeleteTask?: (id: string) => void;
  onClearCompletedTasks?: () => void;
  monthlyTasks?: MonthlyTask[];
  onToggleMonthlyTask?: (id: string) => void;
  onAddMonthlyTask?: (task: Omit<MonthlyTask, 'id'>) => void;
  onDeleteMonthlyTask?: (id: string) => void;
  records: WelfareRecord[];
  onNavigate: (menu: NavMenu, residentId?: string) => void;
  onOpenRecordModalWithResident: (residentId: string, initialText?: string) => void;
  residents: Resident[];
}

export const TodayTasksView: React.FC<TodayTasksViewProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onClearCompletedTasks,
  monthlyTasks = [],
  onToggleMonthlyTask,
  onAddMonthlyTask,
  onDeleteMonthlyTask,
  records,
  onNavigate,
  onOpenRecordModalWithResident,
  residents,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<DailyTask['category']>('기록');
  const [isAdding, setIsAdding] = useState(false);
  const [quickInputText, setQuickInputText] = useState('');

  // Monthly management state
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [monthlyTab, setMonthlyTab] = useState<'TASKS' | 'RECORDS'>('TASKS');
  const [isAddingMonthlyTask, setIsAddingMonthlyTask] = useState(false);
  const [newMonthlyTitle, setNewMonthlyTitle] = useState('');
  const [newMonthlyCategory, setNewMonthlyCategory] = useState<MonthlyTask['category']>('사례관리');
  const [newMonthlyDueDate, setNewMonthlyDueDate] = useState('2026-09-30');
  const [monthlyRecordResidentFilter, setMonthlyRecordResidentFilter] = useState('ALL');
  const [monthlyRecordSearch, setMonthlyRecordSearch] = useState('');
  const [inspectingRecord, setInspectingRecord] = useState<WelfareRecord | null>(null);

  // Live real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const completedCount = tasks.filter((t) => t.completed).length;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim(), newTaskCategory);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const handleCreateMonthlyTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthlyTitle.trim()) return;
    onAddMonthlyTask?.({
      month: selectedMonth,
      title: newMonthlyTitle.trim(),
      category: newMonthlyCategory,
      completed: false,
      assignedTo: '이지은 사회복지사',
      dueDate: newMonthlyDueDate,
    });
    setNewMonthlyTitle('');
    setIsAddingMonthlyTask(false);
  };

  const handleQuickSubmit = () => {
    onOpenRecordModalWithResident('res-1', quickInputText);
  };

  const handleInsertTemplate = () => {
    setQuickInputText('김민수 이용인 오전 10:30 솔샘공원 산책 지원. 보행 보조기구 이용하여 30분간 안정적으로 걸으셨으며 날씨가 좋아 기분 매우 상쾌하다고 표현함.');
  };

  // Month navigation
  const availableMonths = ['2026-09', '2026-08', '2026-07'];
  const monthLabels: Record<string, string> = {
    '2026-09': '2026년 9월 (당월)',
    '2026-08': '2026년 8월 (전월)',
    '2026-07': '2026년 7월 (전전월)',
  };

  const handlePrevMonth = () => {
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[idx + 1]);
    }
  };

  const handleNextMonth = () => {
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx > 0) {
      setSelectedMonth(availableMonths[idx - 1]);
    }
  };

  // Current month tasks & records calculation
  const currentMonthlyTasks = monthlyTasks.filter((m) => m.month === selectedMonth);
  const monthlyCompletedCount = currentMonthlyTasks.filter((m) => m.completed).length;
  const monthlyProgressPercent = Math.round(
    (monthlyCompletedCount / (currentMonthlyTasks.length || 1)) * 100
  );

  const currentMonthlyRecords = records.filter((r) => r.date.startsWith(selectedMonth));
  const filteredMonthlyRecords = currentMonthlyRecords.filter((r) => {
    const matchResident =
      monthlyRecordResidentFilter === 'ALL' || r.residentId === monthlyRecordResidentFilter;
    const matchSearch =
      !monthlyRecordSearch ||
      r.residentName.includes(monthlyRecordSearch) ||
      r.rawInput.includes(monthlyRecordSearch) ||
      r.outputs.livingRecord.includes(monthlyRecordSearch);
    return matchResident && matchSearch;
  });

  // Status mapping from prompt & design
  const recordStatusList = [
    {
      residentId: 'res-1',
      name: '김○○ 생활기록',
      detailName: '김민수 이용인',
      type: '생활기록',
      status: 'DONE',
      note: '오전 산책 기록 승인 완료',
    },
    {
      residentId: 'res-2',
      name: '박○○ 프로그램 결과',
      detailName: '박영희 이용인',
      type: '프로그램',
      status: 'DONE',
      note: '원예치료 교실 6회기 참여 완료',
    },
    {
      residentId: 'res-3',
      name: '이○○ 상담 일지',
      detailName: '이지훈 이용인',
      type: '상담 일지',
      status: 'PENDING',
      note: '저녁 식사량 소폭 감소 및 가족 통화',
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column (5 cols on xl, 4 cols on lg): Daily Checklist, Monthly Management, AI Smart Insight */}
      <section className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
        {/* 1. Daily Checklist Card */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <CheckSquareIcon className="w-4 h-4 text-blue-600" />
                <span>데일리 체크리스트</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-normal">오늘 할 일</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-600 font-bold">
                {completedCount}/{tasks.length} 완료
              </span>

              {/* 완료 항목 일괄 삭제 버튼 */}
              {completedCount > 0 && onClearCompletedTasks && (
                <button
                  type="button"
                  onClick={onClearCompletedTasks}
                  title="완료된 할 일 일괄 삭제"
                  className="px-2 py-0.5 text-[11px] rounded bg-red-50 hover:bg-red-100 text-red-600 font-medium flex items-center gap-1 transition active:scale-95"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>완료 정리</span>
                </button>
              )}

              <button
                onClick={() => setIsAdding(!isAdding)}
                aria-label="할 일 추가"
                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Add Form */}
          {isAdding && (
            <form
              onSubmit={handleCreateTask}
              className="p-3 border-b border-slate-100 bg-slate-50/80 space-y-2"
            >
              <input
                type="text"
                placeholder="새로운 할 일을 입력하세요..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1">
                  {(['일정', '기록', '프로그램', '인수인계'] as const).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setNewTaskCategory(cat)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition ${
                        newTaskCategory === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 px-1.5 py-0.5"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="text-[11px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded hover:bg-blue-700"
                  >
                    추가
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tasks items list with deletion */}
          <div className="p-3 space-y-2 overflow-y-auto max-h-[280px]">
            {tasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                등록된 데일리 할 일이 없습니다.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition cursor-pointer group ${
                    task.completed
                      ? 'bg-slate-50 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => onToggleTask(task.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 mt-0.5 accent-blue-600 cursor-pointer rounded shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`block leading-snug transition truncate ${
                          task.completed
                            ? 'text-slate-400 line-through'
                            : 'text-slate-800 font-medium group-hover:text-blue-600'
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-500">{task.category}</span>
                        <span>•</span>
                        <span>{task.dueDate.split(' ')[1] || '오늘'}</span>
                        <span>•</span>
                        <span>{task.assignedTo.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Delete Button */}
                  {onDeleteTask && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask(task.id);
                      }}
                      title="할 일 삭제"
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition shrink-0 ml-1 opacity-60 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Monthly Management Card (데일리 항목 바로 아래 추가) */}
        <div className="bg-white rounded-xl shadow-xs border border-blue-200/70 flex flex-col overflow-hidden">
          {/* Header with Month Switcher */}
          <div className="p-3.5 border-b border-slate-100 bg-linear-to-r from-blue-50/70 to-indigo-50/50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-700" />
                <h2 className="font-bold text-slate-800 text-sm">월간 정기 관리</h2>
              </div>

              {/* Month Selector Switcher */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={availableMonths.indexOf(selectedMonth) >= availableMonths.length - 1}
                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100 transition"
                  title="이전 달"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-slate-800 px-1 font-mono">
                  {selectedMonth.replace('-', '.')}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={availableMonths.indexOf(selectedMonth) <= 0}
                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100 transition"
                  title="다음 달"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sub Tabs: 월간 과업 vs 월간 저장 기록 조회 */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setMonthlyTab('TASKS')}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                    monthlyTab === 'TASKS'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>월간 과업</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">
                    {currentMonthlyTasks.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyTab('RECORDS')}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                    monthlyTab === 'RECORDS'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Archive className="w-3 h-3" />
                  <span>월간 기록 조회</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                    {currentMonthlyRecords.length}
                  </span>
                </button>
              </div>

              {monthlyTab === 'TASKS' && (
                <button
                  type="button"
                  onClick={() => setIsAddingMonthlyTask(!isAddingMonthlyTask)}
                  className="p-1 text-blue-600 hover:bg-blue-100/50 rounded transition text-[11px] font-bold flex items-center gap-0.5"
                  title="새 월간 항목 추가"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>추가</span>
                </button>
              )}
            </div>

            {/* Progress indicator when on tasks tab */}
            {monthlyTab === 'TASKS' && (
              <div className="space-y-1 pt-0.5">
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                  <span>
                    {monthLabels[selectedMonth] || selectedMonth} 진행률 (
                    {monthlyCompletedCount}/{currentMonthlyTasks.length})
                  </span>
                  <span className="font-bold text-blue-700">{monthlyProgressPercent}%</span>
                </div>
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${monthlyProgressPercent}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Monthly Task Form */}
          {monthlyTab === 'TASKS' && isAddingMonthlyTask && (
            <form
              onSubmit={handleCreateMonthlyTask}
              className="p-3 border-b border-slate-100 bg-blue-50/40 space-y-2"
            >
              <input
                type="text"
                placeholder="월간 정기 항목명 (예: 식단표 점검, 정기 소방훈련)..."
                value={newMonthlyTitle}
                onChange={(e) => setNewMonthlyTitle(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1 flex-wrap">
                  {(['사례관리', '안전/시설', '보호자소통', '급여제공계획', '행정/마감', '프로그램'] as const).map(
                    (cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setNewMonthlyCategory(cat)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition ${
                          newMonthlyCategory === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsAddingMonthlyTask(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 px-1.5 py-0.5"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="text-[11px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded hover:bg-blue-700"
                  >
                    등록
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 1: Monthly Tasks List */}
          {monthlyTab === 'TASKS' && (
            <div className="p-3 space-y-2 overflow-y-auto max-h-[300px]">
              {currentMonthlyTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  해당 월의 월간 관리 항목이 없습니다.
                </div>
              ) : (
                currentMonthlyTasks.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onToggleMonthlyTask?.(item.id)}
                    className={`flex items-start justify-between p-2 rounded-lg border text-xs transition cursor-pointer group ${
                      item.completed
                        ? 'bg-slate-50 border-slate-200 text-slate-400'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => onToggleMonthlyTask?.(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 mt-0.5 accent-blue-600 cursor-pointer rounded shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span
                          className={`block leading-snug transition ${
                            item.completed
                              ? 'text-slate-400 line-through'
                              : 'text-slate-800 font-medium group-hover:text-blue-700'
                          }`}
                        >
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                          <span
                            className={`px-1.5 py-0.2 rounded font-medium ${
                              item.category === '사례관리'
                                ? 'bg-purple-100 text-purple-700'
                                : item.category === '안전/시설'
                                ? 'bg-amber-100 text-amber-700'
                                : item.category === '보호자소통'
                                ? 'bg-emerald-100 text-emerald-700'
                                : item.category === '급여제공계획'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.category}
                          </span>
                          <span>•</span>
                          <span>기한: {item.dueDate.slice(5)}</span>
                          {item.targetCount && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-blue-600 font-semibold">
                                {item.currentCount || 0}/{item.targetCount}건
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {onDeleteMonthlyTask && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMonthlyTask(item.id);
                        }}
                        title="월간 항목 삭제"
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition shrink-0 ml-1 opacity-60 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Monthly Records Viewer (이전에 저장한 기록들도 월간에서 조회가 가능하도록) */}
          {monthlyTab === 'RECORDS' && (
            <div className="p-3 space-y-2.5">
              {/* Resident filter & Search bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <select
                    value={monthlyRecordResidentFilter}
                    onChange={(e) => setMonthlyRecordResidentFilter(e.target.value)}
                    className="text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0 font-medium"
                  >
                    <option value="ALL">전체 이용인 ({currentMonthlyRecords.length}건)</option>
                    {residents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} 이용인
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                    <input
                      type="text"
                      placeholder="내용 검색..."
                      value={monthlyRecordSearch}
                      onChange={(e) => setMonthlyRecordSearch(e.target.value)}
                      className="w-full text-[11px] pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                  <span>
                    총 <strong>{filteredMonthlyRecords.length}</strong>개의 기록 보관 중
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('RECORDS')}
                    className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                  >
                    기록 관리 탭 전체보기 →
                  </button>
                </div>
              </div>

              {/* Records List for Selected Month */}
              <div className="space-y-2 overflow-y-auto max-h-[250px] pr-0.5">
                {filteredMonthlyRecords.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                    선택한 조건의 저장된 기록이 없습니다.
                  </div>
                ) : (
                  filteredMonthlyRecords.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => setInspectingRecord(rec)}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50/50 hover:border-blue-300 transition cursor-pointer text-left group shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                            {rec.residentName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {rec.date.slice(5)} {rec.time}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            rec.status === 'OFFICIAL'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec.status === 'OFFICIAL' ? '공식 승인' : '초안'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {rec.outputs.livingRecord || rec.rawInput}
                      </p>

                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>담당: {rec.staffName.split(' ')[0]}</span>
                        <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
                          <span>6대 연계결과 열기</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. AI Smart Insight Callout Card */}
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg leading-none">⚠️</span>
            <h3 className="font-bold text-amber-900 text-xs uppercase tracking-wide">
              AI Smart Insight
            </h3>
          </div>
          <p className="text-sm text-amber-900 leading-relaxed">
            김○○ 이용인의 최근 7일간 기록 분석 결과,{' '}
            <strong className="font-bold text-amber-950">야외 산책 욕구 및 수면 민감도</strong> 빈도가
            전주 대비 35% 증가했습니다.
            <br />
            <br />
            <button
              id="recommendation-case-review-btn"
              onClick={() => onNavigate('CASE', 'res-1')}
              className="text-xs font-semibold text-amber-900 underline hover:text-amber-950 cursor-pointer transition text-left"
            >
              → 사례관리 검토하기
            </button>
          </p>
        </div>
      </section>

      {/* Right Column (7 cols on xl, 8 cols on lg): AI Quick Input & Dashboard */}
      <section className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
        {/* 1. 간편 AI 기록 입력 (One Input Quick Bar) */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <span>✍️</span> 간편 AI 기록 입력
              </h2>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span>실시간 시각: {currentTime.toTimeString().slice(0, 8)}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleInsertTemplate}
                className="text-xs px-3 py-1 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-700 font-medium transition"
              >
                🎤 음성 입력
              </button>
              <button
                type="button"
                onClick={handleInsertTemplate}
                className="text-xs px-3 py-1 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-700 font-medium transition"
              >
                📋 템플릿
              </button>
            </div>
          </div>

          <textarea
            value={quickInputText}
            onChange={(e) => setQuickInputText(e.target.value)}
            className="w-full h-24 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
            placeholder="이용인의 활동이나 변화를 자유롭게 입력하세요. AI가 자동으로 생활기록, 개별지원, 행동변화, 인수인계, 사례관리, 통계 실적으로 분해 문서화합니다..."
          ></textarea>

          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <p className="text-[11px] text-slate-500">
              입력된 내용은 자동으로 생활기록, 상담, 인수인계 등 6개 업무 영역에 분해 매핑됩니다.
            </p>
            <button
              id="quick-ai-submit-btn"
              onClick={handleQuickSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-95 shrink-0"
            >
              AI 기록 생성 및 자동 매핑
            </button>
          </div>
        </div>

        {/* 2. Bottom Grid: 최근 기록 처리 현황 & 시설 운영 Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 최근 기록 처리 현황 */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
                최근 기록 처리 현황
              </h3>
              <button
                onClick={() => onNavigate('RECORDS')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                전체보기 →
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {recordStatusList.map((item) => (
                <div
                  key={item.residentId}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition ${
                    item.status === 'DONE'
                      ? 'bg-emerald-50/70 border-emerald-100'
                      : 'bg-orange-50/70 border-orange-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        item.status === 'DONE' ? 'bg-emerald-500' : 'bg-orange-400'
                      }`}
                    ></div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-slate-800 block truncate">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {item.note}
                      </span>
                    </div>
                  </div>

                  {item.status === 'DONE' ? (
                    <span className="text-[10px] bg-white text-emerald-600 px-2 py-0.5 rounded border border-emerald-200 font-bold shrink-0">
                      완료
                    </span>
                  ) : (
                    <button
                      onClick={() => onOpenRecordModalWithResident(item.residentId)}
                      className="text-[10px] bg-white text-orange-600 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200 font-bold shrink-0 transition"
                    >
                      작성 필요
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 시설 운영 Dashboard */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-4">
              시설 운영 Dashboard
            </h3>

            <div className="space-y-4">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-500">기록 작성률 (전 직원)</span>
                  <span className="text-blue-600 font-bold">88%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: '88%' }}
                  ></div>
                </div>
              </div>

              {/* Stat Counters */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    미작성 문서
                  </div>
                  <div className="text-2xl font-black text-slate-800 mt-0.5">
                    12<span className="text-xs font-normal text-slate-500 ml-1">건</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    주의 대상자
                  </div>
                  <div className="text-2xl font-black text-red-500 mt-0.5">
                    03<span className="text-xs font-normal text-slate-500 ml-1">명</span>
                  </div>
                </div>
              </div>

              {/* AI Summary Quote */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-[11px] text-blue-700 italic leading-relaxed">
                &ldquo;AI 요약: 금일 식사 섭취율이 전반적으로 양호하며, 오전 산책 활동 인원이 평소보다 많습니다.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Record Detail Modal (월간 저장 기록 상세 팝업) */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">
                  {inspectingRecord.residentName} 이용인 기록 상세
                </span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-medium">
                  {inspectingRecord.date} {inspectingRecord.time}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    inspectingRecord.status === 'OFFICIAL'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {inspectingRecord.status === 'OFFICIAL' ? '공식 승인완료' : '검토중'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">원천 관찰 입력:</span>
                <p className="text-slate-800 leading-relaxed font-mono">
                  {inspectingRecord.rawInput}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>AI 분해 6대 연계 업무 결과</span>
                </h4>

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                  <span className="font-bold text-blue-900 block mb-1">① 생활기록부 서술 문장</span>
                  <p className="text-slate-800 leading-relaxed">
                    {inspectingRecord.outputs.livingRecord}
                  </p>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                  <span className="font-bold text-blue-900 block mb-1">② 개별지원계획 (ISP) 연계</span>
                  <p className="text-slate-800 leading-relaxed">
                    {inspectingRecord.outputs.individualSupport}
                  </p>
                </div>

                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200">
                  <span className="font-bold text-purple-900 block mb-1">③ 행동 및 정서 변화 분석</span>
                  <p className="text-slate-800 leading-relaxed">
                    {inspectingRecord.outputs.behaviorEmotion}
                  </p>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-amber-900">④ 교대 인수인계 전달사항</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                      우선순위: {inspectingRecord.outputs.handoverPriority}
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">
                    {inspectingRecord.outputs.handover}
                  </p>
                </div>

                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
                  <span className="font-bold text-indigo-900 block mb-1">⑤ 사례관리 데이터 (30일 욕구 누적)</span>
                  <p className="text-slate-800 leading-relaxed">
                    {inspectingRecord.outputs.caseManagementNeed}
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-900 block">⑥ 월간 통계 실적 집계</span>
                    <span className="text-slate-700">영역: {inspectingRecord.outputs.monthlyStatsCategory}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                    실적 집계 완료
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                작성자: {inspectingRecord.staffName} | 결재: {inspectingRecord.approvedBy || '미승인'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInspectingRecord(null);
                    onNavigate('RECORDS');
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
                >
                  생활기록 전체 관리에서 보기
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingRecord(null)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal icon component helper
function CheckSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
