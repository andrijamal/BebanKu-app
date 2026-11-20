import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Exercise,
  Routine,
  WorkoutLog,
  AppSettings,
  ActiveWorkoutSession,
  ChatMessage,
  ActiveWorkoutExercise,
  ActiveWorkoutSet,
  BodyWeightLog,
} from '../types/workout';
import { StorageService, DEFAULT_SETTINGS } from '../services/storage';
import { translations, TranslationKey } from '../i18n/translations';
import { queryAiCoach } from '../services/aiCoach';

interface AppContextType {
  // Localization
  language: 'id' | 'en';
  setLanguage: (lang: 'id' | 'en') => Promise<void>;
  t: (key: TranslationKey) => string;

  // Exercises
  exercises: Exercise[];
  addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => Promise<Exercise>;
  updateExercise: (exercise: Exercise) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;

  // Routines
  routines: Routine[];
  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Routine>;
  updateRoutine: (routine: Routine) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;

  // History
  history: WorkoutLog[];
  deleteWorkoutLog: (id: string) => Promise<void>;

  // Body Weight
  bodyWeightLogs: BodyWeightLog[];
  addBodyWeightLog: (log: Omit<BodyWeightLog, 'id' | 'createdAt'>) => Promise<BodyWeightLog>;
  deleteBodyWeightLog: (id: string) => Promise<void>;

  // Active Workout
  activeWorkout: ActiveWorkoutSession | null;
  startActiveWorkout: (routine?: Routine) => Promise<void>;
  addExerciseToActiveWorkout: (exercise: Exercise) => void;
  removeExerciseFromActiveWorkout: (exerciseIdx: number) => void;
  updateActiveSet: (
    exerciseIdx: number,
    setIdx: number,
    field: keyof ActiveWorkoutSet,
    value: any
  ) => void;
  addSetToActiveExercise: (exerciseIdx: number) => void;
  removeSetFromActiveExercise: (exerciseIdx: number, setIdx: number) => void;
  finishActiveWorkout: () => Promise<WorkoutLog | null>;
  discardActiveWorkout: () => Promise<void>;
  getLastPerformance: (exerciseId: string) => { weight: number; reps: number } | null;

  // Rest Timer
  restSecondsLeft: number;
  isRestTimerRunning: boolean;
  startRestTimer: (seconds?: number) => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  stopRestTimer: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;

  // AI Chat
  chatMessages: ChatMessage[];
  isAiThinking: boolean;
  sendChatMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<'id' | 'en'>('id');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [bodyWeightLogs, setBodyWeightLogs] = useState<BodyWeightLog[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeWorkout, setActiveWorkoutState] = useState<ActiveWorkoutSession | null>(null);

  // Rest timer state
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Hydrate data on mount
  useEffect(() => {
    (async () => {
      const [exList, rList, histList, bwList, sett, actWk] = await Promise.all([
        StorageService.getExercises(),
        StorageService.getRoutines(),
        StorageService.getHistory(),
        StorageService.getBodyWeightLogs(),
        StorageService.getSettings(),
        StorageService.getActiveWorkout(),
      ]);

      setExercises(exList);
      setRoutines(rList);
      setHistory(histList);
      setBodyWeightLogs(bwList);
      setSettingsState(sett);
      setLangState(sett.language || 'id');
      if (actWk && actWk.isActive) {
        setActiveWorkoutState(actWk);
      }
    })();
  }, []);

  // Timer ticker
  useEffect(() => {
    if (isRestTimerRunning && restSecondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRestTimerRunning(false);
            // Trigger haptic vibration on finish
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRestTimerRunning, restSecondsLeft]);

  // Translation function
  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.id;
    return dict[key] || translations.id[key] || key;
  };

  const setLanguage = async (lang: 'id' | 'en') => {
    setLangState(lang);
    const updated = { ...settings, language: lang };
    setSettingsState(updated);
    await StorageService.saveSettings(updated);
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    if (newSettings.language) {
      setLangState(newSettings.language);
    }
    await StorageService.saveSettings(updated);
  };

  const resetAllData = async () => {
    await StorageService.resetAllToDefault();
    const [exList, rList, sett] = await Promise.all([
      StorageService.getExercises(),
      StorageService.getRoutines(),
      StorageService.getSettings(),
    ]);
    setExercises(exList);
    setRoutines(rList);
    setHistory([]);
    setBodyWeightLogs([]);
    setActiveWorkoutState(null);
    setSettingsState(sett);
    setLangState(sett.language);
    setChatMessages([]);
  };

  // Exercises
  const addExercise = async (exercise: Omit<Exercise, 'id' | 'createdAt'>): Promise<Exercise> => {
    const newEx: Exercise = {
      ...exercise,
      id: `ex-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isCustom: true,
    };
    const updated = [newEx, ...exercises];
    setExercises(updated);
    await StorageService.saveExercises(updated);
    return newEx;
  };

  const updateExercise = async (exercise: Exercise) => {
    const updated = exercises.map((e) => (e.id === exercise.id ? exercise : e));
    setExercises(updated);
    await StorageService.saveExercises(updated);
  };

  const deleteExercise = async (id: string) => {
    const updated = exercises.filter((e) => e.id !== id);
    setExercises(updated);
    await StorageService.saveExercises(updated);
  };

  // Routines
  const addRoutine = async (
    routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Routine> => {
    const newR: Routine = {
      ...routine,
      id: `routine-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newR, ...routines];
    setRoutines(updated);
    await StorageService.saveRoutines(updated);
    return newR;
  };

  const updateRoutine = async (routine: Routine) => {
    const updated = routines.map((r) =>
      r.id === routine.id ? { ...routine, updatedAt: new Date().toISOString() } : r
    );
    setRoutines(updated);
    await StorageService.saveRoutines(updated);
  };

  const deleteRoutine = async (id: string) => {
    const updated = routines.filter((r) => r.id !== id);
    setRoutines(updated);
    await StorageService.saveRoutines(updated);
  };

  // History
  const deleteWorkoutLog = async (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    await StorageService.saveHistory(updated);
  };

  // Body Weight
  const addBodyWeightLog = async (
    log: Omit<BodyWeightLog, 'id' | 'createdAt'>
  ): Promise<BodyWeightLog> => {
    const saved = await StorageService.addBodyWeightLog(log);
    const updated = await StorageService.getBodyWeightLogs();
    setBodyWeightLogs(updated);
    return saved;
  };

  const deleteBodyWeightLog = async (id: string) => {
    await StorageService.deleteBodyWeightLog(id);
    const updated = await StorageService.getBodyWeightLogs();
    setBodyWeightLogs(updated);
  };

  // Helper: Find last weight & reps logged for an exercise
  const getLastPerformance = (exerciseId: string): { weight: number; reps: number } | null => {
    for (const log of history) {
      for (const ex of log.exercises) {
        if (ex.exerciseId === exerciseId) {
          const completedSets = ex.sets.filter((s) => s.completed && s.weight > 0);
          if (completedSets.length > 0) {
            const bestSet = [...completedSets].sort((a, b) => b.weight - a.weight)[0];
            return { weight: bestSet.weight, reps: bestSet.reps };
          }
        }
      }
    }
    return null;
  };

  // Active Workout Management
  const startActiveWorkout = async (routine?: Routine) => {
    let exercisesToStart: ActiveWorkoutExercise[] = [];

    if (routine) {
      exercisesToStart = routine.exercises.map((re) => {
        const lastPerf = getLastPerformance(re.exerciseId);
        return {
          exerciseId: re.exerciseId,
          exerciseName: re.exerciseName,
          muscleCategory: re.muscleCategory,
          equipment: re.equipment,
          notes: re.notes || '',
          sets: re.targetSets.map((ts, idx) => ({
            id: `set-${idx}-${Date.now()}`,
            weight: ts.targetWeight ? String(ts.targetWeight) : lastPerf?.weight ? String(lastPerf.weight) : '',
            reps: ts.reps ? String(ts.reps) : lastPerf?.reps ? String(lastPerf.reps) : '',
            completed: false,
            prevWeight: lastPerf?.weight,
            prevReps: lastPerf?.reps,
          })),
        };
      });
    }

    const session: ActiveWorkoutSession = {
      isActive: true,
      routineId: routine?.id,
      routineName: routine ? routine.name : language === 'id' ? 'Latihan Spontan' : 'Quick Workout',
      startTime: Date.now(),
      exercises: exercisesToStart,
    };

    setActiveWorkoutState(session);
    await StorageService.saveActiveWorkout(session);
  };

  const addExerciseToActiveWorkout = (exercise: Exercise) => {
    if (!activeWorkout) return;
    const lastPerf = getLastPerformance(exercise.id);
    const newEx: ActiveWorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleCategory: exercise.muscleCategory,
      equipment: exercise.equipment,
      notes: '',
      sets: [
        {
          id: `set-0-${Date.now()}`,
          weight: lastPerf?.weight ? String(lastPerf.weight) : '',
          reps: lastPerf?.reps ? String(lastPerf.reps) : '',
          completed: false,
          prevWeight: lastPerf?.weight,
          prevReps: lastPerf?.reps,
        },
      ],
    };

    const updated: ActiveWorkoutSession = {
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, newEx],
    };
    setActiveWorkoutState(updated);
    StorageService.saveActiveWorkout(updated);
  };

  const removeExerciseFromActiveWorkout = (exerciseIdx: number) => {
    if (!activeWorkout) return;
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises.splice(exerciseIdx, 1);
    const updated = { ...activeWorkout, exercises: updatedExercises };
    setActiveWorkoutState(updated);
    StorageService.saveActiveWorkout(updated);
  };

  const updateActiveSet = (
    exerciseIdx: number,
    setIdx: number,
    field: keyof ActiveWorkoutSet,
    value: any
  ) => {
    if (!activeWorkout) return;
    const updatedExercises = [...activeWorkout.exercises];
    const targetEx = { ...updatedExercises[exerciseIdx] };
    const targetSets = [...targetEx.sets];
    const oldSet = targetSets[setIdx];

    targetSets[setIdx] = { ...oldSet, [field]: value };
    targetEx.sets = targetSets;
    updatedExercises[exerciseIdx] = targetEx;

    const updated = { ...activeWorkout, exercises: updatedExercises };
    setActiveWorkoutState(updated);
    StorageService.saveActiveWorkout(updated);

    // If set was just marked completed, trigger rest timer and haptic feedback
    if (field === 'completed' && value === true) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      startRestTimer(settings.defaultRestSeconds || 90);
    }
  };

  const addSetToActiveExercise = (exerciseIdx: number) => {
    if (!activeWorkout) return;
    const updatedExercises = [...activeWorkout.exercises];
    const targetEx = { ...updatedExercises[exerciseIdx] };
    const prevSet = targetEx.sets[targetEx.sets.length - 1];

    const newSet: ActiveWorkoutSet = {
      id: `set-${targetEx.sets.length}-${Date.now()}`,
      weight: prevSet?.weight || '',
      reps: prevSet?.reps || '',
      completed: false,
      prevWeight: prevSet?.prevWeight,
      prevReps: prevSet?.prevReps,
    };

    targetEx.sets = [...targetEx.sets, newSet];
    updatedExercises[exerciseIdx] = targetEx;

    const updated = { ...activeWorkout, exercises: updatedExercises };
    setActiveWorkoutState(updated);
    StorageService.saveActiveWorkout(updated);
  };

  const removeSetFromActiveExercise = (exerciseIdx: number, setIdx: number) => {
    if (!activeWorkout) return;
    const updatedExercises = [...activeWorkout.exercises];
    const targetEx = { ...updatedExercises[exerciseIdx] };
    if (targetEx.sets.length <= 1) return; // Keep at least one set
    targetEx.sets.splice(setIdx, 1);
    updatedExercises[exerciseIdx] = targetEx;

    const updated = { ...activeWorkout, exercises: updatedExercises };
    setActiveWorkoutState(updated);
    StorageService.saveActiveWorkout(updated);
  };

  const finishActiveWorkout = async (): Promise<WorkoutLog | null> => {
    if (!activeWorkout) return null;

    const now = Date.now();
    const durationSeconds = Math.max(1, Math.round((now - activeWorkout.startTime) / 1000));

    let totalVolume = 0;
    const finishedExercises = activeWorkout.exercises
      .map((ex) => {
        const completedSets = ex.sets
          .filter((s) => s.completed || (parseFloat(s.weight) > 0 && parseInt(s.reps, 10) > 0))
          .map((s, idx) => {
            const weightNum = parseFloat(s.weight) || 0;
            const repsNum = parseInt(s.reps, 10) || 0;
            totalVolume += weightNum * repsNum;
            return {
              setNumber: idx + 1,
              weight: weightNum,
              reps: repsNum,
              completed: true,
            };
          });

        return {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          muscleCategory: ex.muscleCategory,
          equipment: ex.equipment,
          sets: completedSets,
          notes: ex.notes,
        };
      })
      .filter((ex) => ex.sets.length > 0);

    const log: WorkoutLog = {
      id: `log-${now}`,
      routineId: activeWorkout.routineId,
      routineName: activeWorkout.routineName,
      startTime: new Date(activeWorkout.startTime).toISOString(),
      endTime: new Date(now).toISOString(),
      durationSeconds,
      totalVolumeKg: Math.round(totalVolume),
      exercises: finishedExercises,
    };

    await StorageService.addWorkoutLog(log);
    const updatedHistory = [log, ...history];
    setHistory(updatedHistory);

    setActiveWorkoutState(null);
    await StorageService.saveActiveWorkout(null);
    stopRestTimer();

    return log;
  };

  const discardActiveWorkout = async () => {
    setActiveWorkoutState(null);
    await StorageService.saveActiveWorkout(null);
    stopRestTimer();
  };

  // Rest Timer Controls
  const startRestTimer = (seconds?: number) => {
    const sec = seconds !== undefined ? seconds : settings.defaultRestSeconds || 90;
    setRestSecondsLeft(sec);
    setIsRestTimerRunning(true);
  };

  const adjustRestTimer = (deltaSeconds: number) => {
    setRestSecondsLeft((prev) => Math.max(0, prev + deltaSeconds));
  };

  const stopRestTimer = () => {
    setIsRestTimerRunning(false);
    setRestSecondsLeft(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // AI Chat
  const sendChatMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsAiThinking(true);

    try {
      const replyText = await queryAiCoach(text, history, exercises, settings, bodyWeightLogs);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text:
          language === 'id'
            ? `Maaf, terjadi kesalahan: ${e?.message || 'Gagal memproses pertanyaan'}`
            : `Sorry, an error occurred: ${e?.message || 'Failed to process request'}`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        exercises,
        addExercise,
        updateExercise,
        deleteExercise,
        routines,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        history,
        deleteWorkoutLog,
        bodyWeightLogs,
        addBodyWeightLog,
        deleteBodyWeightLog,
        activeWorkout,
        startActiveWorkout,
        addExerciseToActiveWorkout,
        removeExerciseFromActiveWorkout,
        updateActiveSet,
        addSetToActiveExercise,
        removeSetFromActiveExercise,
        finishActiveWorkout,
        discardActiveWorkout,
        getLastPerformance,
        restSecondsLeft,
        isRestTimerRunning,
        startRestTimer,
        adjustRestTimer,
        stopRestTimer,
        settings,
        updateSettings,
        resetAllData,
        chatMessages,
        isAiThinking,
        sendChatMessage,
        clearChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
