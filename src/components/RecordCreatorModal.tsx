import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Layers,
  ChevronRight,
  FileCheck,
  Edit3,
  Volume2,
} from 'lucide-react';
import { Resident, WelfareRecord, ExtractedRecordInfo, DecomposedOutputs } from '../types';

interface RecordCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
  initialResidentId?: string;
  initialText?: string;
  onSaveRecord: (record: WelfareRecord) => void;
}

export const RecordCreatorModal: React.FC<RecordCreatorModalProps> = ({
  isOpen,
  onClose,
  residents,
  initialResidentId,
  initialText,
  onSaveRecord,
}) => {
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [inputMode, setInputMode] = useState<'DIRECT' | 'VOICE' | 'CHECK'>('DIRECT');
  const [rawText, setRawText] = useState('');

  // Live Real-Time Clock state (1-second tick)
  const [currentLiveDate, setCurrentLiveDate] = useState<Date>(new Date());
  const [isRealTimeSync, setIsRealTimeSync] = useState(true);
  const [recordDate, setRecordDate] = useState('2026-09-04');
  const [recordTime, setRecordTime] = useState('');

  // Voice recording state (Web Speech API)
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Quick Check state
  const [checkedMeal, setCheckedMeal] = useState('양호 (완식)');
  const [checkedMood, setCheckedMood] = useState('좋음 (밝은 표정)');
  const [checkedActivity, setCheckedActivity] = useState('산책 (지역사회 공원)');
  const [checkedRelationship, setCheckedRelationship] = useState('원활 (타인과 적극적 대화)');
  const [checkedSpecial, setCheckedSpecial] = useState('특이사항 없음');

  // AI Loading & Result state
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedRecordInfo | null>(null);
  const [outputs, setOutputs] = useState<DecomposedOutputs | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<number>(0);
  const [isReviewed, setIsReviewed] = useState(false);

  // Ticking 1-second live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLiveDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format helpers
  const formatTimeHHMMSS = (d: Date) => {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatDateYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Sync on modal open or changes
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setCurrentLiveDate(now);
      const timeStr = formatTimeHHMMSS(now);
      const dateStr = formatDateYYYYMMDD(now);
      setRecordDate(dateStr);
      setRecordTime(timeStr);
      setIsRealTimeSync(true);

      if (initialText) {
        setRawText(initialText);
      }
    }
  }, [isOpen, initialText]);

  // Initialize resident selection
  useEffect(() => {
    if (initialResidentId) {
      setSelectedResidentId(initialResidentId);
    } else if (residents.length > 0 && !selectedResidentId) {
      setSelectedResidentId(residents[0].id);
    }
  }, [initialResidentId, residents, selectedResidentId]);

  // Setup Web Speech Recognition if available
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setRawText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setVoiceError('음성 인식을 지원하지 않거나 마이크 권한이 필요합니다. 텍스트 입력을 이용해주세요.');
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    setVoiceError(null);
    if (!recognitionRef.current) {
      setVoiceError('이 브라우저는 음성 인식 API를 직접 지원하지 않습니다. [샘플 음성 시뮬레이션] 버튼을 눌러보세요.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
        setVoiceError('마이크 권한을 확인해주세요.');
        setIsRecording(false);
      }
    }
  };

  // Sample prompt speech simulation
  const handleLoadSampleSpeech = () => {
    const sample = '김○○ 이용인이 오늘 오전 식사량은 평소와 비슷했음. 식사 후 직원에게 공원에 가고 싶다고 표현함. 10시 30분 직원과 함께 산책함. 산책 중 다른 이용인과 대화하며 즐거워하는 모습을 보임.';
    setRawText(sample);
    setInputMode('VOICE');
    setSelectedResidentId('res-1'); // 김민수
  };

  // Execute AI Decomposition (One Input -> Multi Output)
  const handleGenerateAi = async () => {
    const resident = residents.find((r) => r.id === selectedResidentId);
    const residentName = resident ? resident.name : '김○○';

    let textToAnalyze = rawText.trim();
    if (inputMode === 'CHECK' || (!textToAnalyze && inputMode === 'DIRECT')) {
      textToAnalyze = `[간편체크 입력] 식사: ${checkedMeal}, 기분: ${checkedMood}, 활동: ${checkedActivity}, 대인관계: ${checkedRelationship}, 특이사항: ${checkedSpecial}`;
    }

    if (!textToAnalyze) {
      alert('기록할 내용을 입력하거나 체크옵션을 선택해 주세요.');
      return;
    }

    const liveNow = formatTimeHHMMSS(currentLiveDate);
    const activeTime = isRealTimeSync ? liveNow : (recordTime || liveNow);

    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/decompose-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: textToAnalyze,
          residentName,
          time: activeTime,
          checkedOptions: {
            meal: checkedMeal,
            mood: checkedMood,
            activity: checkedActivity,
            relationship: checkedRelationship,
            specialNote: checkedSpecial,
          },
        }),
      });

      const data = await res.json();
      if (data && data.data) {
        setExtractedInfo(data.data.extractedInfo);
        setOutputs(data.data.outputs);
        setIsReviewed(false);
        setActiveOutputTab(0);
      }
    } catch (e) {
      console.error('Error generating AI record:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Final Approval and Official Save with accurate real-time timestamp
  const handleFinalApproveAndSave = () => {
    if (!outputs || !extractedInfo) return;

    const resident = residents.find((r) => r.id === selectedResidentId);
    const residentName = resident ? resident.name : '이용인';

    const now = new Date();
    const liveTimeNow = formatTimeHHMMSS(now);
    const exactDate = recordDate || formatDateYYYYMMDD(now);
    const finalTime = isRealTimeSync ? liveTimeNow : (recordTime || liveTimeNow);
    const fullTimestamp = `${exactDate} ${finalTime}`;

    const newRecord: WelfareRecord = {
      id: `rec-${Date.now()}`,
      residentId: selectedResidentId,
      residentName,
      date: exactDate,
      time: finalTime,
      staffName: '이지은 사회복지사',
      rawInput: rawText || `식사:${checkedMeal}, 기분:${checkedMood}, 활동:${checkedActivity}`,
      inputMode,
      checkedOptions: {
        meal: checkedMeal,
        mood: checkedMood,
        activity: checkedActivity,
        relationship: checkedRelationship,
        specialNote: checkedSpecial,
      },
      extractedInfo: {
        ...extractedInfo,
        time: finalTime,
      },
      outputs,
      status: 'OFFICIAL',
      createdAt: fullTimestamp,
      updatedAt: fullTimestamp,
      approvedBy: '이지은 사회복지사 (실시간 검토 승인)',
    };

    onSaveRecord(newRecord);
    onClose();
  };

  if (!isOpen) return null;

  const currentResident = residents.find((r) => r.id === selectedResidentId);

  const outputTabs = [
    { id: 0, name: '① 생활기록', desc: '표준 생활기록부' },
    { id: 1, name: '② 개별지원 기록', desc: 'ISP 계획 연계' },
    { id: 2, name: '③ 행동·정서 변화', desc: '이상행동/정서 추이' },
    { id: 3, name: '④ 인수인계', desc: '교대근무 전달사항' },
    { id: 4, name: '⑤ 사례관리 데이터', desc: '발견 욕구 및 방향' },
    { id: 5, name: '⑥ 월간 통계', desc: '활동실적 자동집계' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg tracking-tight flex items-center gap-2 text-white">
                One Input → Multi Output AI 기록 생성기
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 border border-blue-400/30">
                  MVP 핵심 기능
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                현장에서 한 번 기록하면 AI가 분석하여 6대 업무 문서와 통계에 자동 연결합니다.
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Controls: Target Resident & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>대상 이용인 선택</span>
              </label>
              <select
                value={selectedResidentId}
                onChange={(e) => setSelectedResidentId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.age}세, {r.roomNumber}, {r.careLevel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>기록 및 저장 시각</span>
                </label>
                {isRealTimeSync ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRealTimeSync(false);
                      setRecordTime(formatTimeHHMMSS(currentLiveDate));
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline transition"
                  >
                    수동 입력 전환
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRealTimeSync(true);
                      const now = new Date();
                      setCurrentLiveDate(now);
                      setRecordTime(formatTimeHHMMSS(now));
                      setRecordDate(formatDateYYYYMMDD(now));
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1 transition"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </span>
                    실시간 시각으로 동기화
                  </button>
                )}
              </div>

              {isRealTimeSync ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50/80 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                    </span>
                    <span className="text-xs font-bold text-blue-950 font-mono tracking-wider">
                      {formatTimeHHMMSS(currentLiveDate)}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-200/70 text-blue-800">
                      실시간 라이브
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {recordDate} (오늘)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-1/2 text-xs px-2.5 py-2 rounded-lg bg-white border border-slate-300 font-medium"
                  />
                  <input
                    type="time"
                    step="1"
                    value={recordTime}
                    onChange={(e) => {
                      setRecordTime(e.target.value);
                      setIsRealTimeSync(false);
                    }}
                    className="w-1/2 text-xs px-2.5 py-2 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3 Input Methods Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                기록 입력 방식 선택 (3가지)
              </label>
              <button
                type="button"
                onClick={handleLoadSampleSpeech}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md border border-blue-200/80 transition"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>기획서 예시 음성 텍스트 불러오기</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setInputMode('DIRECT')}
                className={`py-2 text-xs font-bold rounded-lg transition ${
                  inputMode === 'DIRECT'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A. 직접 입력
              </button>
              <button
                type="button"
                onClick={() => setInputMode('VOICE')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  inputMode === 'VOICE'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-rose-500" />
                B. 음성 입력 (STT)
              </button>
              <button
                type="button"
                onClick={() => setInputMode('CHECK')}
                className={`py-2 text-xs font-bold rounded-lg transition ${
                  inputMode === 'CHECK'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                C. 간편 체크
              </button>
            </div>

            {/* Method A & B: Text / Voice input box */}
            {(inputMode === 'DIRECT' || inputMode === 'VOICE') && (
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    rows={4}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={
                      inputMode === 'VOICE'
                        ? '마이크 버튼을 누르고 말하거나, 휴대폰 음성 입력을 진행하세요. 예: "김○○ 오늘 오전 식사 잘했고 10시 반에 공원 산책을 다녀왔습니다..."'
                        : '관찰한 내용을 자유롭게 입력하세요. 예: 오늘 오전 식사 양호. 산책 요구함. 동료 이용인과 대화 나눔...'
                    }
                    className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
                  />

                  {inputMode === 'VOICE' && (
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`absolute right-3 bottom-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                        isRecording
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-800 text-white hover:bg-slate-900'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>녹음 중지</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5 text-rose-400" />
                          <span>음성 녹음 시작</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {voiceError && (
                  <p className="text-[11px] text-rose-600 font-medium">{voiceError}</p>
                )}

                {/* Quick Phrase helpers */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-700">추천 빠른 문구:</span>
                  {[
                    '식사량 평소와 유사함',
                    '공원 산책 희망하여 10:30 동행함',
                    '타인과 즐겁게 대화 나눔',
                    '특별한 행동문제 관찰 안 됨',
                    '오후 가벼운 피로 호소하여 휴식',
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => setRawText((prev) => (prev ? `${prev} ${phrase}.` : `${phrase}.`))}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition"
                    >
                      +{phrase}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Method C: Quick Check options */}
            {inputMode === 'CHECK' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block mb-1">식사 상태:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['양호 (완식)', '보통 (1/2 이상)', '부진 (거부/식욕감소)'].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setCheckedMeal(opt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          checkedMeal === opt
                            ? 'bg-teal-700 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">기분 및 정서:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['좋음 (밝은 표정)', '안정 (차분함)', '불안/초조', '무기력/우울'].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setCheckedMood(opt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          checkedMood === opt
                            ? 'bg-teal-700 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">활동 내역:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['산책 (지역사회 공원)', '원예/미술 프로그램', '휴식 및 수면', '재활 스트레칭'].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setCheckedActivity(opt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          checkedActivity === opt
                            ? 'bg-teal-700 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">대인관계:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['원활 (타인과 적극적 대화)', '소극적 (지켜봄)', '갈등/마찰 없음'].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setCheckedRelationship(opt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          checkedRelationship === opt
                            ? 'bg-teal-700 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 pt-1">
                  <span className="font-bold text-slate-700 block mb-1">특이사항:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['특이사항 없음', '외부활동 강력 희망', '야간 소음 민감', '복약 및 혈압 주의'].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setCheckedSpecial(opt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          checkedSpecial === opt
                            ? 'bg-teal-700 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <div className="flex justify-center pt-2">
            <button
              id="ai-generate-record-btn"
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateAi}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'AI 의미 분석 및 문서 분해 중...' : '[AI 다각도 기록 생성]'}</span>
            </button>
          </div>

          {/* AI Result Section (Structured Data & Multi Outputs) */}
          {outputs && extractedInfo && (
            <div className="space-y-5 pt-4 border-t border-slate-200 animate-in fade-in duration-300">
              {/* Human-in-the-loop Warning Banner */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold">
                    상태: [AI 생성 초안 / 담당자 검토 및 수정 필요]
                  </span>
                  <span className="hidden md:inline text-slate-600">
                    사회복지사가 검토 및 보완 후 [최종 승인] 버튼을 누르면 공식 기록으로 저장됩니다.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">
                  검토 대기
                </span>
              </div>

              {/* 8. AI 구조화된 추출 정보 카드 */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    AI 구조화 추출 파라미터 (데이터베이스 저장 단위)
                  </span>
                  <span className="text-[10px] text-slate-400">향후 모든 업무에서 재사용 가능</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-slate-800/80 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">[대상자]</span>
                    <span className="font-bold text-white">{extractedInfo.resident}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">[시간]</span>
                    <span className="font-bold text-white">{extractedInfo.time}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">[활동]</span>
                    <span className="font-semibold text-emerald-400">{extractedInfo.activity}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">[욕구]</span>
                    <span className="font-semibold text-amber-300">{extractedInfo.need}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">[정서]</span>
                    <span className="font-semibold text-teal-300">{extractedInfo.emotion}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">[대인관계]</span>
                    <span className="font-semibold text-sky-300">{extractedInfo.interaction}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">[문제행동]</span>
                    <span className="font-semibold text-slate-300">{extractedInfo.problemBehavior}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">[지원내용]</span>
                    <span className="font-semibold text-slate-200">{extractedInfo.supportProvided}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">[결과]</span>
                    <span className="font-semibold text-teal-300">{extractedInfo.result}</span>
                  </div>
                </div>
              </div>

              {/* Multi-Output Tabs & Content */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                {/* Tabs Header */}
                <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1 scrollbar-none">
                  {outputTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveOutputTab(tab.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap text-left ${
                        activeOutputTab === tab.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                <div className="p-4 space-y-3">
                  {activeOutputTab === 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">① 생활기록 문장 (전문 사회복지 서술체)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                          생활기록부 자동 기안
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={outputs.livingRecord}
                        onChange={(e) => setOutputs({ ...outputs, livingRecord: e.target.value })}
                        className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-600 leading-relaxed font-sans"
                      />
                    </div>
                  )}

                  {activeOutputTab === 1 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">② 개별지원기록 (ISP 연계 서술)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                          개별지원 계획서 연계
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={outputs.individualSupport}
                        onChange={(e) => setOutputs({ ...outputs, individualSupport: e.target.value })}
                        className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-600 leading-relaxed font-sans"
                      />
                    </div>
                  )}

                  {activeOutputTab === 2 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">③ 행동·정서 변화 기록</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">
                          이상행동 추이 분석
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={outputs.behaviorEmotion}
                        onChange={(e) => setOutputs({ ...outputs, behaviorEmotion: e.target.value })}
                        className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-600 leading-relaxed font-sans"
                      />
                    </div>
                  )}

                  {activeOutputTab === 3 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">④ 교대근무 인수인계 사항</span>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <span>중요도:</span>
                          {(['HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
                            <button
                              type="button"
                              key={p}
                              onClick={() => setOutputs({ ...outputs, handoverPriority: p })}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                outputs.handoverPriority === p
                                  ? p === 'HIGH'
                                    ? 'bg-rose-600 text-white'
                                    : p === 'MEDIUM'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {p === 'HIGH' ? '🔴 반드시 확인' : p === 'MEDIUM' ? '🟡 확인 필요' : '🟢 일반사항'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        value={outputs.handover}
                        onChange={(e) => setOutputs({ ...outputs, handover: e.target.value })}
                        className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-600 leading-relaxed font-sans"
                      />
                    </div>
                  )}

                  {activeOutputTab === 4 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">⑤ 사례관리 데이터 (반복 욕구 축적)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                          30일 욕구패턴 자동 분석 연계
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={outputs.caseManagementNeed}
                        onChange={(e) => setOutputs({ ...outputs, caseManagementNeed: e.target.value })}
                        className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-600 leading-relaxed font-sans"
                      />
                    </div>
                  )}

                  {activeOutputTab === 5 && (
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <div className="text-xs font-bold text-slate-800">⑥ 월간 통계 및 시설 평가 실적 집계</div>
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-teal-100 text-teal-900 text-xs font-bold">
                          집계 영역: {outputs.monthlyStatsCategory} (+1회 자동 추가)
                        </div>
                        <p className="text-xs text-slate-600">
                          이 기록은 월간 운영실적 보고서 및 보건복지부 시설평가 영역(지역사회 관계)에 자동 증빙 실적으로 누적됩니다.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Final Approval Area */}
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-700" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                      담당 사회복지사 검토 완료 및 최종 승인
                    </h5>
                    <p className="text-[11px] text-slate-600">
                      승인 즉시 생활기록, 인수인계, 통계, 이용인 타임라인에 실시간 공식 반영됩니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg"
                  >
                    닫기
                  </button>
                  <button
                    id="final-approve-record-btn"
                    type="button"
                    onClick={handleFinalApproveAndSave}
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25 flex items-center gap-2 transition active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>최종 승인 및 공식 기록 저장</span>
                    <span className="text-[10px] bg-blue-500/90 text-white px-2 py-0.5 rounded font-mono font-medium flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {isRealTimeSync ? formatTimeHHMMSS(currentLiveDate) : (recordTime || formatTimeHHMMSS(currentLiveDate))}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
