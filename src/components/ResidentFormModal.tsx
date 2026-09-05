import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Activity,
  Heart,
  Calendar,
  Phone,
  ShieldAlert,
  Save,
  UserPlus,
  Edit3,
  CheckCircle2,
} from 'lucide-react';
import { Resident } from '../types';

interface ResidentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'CREATE' | 'EDIT';
  initialData?: Resident | null;
  onSave: (resident: Resident) => void;
}

export const ResidentFormModal: React.FC<ResidentFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialData,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(75);
  const [gender, setGender] = useState<'남' | '여'>('남');
  const [roomNumber, setRoomNumber] = useState('');
  const [careLevel, setCareLevel] = useState('장기요양 2등급');
  const [admissionDate, setAdmissionDate] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [primaryWorker, setPrimaryWorker] = useState('이지은 사회복지사');
  const [diagnosisText, setDiagnosisText] = useState('');
  const [keyNeedsText, setKeyNeedsText] = useState('');
  const [recentEmotionScore, setRecentEmotionScore] = useState<number>(4);
  const [recentBehaviorAlert, setRecentBehaviorAlert] = useState<boolean>(false);

  // Vital Summary
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [temperature, setTemperature] = useState('36.5°C');
  const [pulse, setPulse] = useState('74회/분');
  const [bloodSugar, setBloodSugar] = useState('110 mg/dL');

  const [errorMessage, setErrorMessage] = useState('');

  // Populate data when modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'EDIT' && initialData) {
      setName(initialData.name || '');
      setAge(initialData.age || 70);
      setGender(initialData.gender || '남');
      setRoomNumber(initialData.roomNumber || '');
      setCareLevel(initialData.careLevel || '장기요양 2등급');
      setAdmissionDate(initialData.admissionDate || '');
      setGuardianName(initialData.guardianName || '');
      setGuardianPhone(initialData.guardianPhone || '');
      setPrimaryWorker(initialData.primaryWorker || '이지은 사회복지사');
      setDiagnosisText(initialData.diagnosis ? initialData.diagnosis.join(', ') : '');
      setKeyNeedsText(initialData.keyNeeds ? initialData.keyNeeds.join(', ') : '');
      setRecentEmotionScore(initialData.recentEmotionScore || 4);
      setRecentBehaviorAlert(Boolean(initialData.recentBehaviorAlert));

      if (initialData.vitalSummary) {
        setBloodPressure(initialData.vitalSummary.bloodPressure || '120/80');
        setTemperature(initialData.vitalSummary.temperature || '36.5°C');
        setPulse(initialData.vitalSummary.pulse || '74회/분');
        setBloodSugar(initialData.vitalSummary.bloodSugar || '110 mg/dL');
      }
    } else {
      // Defaults for CREATE
      const todayStr = new Date().toISOString().slice(0, 10);
      setName('');
      setAge(75);
      setGender('남');
      setRoomNumber('101호실');
      setCareLevel('장기요양 2등급');
      setAdmissionDate(todayStr);
      setGuardianName('');
      setGuardianPhone('');
      setPrimaryWorker('이지은 사회복지사');
      setDiagnosisText('고혈압, 경도인지장애');
      setKeyNeedsText('신체활동 지원, 정서적지지');
      setRecentEmotionScore(4);
      setRecentBehaviorAlert(false);
      setBloodPressure('120/80');
      setTemperature('36.5°C');
      setPulse('74회/분');
      setBloodSugar('110 mg/dL');
    }
    setErrorMessage('');
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('이용인의 성명을 입력해 주세요.');
      return;
    }
    if (!roomNumber.trim()) {
      setErrorMessage('생활실/호실 정보를 입력해 주세요.');
      return;
    }
    if (!admissionDate.trim()) {
      setErrorMessage('입소일자를 입력해 주세요.');
      return;
    }

    const diagnosis = diagnosisText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const keyNeeds = keyNeedsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const residentObj: Resident = {
      ...(initialData || {}),
      id: mode === 'EDIT' && initialData ? initialData.id : `res-${Date.now()}`,
      name: name.trim(),
      age: Number(age) || 70,
      gender,
      roomNumber: roomNumber.trim(),
      careLevel: careLevel.trim(),
      admissionDate: admissionDate.trim(),
      guardianName: guardianName.trim() || '미등록',
      guardianPhone: guardianPhone.trim() || '미등록',
      primaryWorker: primaryWorker.trim() || '담당 복지사',
      diagnosis: diagnosis.length > 0 ? diagnosis : ['특이 질환 없음'],
      keyNeeds: keyNeeds.length > 0 ? keyNeeds : ['일상생활 지원'],
      recentEmotionScore,
      recentBehaviorAlert,
      vitalSummary: {
        bloodPressure: bloodPressure.trim() || '120/80',
        temperature: temperature.trim() || '36.5°C',
        pulse: pulse.trim() || '72회/분',
        bloodSugar: bloodSugar.trim() || '110 mg/dL',
      },
    };

    onSave(residentObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {mode === 'CREATE' ? <UserPlus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg tracking-tight flex items-center gap-2 text-white">
                {mode === 'CREATE' ? '신규 이용인 등록' : `[이용인 정보 수정] ${initialData?.name || ''}`}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'CREATE'
                  ? '시설에 새로 입소하거나 관리할 이용인의 인적·건강·돌봄 정보를 등록합니다.'
                  : '이용인의 인적 정보, 담당 복지사, 보호자 연락처 및 건강 상태를 수정합니다.'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: 기본 인적사항 */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200 text-xs">
              <User className="w-3.5 h-3.5 text-blue-600" />
              1. 기본 인적사항 & 생활실
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">성명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 김민수"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">연령 (세) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={130}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">성별 *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('남')}
                    className={`py-2 rounded-lg border font-bold transition ${
                      gender === '남'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    남성 (남)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('여')}
                    className={`py-2 rounded-lg border font-bold transition ${
                      gender === '여'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    여성 (여)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">생활실 / 호실 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 101호실 (해맞이방)"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">요양 / 돌봄 등급 *</label>
                <select
                  value={careLevel}
                  onChange={(e) => setCareLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium bg-white"
                >
                  <option value="장기요양 1등급">장기요양 1등급</option>
                  <option value="장기요양 2등급">장기요양 2등급</option>
                  <option value="장기요양 3등급">장기요양 3등급</option>
                  <option value="장기요양 4등급">장기요양 4등급</option>
                  <option value="장기요양 5등급">장기요양 5등급</option>
                  <option value="인지지원등급">인지지원등급</option>
                  <option value="중증 발달장애">중증 발달장애</option>
                  <option value="경증 발달장애">경증 발달장애</option>
                  <option value="일반돌봄">일반돌봄</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">입소일자 *</label>
                <input
                  type="date"
                  required
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: 담당 및 보호자 정보 */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200 text-xs">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              2. 담당 종사자 및 보호자 연락처
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">주 담당 종사자</label>
                <input
                  type="text"
                  placeholder="예: 이지은 사회복지사"
                  value={primaryWorker}
                  onChange={(e) => setPrimaryWorker(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">보호자 성명 (관계)</label>
                <input
                  type="text"
                  placeholder="예: 김정남 (자녀)"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">보호자 비상연락처</label>
                <input
                  type="text"
                  placeholder="예: 010-3344-5566"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: 기저질환 & 바이탈 건강정보 */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200 text-xs">
              <Activity className="w-3.5 h-3.5 text-rose-600" />
              3. 기저질환 및 건강 바이탈 요약
            </h4>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                주요 진단명 / 기저질환 <span className="font-normal text-slate-500">(쉼표로 구분하여 여러 개 입력)</span>
              </label>
              <input
                type="text"
                placeholder="예: 고혈압, 당뇨병, 뇌경색 후유장애, 관절염"
                value={diagnosisText}
                onChange={(e) => setDiagnosisText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block text-slate-600 font-medium mb-1">혈압 (BP)</label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">체온 (BT)</label>
                <input
                  type="text"
                  placeholder="36.5°C"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">맥박 (PR)</label>
                <input
                  type="text"
                  placeholder="74회/분"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">식전혈당 (BST)</label>
                <input
                  type="text"
                  placeholder="110 mg/dL"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: 사례관리 포착 욕구 & 주의 알림 */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200 text-xs">
              <Heart className="w-3.5 h-3.5 text-amber-600" />
              4. 주요 포착 욕구 & 모니터링 알림
            </h4>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                주요 포착 욕구 태그 <span className="font-normal text-slate-500">(쉼표로 구분하여 입력)</span>
              </label>
              <input
                type="text"
                placeholder="예: 실외산책, 정서안정, 관절운동, 가족통화"
                value={keyNeedsText}
                onChange={(e) => setKeyNeedsText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Emotion score */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">최근 정서 점수</span>
                  <span className="text-[11px] text-slate-500">1(매우 불안) ~ 5(매우 안정)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setRecentEmotionScore(score)}
                      className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                        recentEmotionScore === score
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              {/* Behavior Alert */}
              <div
                onClick={() => setRecentBehaviorAlert(!recentBehaviorAlert)}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  recentBehaviorAlert
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert
                    className={`w-5 h-5 ${recentBehaviorAlert ? 'text-rose-600' : 'text-slate-400'}`}
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">이상행동/변화 감지 알림</span>
                    <span className="text-[11px] text-slate-500">목록에 변화감지 배지 표시</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={recentBehaviorAlert}
                  onChange={(e) => setRecentBehaviorAlert(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>저장 즉시 로컬 브라우저와 업무 화면에 실시간 동기화됩니다</span>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold transition"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{mode === 'CREATE' ? '새 이용인 실시간 등록' : '수정사항 실시간 저장'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
