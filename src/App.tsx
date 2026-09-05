import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TodayTasksView } from './components/TodayTasksView';
import { ResidentsView } from './components/ResidentsView';
import { RecordsView } from './components/RecordsView';
import { CaseManagementView } from './components/CaseManagementView';
import { ProgramsView } from './components/ProgramsView';
import { HandoverView } from './components/HandoverView';
import { DocumentsView } from './components/DocumentsView';
import { StatsEvaluationView } from './components/StatsEvaluationView';
import { StaffManagementView } from './components/StaffManagementView';
import { RecordCreatorModal } from './components/RecordCreatorModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { initAuth } from './services/googleDriveAuth';
import {
  saveAppDataToDrive,
  fetchSharedAppData,
  loadAppDataFromDrive,
  MASTER_FILE_NAME,
} from './services/googleDriveService';
import {
  fetchServerAppData,
  fetchServerAppVersion,
  debouncedSaveToServer,
  resetServerAppData,
  broadcastAppDataChange,
  subscribeToCrossTabSync,
} from './services/dataSyncService';
import { User } from 'firebase/auth';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from './utils/storage';

import {
  INITIAL_RESIDENTS,
  INITIAL_RECORDS,
  INITIAL_TASKS,
  INITIAL_MONTHLY_TASKS,
  INITIAL_TIMELINE,
  INITIAL_CASE_ITEMS,
  INITIAL_PROGRAMS,
  INITIAL_HANDOVER,
  INITIAL_DOCUMENTS,
  INITIAL_STATS,
  INITIAL_STAFF,
  INITIAL_CHAT_HISTORY,
} from './data/seedData';

import {
  NavMenu,
  UserRole,
  Resident,
  WelfareRecord,
  DailyTask,
  MonthlyTask,
  CaseManagementItem,
  ProgramItem,
  HandoverReport,
  WelfareDocument,
  AiChatMessage,
  TimelineEvent,
  AppDataPackage,
  StaffMember,
} from './types';

export default function App() {
  // Navigation & Role State
  const [activeMenu, setActiveMenu] = useState<NavMenu>('TODAY');
  const [currentRole, setCurrentRole] = useState<UserRole>('SOCIAL_WORKER');
  const [selectedResidentId, setSelectedResidentId] = useState<string>('res-1');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordModalResidentId, setRecordModalResidentId] = useState<string | undefined>(undefined);
  const [recordModalInitialText, setRecordModalInitialText] = useState<string | undefined>(undefined);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  // Core Data State (Persisted in LocalStorage for Real-Time State Preservation)
  const [residents, setResidents] = useState<Resident[]>(() =>
    loadFromStorage(STORAGE_KEYS.RESIDENTS, INITIAL_RESIDENTS)
  );
  const [records, setRecords] = useState<WelfareRecord[]>(() =>
    loadFromStorage(STORAGE_KEYS.RECORDS, INITIAL_RECORDS)
  );
  const [tasks, setTasks] = useState<DailyTask[]>(() =>
    loadFromStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS)
  );
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTask[]>(() =>
    loadFromStorage(STORAGE_KEYS.MONTHLY_TASKS, INITIAL_MONTHLY_TASKS)
  );
  const [timeline, setTimeline] = useState<TimelineEvent[]>(() =>
    loadFromStorage(STORAGE_KEYS.TIMELINE, INITIAL_TIMELINE)
  );
  const [caseItems, setCaseItems] = useState<CaseManagementItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.CASE_ITEMS, INITIAL_CASE_ITEMS)
  );
  const [programs, setPrograms] = useState<ProgramItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.PROGRAMS, INITIAL_PROGRAMS)
  );
  const [handover, setHandover] = useState<HandoverReport>(() =>
    loadFromStorage(STORAGE_KEYS.HANDOVER, INITIAL_HANDOVER)
  );
  const [documents, setDocuments] = useState<WelfareDocument[]>(() =>
    loadFromStorage(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS)
  );
  const [stats, setStats] = useState(() =>
    loadFromStorage(STORAGE_KEYS.STATS, INITIAL_STATS)
  );
  const [staffList, setStaffList] = useState<StaffMember[]>(() =>
    loadFromStorage(STORAGE_KEYS.STAFF, INITIAL_STAFF)
  );
  const [chatHistory, setChatHistory] = useState<AiChatMessage[]>(INITIAL_CHAT_HISTORY);
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);

  // Google Drive Cloud Persistence State
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [autoDriveSync, setAutoDriveSync] = useState<boolean>(() => {
    return localStorage.getItem('welfareflow_auto_drive_sync') === 'true';
  });
  const [lastDriveSyncTime, setLastDriveSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('welfareflow_last_drive_sync');
  });
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);

  // Shared Drive external access state
  const [sharedDriveFileId, setSharedDriveFileId] = useState<string | null>(null);
  const [isSharedDriveMode, setIsSharedDriveMode] = useState<boolean>(false);
  const [sharedModeInfo, setSharedModeInfo] = useState<{
    fileName?: string;
    residentCount?: number;
    recordCount?: number;
    updatedAt?: string;
  } | null>(null);
  const [isSharedLoading, setIsSharedLoading] = useState<boolean>(false);
  const [sharedLoadError, setSharedLoadError] = useState<string | null>(null);

  // Guard refs to prevent cross-tab broadcast ping-pong loops and duplicate updates
  const isRemoteSyncUpdateRef = useRef<boolean>(false);
  const lastRemoteSyncUpdatedAtRef = useRef<string>('');

  // Aggregated Application Data Package for server persistence, cross-tab sync, and Drive backup
  const currentAppDataPackage: AppDataPackage = {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    source: 'WelfareFlow AI Web Platform',
    summary: {
      residentCount: residents.length,
      recordCount: records.length,
      taskCount: tasks.length,
    },
    residents,
    records,
    tasks,
    monthlyTasks,
    timeline,
    caseItems,
    programs,
    handover,
    documents,
    stats,
    staff: staffList,
  };

  const handleRestoreFromPackage = (restored: AppDataPackage, isRemote = false) => {
    if (!restored) return;
    if (isRemote) {
      isRemoteSyncUpdateRef.current = true;
    }
    try {
      if (restored.residents && Array.isArray(restored.residents) && restored.residents.length > 0) {
        setResidents(restored.residents);
        setSelectedResidentId((prev) =>
          restored.residents.some((r) => r.id === prev) ? prev : restored.residents[0].id
        );
      }
      if (restored.records && Array.isArray(restored.records)) setRecords(restored.records);
      if (restored.tasks && Array.isArray(restored.tasks)) setTasks(restored.tasks);
      if (restored.monthlyTasks && Array.isArray(restored.monthlyTasks)) setMonthlyTasks(restored.monthlyTasks);
      if (restored.timeline && Array.isArray(restored.timeline)) setTimeline(restored.timeline);
      if (restored.caseItems && Array.isArray(restored.caseItems)) setCaseItems(restored.caseItems);
      if (restored.programs && Array.isArray(restored.programs)) setPrograms(restored.programs);
      if (restored.handover && typeof restored.handover === 'object') setHandover(restored.handover);
      if (restored.documents && Array.isArray(restored.documents)) setDocuments(restored.documents);
      if (restored.stats && typeof restored.stats === 'object') setStats(restored.stats);
      if (restored.staff && Array.isArray(restored.staff)) setStaffList(restored.staff);
    } catch (err) {
      console.warn('[App] Notice restoring app data package:', err);
    }
  };

  const handleRestoreFromDrive = (pkg: AppDataPackage) => handleRestoreFromPackage(pkg, true);

  // 1. Auth listener: keeps user in sync, caches token, and checks Google Drive on startup
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);

        // When authenticated, check if Drive has a newer master file to pull on reload
        if (token && localStorage.getItem('welfareflow_auto_drive_sync') === 'true') {
          try {
            const driveResult = await loadAppDataFromDrive(token, MASTER_FILE_NAME);
            if (driveResult && driveResult.data && driveResult.data.updatedAt) {
              const driveData = driveResult.data;
              const localSaveTimeStr = localStorage.getItem('welfareflow_last_local_save');
              const localTime = localSaveTimeStr ? new Date(localSaveTimeStr).getTime() : 0;
              const driveTime = new Date(driveData.updatedAt).getTime();
              if (driveTime > localTime + 1000) {
                console.log('[App] Loaded newer master data from Google Drive:', driveData.updatedAt);
                handleRestoreFromPackage(driveData);
                const nowStr = new Date(driveData.updatedAt).toLocaleTimeString('ko-KR');
                setLastDriveSyncTime(nowStr);
              }
            }
          } catch (err) {
            console.warn('[App] Notice on Drive auto-sync check on login:', err);
          }
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Initial Full-Stack Hydration, Cross-Tab Sync, and Window Focus Real-Time Polling
  useEffect(() => {
    let isMounted = true;

    async function initialHydration() {
      // If shared drive mode parameter is present (?driveFileId=...), allow that to take precedence
      const params = new URLSearchParams(window.location.search);
      if (params.get('driveFileId') || params.get('sharedFileId') || params.get('fileId')) {
        return;
      }

      try {
        const serverData = await fetchServerAppData();
        if (!isMounted || !serverData) return;

        const localSaveTimeStr = localStorage.getItem('welfareflow_last_local_save');
        const localTime = localSaveTimeStr ? new Date(localSaveTimeStr).getTime() : 0;
        const serverTime = serverData.updatedAt ? new Date(serverData.updatedAt).getTime() : 0;

        // If server data exists and is newer, or if local storage was empty
        if (!localSaveTimeStr || serverTime >= localTime) {
          console.log('[App] Initial hydration from persistent server data store (updatedAt: ' + serverData.updatedAt + ')');
          handleRestoreFromPackage(serverData, true);
        } else {
          // Local storage has newer edits; sync local state to server
          console.log('[App] Local modifications are newer than server. Syncing to server...');
          debouncedSaveToServer(currentAppDataPackage, 100);
        }
      } catch (err) {
        console.warn('[App] Server hydration notice:', err);
      }
    }

    initialHydration();

    // Cross-tab real-time sync listener (immediate multi-tab reflection in same browser)
    const unsubscribeCrossTab = subscribeToCrossTabSync((pkg) => {
      if (!isMounted || !pkg) return;

      // Prevent duplicate processing of the exact same timestamp
      if (pkg.updatedAt && pkg.updatedAt === lastRemoteSyncUpdatedAtRef.current) {
        return;
      }
      lastRemoteSyncUpdatedAtRef.current = pkg.updatedAt || '';

      // Check if current local save is strictly newer than incoming broadcast
      const remoteTime = pkg.updatedAt ? new Date(pkg.updatedAt).getTime() : 0;
      const localSaveTimeStr = localStorage.getItem('welfareflow_last_local_save');
      const localTime = localSaveTimeStr ? new Date(localSaveTimeStr).getTime() : 0;
      if (remoteTime > 0 && localTime > remoteTime + 500) {
        return;
      }

      console.log('[App] Real-time sync update received from another tab');
      handleRestoreFromPackage(pkg, true);
    });

    // Window focus & visibility change listener
    const handleFocusCheck = async () => {
      if (!isMounted || document.visibilityState !== 'visible') return;
      const ver = await fetchServerAppVersion();
      if (!ver || !isMounted) return;
      const localSaveTimeStr = localStorage.getItem('welfareflow_last_local_save');
      const localTime = localSaveTimeStr ? new Date(localSaveTimeStr).getTime() : 0;
      const serverTime = new Date(ver.updatedAt).getTime();
      if (serverTime > localTime + 2000) {
        const fresh = await fetchServerAppData();
        if (fresh && isMounted) {
          console.log('[App] Synchronized external web changes on focus');
          handleRestoreFromPackage(fresh, true);
        }
      }
    };

    window.addEventListener('focus', handleFocusCheck);
    document.addEventListener('visibilitychange', handleFocusCheck);

    // Periodic poll for multi-user web reflection (every 10 seconds)
    const pollInterval = setInterval(handleFocusCheck, 10000);

    return () => {
      isMounted = false;
      unsubscribeCrossTab();
      window.removeEventListener('focus', handleFocusCheck);
      document.removeEventListener('visibilitychange', handleFocusCheck);
      clearInterval(pollInterval);
    };
  }, []);

  // 3. Consolidated Real-time Persistence: LocalStorage, Web Server API, and BroadcastChannel
  useEffect(() => {
    // Break broadcast ping-pong loops: if this state change was initiated by an incoming
    // sync from another tab or remote server, do not re-broadcast it back!
    if (isRemoteSyncUpdateRef.current) {
      isRemoteSyncUpdateRef.current = false;
      return;
    }

    const nowIso = new Date().toISOString();
    localStorage.setItem('welfareflow_last_local_save', nowIso);

    saveToStorage(STORAGE_KEYS.RESIDENTS, residents);
    saveToStorage(STORAGE_KEYS.RECORDS, records);
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    saveToStorage(STORAGE_KEYS.MONTHLY_TASKS, monthlyTasks);
    saveToStorage(STORAGE_KEYS.TIMELINE, timeline);
    saveToStorage(STORAGE_KEYS.CASE_ITEMS, caseItems);
    saveToStorage(STORAGE_KEYS.PROGRAMS, programs);
    saveToStorage(STORAGE_KEYS.HANDOVER, handover);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, documents);
    saveToStorage(STORAGE_KEYS.STATS, stats);
    saveToStorage(STORAGE_KEYS.STAFF, staffList);

    const payload = {
      ...currentAppDataPackage,
      updatedAt: nowIso,
    };

    // Broadcast across tabs in the same browser (instant real-time reflection)
    broadcastAppDataChange(payload);

    // Persist to Web Server Database (persists across reloads, browser restarts, and web sessions)
    debouncedSaveToServer(payload, 400);
  }, [
    residents,
    records,
    tasks,
    monthlyTasks,
    timeline,
    caseItems,
    programs,
    handover,
    documents,
    stats,
    staffList,
  ]);

  // 4. Background Auto-Sync to Google Drive when enabled and authenticated
  useEffect(() => {
    if (!autoDriveSync || !googleAccessToken) return;

    const timer = setTimeout(async () => {
      try {
        setIsDriveSyncing(true);
        await saveAppDataToDrive(currentAppDataPackage, googleAccessToken, MASTER_FILE_NAME);
        const nowStr = new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastDriveSyncTime(nowStr);
        localStorage.setItem('welfareflow_last_drive_sync', nowStr);
      } catch (err) {
        console.warn('Google Drive auto-sync notice:', err);
      } finally {
        setIsDriveSyncing(false);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [
    residents,
    records,
    tasks,
    monthlyTasks,
    timeline,
    caseItems,
    programs,
    handover,
    documents,
    stats,
    staffList,
    autoDriveSync,
    googleAccessToken,
  ]);

  const handleToggleAutoDriveSync = (enabled: boolean) => {
    setAutoDriveSync(enabled);
    localStorage.setItem('welfareflow_auto_drive_sync', String(enabled));
  };

  const loadSharedDriveData = async (fileId: string) => {
    try {
      setIsSharedLoading(true);
      setSharedLoadError(null);
      const packageData = await fetchSharedAppData(fileId, googleAccessToken);
      handleRestoreFromPackage(packageData);
      setSharedModeInfo({
        fileName: fileId,
        residentCount: packageData.residents?.length || 0,
        recordCount: packageData.records?.length || 0,
        updatedAt: packageData.updatedAt
          ? new Date(packageData.updatedAt).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : undefined,
      });
    } catch (err: any) {
      console.error('Failed to load shared drive file:', err);
      setSharedLoadError(err.message || '공유 드라이브 파일을 불러오는 데 실패했습니다.');
    } finally {
      setIsSharedLoading(false);
    }
  };

  // Detect shared drive file ID from URL parameters (?driveFileId=... or ?sharedFileId=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fileId = params.get('driveFileId') || params.get('sharedFileId') || params.get('fileId');
    if (fileId) {
      setSharedDriveFileId(fileId);
      setIsSharedDriveMode(true);
      loadSharedDriveData(fileId);
    }
  }, []);

  // Handler: Save New Approved Record (The Multi-Output Pipeline)
  const handleSaveRecord = (newRecord: WelfareRecord) => {
    // 1. Add to records list
    setRecords((prev) => [newRecord, ...prev]);

    // 2. Add to resident timeline
    const newTimelineEvent: TimelineEvent = {
      id: `time-${Date.now()}`,
      residentId: newRecord.residentId,
      date: newRecord.date,
      time: newRecord.time,
      category: '생활기록',
      title: `${newRecord.extractedInfo.activity} 및 개별 지원`,
      description: newRecord.outputs.livingRecord,
      staffName: newRecord.staffName,
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    };
    setTimeline((prev) => [newTimelineEvent, ...prev]);

    // 3. Connect to Handover if priority is set
    setHandover((prev) => {
      const existing = prev.residentItems.find((i) => i.residentId === newRecord.residentId);
      if (existing) {
        return {
          ...prev,
          residentItems: prev.residentItems.map((item) =>
            item.residentId === newRecord.residentId
              ? {
                  ...item,
                  content: newRecord.outputs.handover,
                  priority: newRecord.outputs.handoverPriority,
                }
              : item
          ),
        };
      }
      return {
        ...prev,
        residentItems: [
          ...prev.residentItems,
          {
            residentId: newRecord.residentId,
            residentName: newRecord.residentName,
            priority: newRecord.outputs.handoverPriority,
            content: newRecord.outputs.handover,
            actionRequired: '야간 관찰 및 상태 확인',
          },
        ],
      };
    });

    // 4. Update Stats
    setStats((prev) => ({
      ...prev,
      totalCommunityActivities:
        newRecord.outputs.monthlyStatsCategory === '지역사회활동'
          ? prev.totalCommunityActivities + 1
          : prev.totalCommunityActivities,
      pendingRecordsCount: Math.max(0, prev.pendingRecordsCount - 1),
    }));
  };

  // Handler: Task Toggle
  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Handler: Delete Task
  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Handler: Clear All Completed Tasks
  const handleClearCompletedTasks = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  // Handler: Add Task
  const handleAddTask = (title: string, category: DailyTask['category']) => {
    const newTask: DailyTask = {
      id: `task-${Date.now()}`,
      title,
      category,
      completed: false,
      priority: 'MEDIUM',
      dueDate: '2026-09-04 17:00',
      assignedTo: '이지은 사회복지사',
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  // Handler: Monthly Task Toggle
  const handleToggleMonthlyTask = (id: string) => {
    setMonthlyTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Handler: Add Monthly Task
  const handleAddMonthlyTask = (newTaskData: Omit<MonthlyTask, 'id'>) => {
    const newTask: MonthlyTask = {
      ...newTaskData,
      id: `mtask-${Date.now()}`,
    };
    setMonthlyTasks((prev) => [newTask, ...prev]);
  };

  // Handler: Delete Monthly Task
  const handleDeleteMonthlyTask = (id: string) => {
    setMonthlyTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Handler: Case Item update
  const handleUpdateCaseItem = (updated: CaseManagementItem) => {
    setCaseItems((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  // Handler: Add program
  const handleAddProgram = (newProg: ProgramItem) => {
    setPrograms((prev) => [newProg, ...prev]);
  };

  // Handler: Update program
  const handleUpdateProgram = (updatedProg: ProgramItem) => {
    setPrograms((prev) =>
      prev.map((p) => (p.id === updatedProg.id ? updatedProg : p))
    );
  };

  // Handler: Document Add
  const handleAddDocument = (newDoc: WelfareDocument) => {
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === newDoc.id);
      if (exists) {
        return prev.map((d) => (d.id === newDoc.id ? newDoc : d));
      }
      return [newDoc, ...prev];
    });
  };

  // Handler: Send message in AI Assistant
  const handleSendAiMessage = async (queryText: string) => {
    const userMsg: AiChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: '방금 전',
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsAiChatLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, question: queryText }),
      });
      const data = await res.json();
      const botMsg: AiChatMessage = {
        id: `chat-${Date.now() + 1}`,
        sender: 'assistant',
        text: data.reply || data.answer || '답변을 불러오지 못했습니다. 다시 시도해 주세요.',
        timestamp: '방금 전',
      };
      setChatHistory((prev) => [...prev, botMsg]);
    } catch (e) {
      console.error('Chat error:', e);
      const fallbackMsg: AiChatMessage = {
        id: `chat-${Date.now() + 1}`,
        sender: 'assistant',
        text: '서버와 통신 중 문제가 발생했습니다. 잠시 후 다시 질문해 주세요.',
        timestamp: '방금 전',
      };
      setChatHistory((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsAiChatLoading(false);
    }
  };

  // Handler: Update Resident (Real-time update & cross-system synchronization)
  const handleUpdateResident = (updated: Resident) => {
    setResidents((prev) => {
      const next = prev.map((r) => (r.id === updated.id ? updated : r));
      saveToStorage(STORAGE_KEYS.RESIDENTS, next);
      return next;
    });

    // Synchronize residentName across records, caseItems, and handover
    setRecords((prev) => {
      const next = prev.map((rec) =>
        rec.residentId === updated.id ? { ...rec, residentName: updated.name } : rec
      );
      saveToStorage(STORAGE_KEYS.RECORDS, next);
      return next;
    });

    setCaseItems((prev) => {
      const next = prev.map((ci) =>
        ci.residentId === updated.id ? { ...ci, residentName: updated.name } : ci
      );
      saveToStorage(STORAGE_KEYS.CASE_ITEMS, next);
      return next;
    });

    setHandover((prev) => {
      const next = {
        ...prev,
        residentItems: prev.residentItems.map((item) =>
          item.residentId === updated.id ? { ...item, residentName: updated.name } : item
        ),
      };
      saveToStorage(STORAGE_KEYS.HANDOVER, next);
      return next;
    });
  };

  // Handler: Add Resident
  const handleAddResident = (newResident: Resident) => {
    setResidents((prev) => {
      const next = [newResident, ...prev];
      saveToStorage(STORAGE_KEYS.RESIDENTS, next);
      return next;
    });
    setSelectedResidentId(newResident.id);
  };

  // Handler: Delete Record
  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    setTimeline((prev) => prev.filter((t) => t.id !== recordId));
  };

  // Handlers: Staff Management
  const handleUpdateStaff = (updated: StaffMember) => {
    setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleAddStaff = (newStaff: StaffMember) => {
    setStaffList((prev) => [newStaff, ...prev]);
  };

  const handleDeleteStaff = (staffId: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== staffId));
  };

  // Handler: Reset Residents to Default Seed Data
  const handleResetResidents = async () => {
    setResidents(INITIAL_RESIDENTS);
    saveToStorage(STORAGE_KEYS.RESIDENTS, INITIAL_RESIDENTS);
    setSelectedResidentId(INITIAL_RESIDENTS[0]?.id || 'res-1');
    await resetServerAppData();
  };

  // Quick navigation with resident id preselection
  const handleNavigateWithResident = (menu: NavMenu, residentId?: string) => {
    if (residentId) {
      setSelectedResidentId(residentId);
    }
    setActiveMenu(menu);
  };

  const handleOpenRecordModalWithResident = (residentId: string, initialText?: string) => {
    setRecordModalResidentId(residentId);
    setRecordModalInitialText(initialText);
    setIsRecordModalOpen(true);
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="h-screen w-full bg-[#F1F5F9] text-slate-900 flex flex-col lg:flex-row font-sans antialiased selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* Left Sidebar Menu (Dark Slate #0F172A) */}
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={(menu) => {
          if (menu === 'AI_ASSISTANT') {
            setIsAiAssistantOpen(true);
          } else {
            setActiveMenu(menu);
          }
        }}
        pendingTasksCount={pendingTasksCount}
        hasBehaviorAlert={residents.some((r) => r.recentBehaviorAlert)}
      />

      {/* Main Column: Header + Scrollable Content + High Density Footer */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          activeMenu={activeMenu}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          onOpenRecordModal={() => {
            setRecordModalResidentId(selectedResidentId);
            setRecordModalInitialText(undefined);
            setIsRecordModalOpen(true);
          }}
          onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
          onNavigateToRecords={() => setActiveMenu('RECORDS')}
          onOpenGoogleDriveModal={() => setIsDriveModalOpen(true)}
          isGoogleDriveConnected={!!googleUser}
          googleUserEmail={googleUser?.email}
          lastDriveSyncTime={lastDriveSyncTime}
          isDriveSyncing={isDriveSyncing}
          isSharedDriveMode={isSharedDriveMode}
        />

        {/* External Shared Drive Mode Banner */}
        {isSharedDriveMode && (
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md text-xs z-30 border-b border-indigo-700/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-extrabold uppercase tracking-wide border border-indigo-300/40 shrink-0">
                공유 링크 열람 모드
              </span>
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-semibold text-indigo-100">
                  외부 구글 드라이브 공유 링크로 연결된 실시간 복지 데이터를 열람하고 있습니다.
                </span>
                {sharedModeInfo && (
                  <span className="text-indigo-300 text-[11px] hidden sm:inline">
                    (이용인 {sharedModeInfo.residentCount}명, 기록 {sharedModeInfo.recordCount}건
                    {sharedModeInfo.updatedAt ? `, 갱신: ${sharedModeInfo.updatedAt}` : ''})
                  </span>
                )}
                {isSharedLoading && (
                  <span className="text-amber-300 font-bold animate-pulse text-[11px]">
                    데이터 로딩 중...
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {sharedDriveFileId && (
                <>
                  <button
                    type="button"
                    onClick={() => loadSharedDriveData(sharedDriveFileId)}
                    disabled={isSharedLoading}
                    className="px-2.5 py-1 rounded-lg bg-indigo-700/90 hover:bg-indigo-600 text-white text-[11px] font-semibold transition cursor-pointer"
                  >
                    최신 데이터 새로고침
                  </button>
                  <a
                    href={`https://drive.google.com/file/d/${sharedDriveFileId}/view?usp=sharing`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-indigo-700/90 hover:bg-indigo-600 text-white text-[11px] font-semibold transition flex items-center gap-1"
                  >
                    드라이브 원본 보기
                  </a>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsSharedDriveMode(false);
                  const url = new URL(window.location.href);
                  url.searchParams.delete('driveFileId');
                  url.searchParams.delete('sharedFileId');
                  url.searchParams.delete('fileId');
                  window.history.replaceState({}, '', url.toString());
                }}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer"
                title="공유 열람 배너 닫기"
              >
                ✕ 닫기
              </button>
            </div>
          </div>
        )}

        {sharedLoadError && (
          <div className="bg-rose-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-sm z-30">
            <span className="font-medium">⚠️ {sharedLoadError}</span>
            <button
              onClick={() => setSharedLoadError(null)}
              className="text-white/80 hover:text-white underline text-[11px] cursor-pointer"
            >
              닫기
            </button>
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F1F5F9]">
          {activeMenu === 'TODAY' && (
            <TodayTasksView
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onClearCompletedTasks={handleClearCompletedTasks}
              monthlyTasks={monthlyTasks}
              onToggleMonthlyTask={handleToggleMonthlyTask}
              onAddMonthlyTask={handleAddMonthlyTask}
              onDeleteMonthlyTask={handleDeleteMonthlyTask}
              records={records}
              onNavigate={handleNavigateWithResident}
              onOpenRecordModalWithResident={handleOpenRecordModalWithResident}
              residents={residents}
            />
          )}

          {activeMenu === 'RESIDENTS' && (
            <ResidentsView
              residents={residents}
              timeline={timeline}
              records={records}
              selectedResidentId={selectedResidentId}
              onSelectResident={setSelectedResidentId}
              onOpenRecordForResident={handleOpenRecordModalWithResident}
              onUpdateResident={handleUpdateResident}
              onAddResident={handleAddResident}
              onResetResidents={handleResetResidents}
              onOpenGoogleDriveModal={() => setIsDriveModalOpen(true)}
              isGoogleDriveConnected={!!googleUser}
              isDriveSyncing={isDriveSyncing}
            />
          )}

          {activeMenu === 'RECORDS' && (
            <RecordsView
              records={records}
              residents={residents}
              onOpenRecordModal={() => {
                setRecordModalResidentId(selectedResidentId);
                setRecordModalInitialText(undefined);
                setIsRecordModalOpen(true);
              }}
              onDeleteRecord={handleDeleteRecord}
            />
          )}

          {activeMenu === 'CASE' && (
            <CaseManagementView
              caseItems={caseItems}
              residents={residents}
              selectedResidentId={selectedResidentId}
              onUpdateCaseItem={handleUpdateCaseItem}
            />
          )}

          {activeMenu === 'PROGRAMS' && (
            <ProgramsView
              programs={programs}
              onAddProgram={handleAddProgram}
              onUpdateProgram={handleUpdateProgram}
            />
          )}

          {activeMenu === 'HANDOVER' && (
            <HandoverView
              handover={handover}
              onUpdateHandover={setHandover}
            />
          )}

          {activeMenu === 'DOCUMENTS' && (
            <DocumentsView
              documents={documents}
              residents={residents}
              onAddDocument={handleAddDocument}
            />
          )}

          {activeMenu === 'STATS' && (
            <StatsEvaluationView stats={stats} />
          )}

          {activeMenu === 'STAFF' && (
            <StaffManagementView
              staffList={staffList}
              onUpdateStaff={handleUpdateStaff}
              onAddStaff={handleAddStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          )}
        </main>

        {/* High Density Theme Footer */}
        <footer className="h-12 bg-white border-t border-slate-200 flex items-center justify-between px-6 lg:px-8 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              실시간 동기화 중
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-500">
              {googleUser ? (
                <span className="text-emerald-700 font-medium">
                  ☁️ 구글 드라이브 연동됨 ({googleUser.email})
                </span>
              ) : (
                <span>🔒 로컬 암호화 보관 모드</span>
              )}
            </span>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-400 truncate">
            © 2026 WelfareFlow AI. Social Welfare Automation Platform
          </div>
        </footer>
      </div>

      {/* 1. One Input -> Multi Output Record Creator Modal */}
      <RecordCreatorModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setRecordModalInitialText(undefined);
        }}
        residents={residents}
        initialResidentId={recordModalResidentId}
        initialText={recordModalInitialText}
        onSaveRecord={handleSaveRecord}
      />

      {/* 2. Intelligent AI Assistant Chatbot Modal/Drawer */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        chatHistory={chatHistory}
        onSendMessage={handleSendAiMessage}
        isLoading={isAiChatLoading}
      />

      {/* 3. Google Drive Web Cloud Sync & Backup Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentUser={googleUser}
        accessToken={googleAccessToken}
        onAuthSuccess={(user, token) => {
          setGoogleUser(user);
          setGoogleAccessToken(token);
        }}
        onAuthLogout={() => {
          setGoogleUser(null);
          setGoogleAccessToken(null);
        }}
        currentAppData={currentAppDataPackage}
        onRestoreData={handleRestoreFromDrive}
        autoDriveSync={autoDriveSync}
        onToggleAutoDriveSync={handleToggleAutoDriveSync}
        lastSyncTime={lastDriveSyncTime}
        onSyncCompleted={(time) => {
          setLastDriveSyncTime(time);
          localStorage.setItem('welfareflow_last_drive_sync', time);
        }}
      />
    </div>
  );
}
