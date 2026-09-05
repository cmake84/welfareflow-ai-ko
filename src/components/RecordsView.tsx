import React, { useState } from 'react';
import {
  FileEdit,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Calendar,
  User,
  Clock,
  Filter,
  Trash2,
} from 'lucide-react';
import { WelfareRecord, Resident } from '../types';

interface RecordsViewProps {
  records: WelfareRecord[];
  residents: Resident[];
  onOpenRecordModal: (residentId?: string) => void;
  onDeleteRecord?: (id: string) => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  records,
  residents,
  onOpenRecordModal,
  onDeleteRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedResidentFilter, setSelectedResidentFilter] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<WelfareRecord | null>(records[0] || null);

  const filtered = records.filter((r) => {
    const matchMonth = selectedMonth === 'ALL' || r.date.startsWith(selectedMonth);
    const matchResident = selectedResidentFilter === 'ALL' || r.residentId === selectedResidentFilter;
    const matchSearch =
      r.residentName.includes(searchQuery) ||
      r.rawInput.includes(searchQuery) ||
      r.outputs.livingRecord.includes(searchQuery);
    return matchMonth && matchResident && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            AI 생활기록 관리 (One Input Multi Output)
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              총 {records.length}건 보관
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            현장에서 한 번 입력된 기록이 6개 업무 영역(생활기록, 개별지원, 행동변화, 인수인계, 사례관리, 통계)으로 자동 분해되어 저장됩니다.
          </p>
        </div>

        <button
          id="open-record-modal-from-list-btn"
          onClick={() => onOpenRecordModal()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>새 일일 기록 작성</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Records List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="이용인 이름, 기록 내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            />
          </div>

          {/* Month & Resident Filters */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>월별 조회</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                조회 결과: <strong className="text-blue-600 font-bold">{filtered.length}</strong>건
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'ALL', label: '전체' },
                { id: '2026-09', label: '26년 9월 (당월)' },
                { id: '2026-08', label: '26년 8월' },
                { id: '2026-07', label: '26년 7월' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMonth(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                    selectedMonth === m.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={selectedResidentFilter}
                onChange={(e) => setSelectedResidentFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
              >
                <option value="ALL">전체 이용인</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.roomNumber}호)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map((rec) => {
              const isSelected = rec.id === selectedRecord?.id;
              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{rec.residentName}</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {rec.date} {rec.time}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        rec.status === 'OFFICIAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.status === 'OFFICIAL' ? '공식 승인완료' : '초안 검토필요'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {rec.outputs.livingRecord}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>입력방식: {rec.inputMode === 'VOICE' ? '음성 (STT)' : rec.inputMode === 'CHECK' ? '간편체크' : '직접입력'}</span>
                    <span className="text-blue-600 font-medium hover:underline">6대 다각도 결과 →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Record Multi-Output Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedRecord ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              {/* Header Info */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedRecord.residentName} 이용인 일일 기록 상세
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {selectedRecord.date} {selectedRecord.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    담당 복지사: {selectedRecord.staffName} | 결재: {selectedRecord.approvedBy || '미승인'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {selectedRecord.status === 'OFFICIAL' ? '공식 기록 등록됨' : '검토 대기'}
                  </span>
                  {onDeleteRecord && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `'${selectedRecord.residentName}' 이용인의 ${selectedRecord.date} 기록을 삭제하시겠습니까?\n(웹 서버 및 로컬에 실시간 동기화되어 새로고침 시에도 유지됩니다)`
                          )
                        ) {
                          onDeleteRecord(selectedRecord.id);
                          setSelectedRecord(null);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="기록 삭제 (실시간 반영)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 1. Raw Input Text */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-700 block">원천 입력 내용 (One Input):</span>
                <p className="text-slate-800 leading-relaxed font-mono">{selectedRecord.rawInput}</p>
              </div>

              {/* 2. AI Decomposed 6 Outputs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  AI가 자동 파생한 6대 연계 업무 결과 (Multi Output)
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/80">
                    <span className="font-bold text-blue-900 block mb-1">① 생활기록부 서술 문장</span>
                    <p className="text-slate-800 leading-relaxed">{selectedRecord.outputs.livingRecord}</p>
                  </div>

                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/80">
                    <span className="font-bold text-blue-900 block mb-1">② 개별지원계획 (ISP) 연계</span>
                    <p className="text-slate-800 leading-relaxed">{selectedRecord.outputs.individualSupport}</p>
                  </div>

                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200/80">
                    <span className="font-bold text-purple-900 block mb-1">③ 행동·정서 변화 분석</span>
                    <p className="text-slate-800 leading-relaxed">{selectedRecord.outputs.behaviorEmotion}</p>
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-900">④ 교대 인수인계 전달사항</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                        우선순위: {selectedRecord.outputs.handoverPriority}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{selectedRecord.outputs.handover}</p>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/80">
                    <span className="font-bold text-indigo-900 block mb-1">⑤ 사례관리 데이터 (30일 욕구 누적)</span>
                    <p className="text-slate-800 leading-relaxed">{selectedRecord.outputs.caseManagementNeed}</p>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-900 block">⑥ 월간 통계 및 시설평가 실적 집계</span>
                      <span className="text-slate-700">집계 영역: {selectedRecord.outputs.monthlyStatsCategory}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs">
                      실적 +1 카운트
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-600 border border-slate-200">
              선택된 기록이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
