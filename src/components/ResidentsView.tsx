import React, { useState } from 'react';
import {
  Search,
  User,
  Activity,
  Calendar,
  Phone,
  FileText,
  AlertCircle,
  PlusCircle,
  ChevronRight,
  Heart,
  TrendingUp,
  ShieldAlert,
  Clock,
  CheckCircle,
  Edit3,
  UserPlus,
  RotateCcw,
  Check,
  Cloud,
} from 'lucide-react';
import { Resident, TimelineEvent, WelfareRecord } from '../types';
import { ResidentFormModal } from './ResidentFormModal';

interface ResidentsViewProps {
  residents: Resident[];
  timeline: TimelineEvent[];
  records: WelfareRecord[];
  selectedResidentId?: string;
  onSelectResident: (id: string) => void;
  onOpenRecordForResident: (residentId: string) => void;
  onUpdateResident?: (updated: Resident) => void;
  onAddResident?: (newResident: Resident) => void;
  onResetResidents?: () => void;
  onOpenGoogleDriveModal?: () => void;
  isGoogleDriveConnected?: boolean;
  isDriveSyncing?: boolean;
}

export const ResidentsView: React.FC<ResidentsViewProps> = ({
  residents,
  timeline,
  records,
  selectedResidentId,
  onSelectResident,
  onOpenRecordForResident,
  onUpdateResident,
  onAddResident,
  onResetResidents,
  onOpenGoogleDriveModal,
  isGoogleDriveConnected = false,
  isDriveSyncing = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'TIMELINE' | 'INFO' | 'HEALTH' | 'RECORDS' | 'BEHAVIOR' | 'DOCS'
  >('TIMELINE');

  // Resident Form Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [targetResidentForEdit, setTargetResidentForEdit] = useState<Resident | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const activeResident =
    residents.find((r) => r.id === selectedResidentId) || residents[0];

  const handleOpenCreateModal = () => {
    setFormModalMode('CREATE');
    setTargetResidentForEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (res: Resident) => {
    // Always obtain the freshest instance from current residents state
    const fresh = residents.find((r) => r.id === res.id) || res;
    setFormModalMode('EDIT');
    setTargetResidentForEdit(fresh);
    setIsFormModalOpen(true);
  };

  const handleSaveResidentForm = (resident: Resident) => {
    if (formModalMode === 'CREATE') {
      if (onAddResident) {
        onAddResident(resident);
      }
      onSelectResident(resident.id);
      showToast(`'${resident.name}' 이용인이 신규 등록되고 실시간 저장되었습니다.`);
    } else {
      if (onUpdateResident) {
        onUpdateResident(resident);
      }
      onSelectResident(resident.id);
      showToast(`'${resident.name}' 이용인 정보 수정사항이 실시간 저장되었습니다.`);
    }
    setTargetResidentForEdit(null);
    setIsFormModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setTargetResidentForEdit(null);
  };

  const filteredResidents = residents.filter(
    (r) =>
      r.name.includes(searchQuery) ||
      r.roomNumber.includes(searchQuery) ||
      r.careLevel.includes(searchQuery)
  );

  const residentTimeline = timeline.filter(
    (t) => t.residentId === activeResident?.id
  );

  const residentRecords = records.filter(
    (r) => r.residentId === activeResident?.id
  );

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            이용인 관리
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              총 {residents.length}명 재원
            </span>
          </h2>
          <p className="text-xs text-slate-600">
            이용인을 선택하면 기본 정보부터 시계열 타임라인, 일일 기록, 사례관리 내역을 한 화면에서 종합 조회하고 수정·추가할 수 있습니다.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Real-time local sync status badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>로컬 실시간 저장됨</span>
          </div>

          {/* Google Drive Web Sync Button */}
          {onOpenGoogleDriveModal && (
            <button
              type="button"
              onClick={onOpenGoogleDriveModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isGoogleDriveConnected
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
              }`}
              title={
                isGoogleDriveConnected
                  ? '구글 드라이브와 연동되어 있습니다. 클릭하여 백업 및 동기화 상태 관리'
                  : '구글 드라이브 클라우드 저장 연동'
              }
            >
              <Cloud
                className={`w-3.5 h-3.5 ${
                  isGoogleDriveConnected ? 'text-blue-600' : 'text-slate-500'
                } ${isDriveSyncing ? 'animate-bounce' : ''}`}
              />
              <span>{isGoogleDriveConnected ? '구글 드라이브 연동됨' : '구글 드라이브 저장'}</span>
            </button>
          )}

          {onResetResidents && (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium transition cursor-pointer"
              title="초기 데모 데이터로 복원"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기값 복원</span>
            </button>
          )}

          <button
            id="create-new-resident-btn"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>신규 이용인 등록</span>
          </button>

          {activeResident && (
            <button
              onClick={() => onOpenRecordForResident(activeResident.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{activeResident.name} 이용인 새 기록 입력</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Resident List (30%) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search Box & Quick Add */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="이용인 이름, 호실, 등급 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
            </div>
            <button
              onClick={handleOpenCreateModal}
              title="신규 이용인 등록"
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600 rounded-xl shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {/* List of Residents */}
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filteredResidents.map((r) => {
              const isSelected = r.id === activeResident?.id;
              return (
                <div
                  key={r.id}
                  onClick={() => onSelectResident(r.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-200">
                        {r.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900">{r.name}</span>
                          <span className="text-xs text-slate-500">({r.age}세/{r.gender})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{r.roomNumber}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {r.careLevel}
                      </span>
                      {r.recentBehaviorAlert && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          <AlertCircle className="w-3 h-3" />
                          변화감지
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>담당: {r.primaryWorker}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(r);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5 hover:underline"
                    >
                      <Edit3 className="w-3 h-3" />
                      정보 수정
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Comprehensive Single Resident View (70%) */}
        {activeResident && (
          <div className="lg:col-span-8 space-y-4">
            {/* Resident Hero Profile Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-slate-900 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-xs">
                    {activeResident.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                        {activeResident.name}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {activeResident.careLevel}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {activeResident.roomNumber}
                      </span>
                      <button
                        id="edit-active-resident-btn"
                        type="button"
                        onClick={() => handleOpenEditModal(activeResident)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition ml-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>정보 수정</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span>생년/연령: {activeResident.age}세 ({activeResident.gender})</span>
                      <span>입소일: {activeResident.admissionDate}</span>
                      <span>보호자: {activeResident.guardianName} ({activeResident.guardianPhone})</span>
                      <span>담당: {activeResident.primaryWorker}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Needs Tags */}
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">주요 포착 욕구</span>
                  <div className="flex flex-wrap gap-1">
                    {activeResident.keyNeeds.map((need, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        {need}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sub Navigation Tabs */}
              <div className="flex items-center gap-2 pt-3 overflow-x-auto scrollbar-none text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('TIMELINE')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'TIMELINE'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  이용인 Timeline (핵심)
                </button>
                <button
                  onClick={() => setActiveTab('INFO')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'INFO'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  기본정보 & 질환
                </button>
                <button
                  onClick={() => setActiveTab('HEALTH')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'HEALTH'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  건강 & 바이탈
                </button>
                <button
                  onClick={() => setActiveTab('RECORDS')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'RECORDS'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  생활기록 내역 ({residentRecords.length})
                </button>
              </div>
            </div>

            {/* Tab 1: Chronological Timeline Feed */}
            {activeTab === 'TIMELINE' && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      이용인 시계열 Timeline
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      산책, 프로그램, 상담, 병원 진료, 가족 연락 등 발생한 모든 사건을 순서대로 추적합니다.
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">최신순 정렬</span>
                </div>

                {/* The Timeline Flow */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {residentTimeline.length > 0 ? (
                    residentTimeline.map((item) => (
                      <div key={item.id} className="relative group">
                        {/* Dot on line */}
                        <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white border border-blue-700" />

                        {/* Card */}
                        <div className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 transition space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{item.date}</span>
                              <span className="text-[11px] text-slate-500 font-medium">{item.time}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                                {item.category}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">작성/담당: {item.staffName}</span>
                          </div>

                          <h5 className="font-bold text-sm text-slate-900">{item.title}</h5>
                          <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      등록된 타임라인 기록이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: 기본정보 & 진단명 */}
            {activeTab === 'INFO' && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900">기본 인적 사항 및 진단명</h4>
                  <button
                    onClick={() => handleOpenEditModal(activeResident)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    이용인 정보 수정하기
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                    <span className="font-bold text-slate-700 block">진단명 및 기저질환</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeResident.diagnosis.map((d, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                    <span className="font-bold text-slate-700 block">비상연락망 및 보호자</span>
                    <div className="space-y-1 text-slate-600">
                      <div>성명: <strong className="text-slate-900">{activeResident.guardianName}</strong></div>
                      <div>연락처: <strong className="text-slate-900">{activeResident.guardianPhone}</strong></div>
                      <div>주 배정 담당자: <strong className="text-teal-700">{activeResident.primaryWorker}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: 건강 & 바이탈 */}
            {activeTab === 'HEALTH' && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-rose-600" />
                    최근 바이탈 및 건강 모니터링 요약
                  </h4>
                  <button
                    onClick={() => handleOpenEditModal(activeResident)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    바이탈 및 건강정보 수정
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-700 block font-medium">혈압 (BP)</span>
                    <span className="text-base font-bold text-slate-900">{activeResident.vitalSummary.bloodPressure}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-700 block font-medium">체온 (BT)</span>
                    <span className="text-base font-bold text-slate-900">{activeResident.vitalSummary.temperature}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-700 block font-medium">맥박 (PR)</span>
                    <span className="text-base font-bold text-slate-900">{activeResident.vitalSummary.pulse}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-700 block font-medium">식전혈당 (BST)</span>
                    <span className="text-base font-bold text-slate-900">{activeResident.vitalSummary.bloodSugar}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: 생활기록 내역 */}
            {activeTab === 'RECORDS' && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-900">
                  {activeResident.name} 이용인의 공식 생활기록
                </h4>
                <div className="space-y-3">
                  {residentRecords.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-700">
                        <span className="font-bold text-slate-900">{r.date} {r.time}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          공식 승인 완료 ({r.approvedBy})
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed">{r.outputs.livingRecord}</p>
                      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                        <span>개별지원 연계: {r.outputs.individualSupport.slice(0, 45)}...</span>
                        <span className="text-teal-700 font-semibold">실적 +1</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resident Form Modal (Create or Edit) */}
      <ResidentFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        mode={formModalMode}
        initialData={targetResidentForEdit}
        onSave={handleSaveResidentForm}
      />

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">초기 데이터로 복원</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  이용인 데이터를 초기 데모 상태(6명)로 복원하시겠습니까? 지금까지 수정한 내용은 초기화됩니다.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  if (onResetResidents) {
                    onResetResidents();
                    showToast('이용인 데이터가 초기 상태로 복원되었습니다.');
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                초기값 복원
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Save Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-emerald-500/40 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-100">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
