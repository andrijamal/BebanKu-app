import AsyncStorage from '@react-native-async-storage/async-storage';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  Exercise,
  MuscleCategory,
  Routine,
  WorkoutLog,
  AppSettings,
  ActiveWorkoutSession,
  BodyWeightLog,
} from '../types/workout';

const STORAGE_KEYS = {
  EXERCISES: '@bebanku_exercises_v1',
  MUSCLE_CATEGORIES: '@bebanku_muscle_categories_v1',
  ROUTINES: '@bebanku_routines_v1',
  HISTORY: '@bebanku_history_v1',
  SETTINGS: '@bebanku_settings_v1',
  ACTIVE_WORKOUT: '@bebanku_active_workout_v1',
  BODY_WEIGHT: '@bebanku_body_weight_v1',
};

export const DEFAULT_MUSCLE_CATEGORIES: MuscleCategory[] = [
  'Dada',
  'Punggung',
  'Kaki',
  'Bahu',
  'Tangan',
  'Core',
];

// 3-5 initial seed exercises as requested
export const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: 'ex-1',
    name: 'Bench Press',
    muscleCategory: 'Dada',
    equipment: 'Barbell',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-2',
    name: 'Squat',
    muscleCategory: 'Kaki',
    equipment: 'Barbell',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-3',
    name: 'Lat Pulldown',
    muscleCategory: 'Punggung',
    equipment: 'Mesin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-4',
    name: 'Overhead Press (OHP)',
    muscleCategory: 'Bahu',
    equipment: 'Barbell',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ex-5',
    name: 'Bicep Curl',
    muscleCategory: 'Tangan',
    equipment: 'Dumbbell',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'routine-1',
    name: 'Full Body Kickstart',
    description: 'Program dasar seluruh tubuh untuk membangun kekuatan awal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    exercises: [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Bench Press',
        muscleCategory: 'Dada',
        equipment: 'Barbell',
        targetSets: [
          { reps: 10, targetWeight: 40 },
          { reps: 10, targetWeight: 40 },
          { reps: 8, targetWeight: 45 },
        ],
      },
      {
        exerciseId: 'ex-2',
        exerciseName: 'Squat',
        muscleCategory: 'Kaki',
        equipment: 'Barbell',
        targetSets: [
          { reps: 10, targetWeight: 50 },
          { reps: 10, targetWeight: 50 },
          { reps: 8, targetWeight: 60 },
        ],
      },
      {
        exerciseId: 'ex-3',
        exerciseName: 'Lat Pulldown',
        muscleCategory: 'Punggung',
        equipment: 'Mesin',
        targetSets: [
          { reps: 12, targetWeight: 35 },
          { reps: 10, targetWeight: 40 },
          { reps: 10, targetWeight: 40 },
        ],
      },
    ],
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'id',
  weightUnit: 'kg',
  aiApiKey: '',
  aiProvider: 'gemini',
  defaultRestSeconds: 90,
};

export const StorageService = {
  async getExercises(): Promise<Exercise[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISES);
      if (!data) {
        await this.saveExercises(DEFAULT_EXERCISES);
        return DEFAULT_EXERCISES;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_EXERCISES;
    }
  },

  async saveExercises(exercises: Exercise[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
  },

  async getMuscleCategories(): Promise<MuscleCategory[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MUSCLE_CATEGORIES);
      if (!data) {
        await this.saveMuscleCategories(DEFAULT_MUSCLE_CATEGORIES);
        return DEFAULT_MUSCLE_CATEGORIES;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MUSCLE_CATEGORIES;
    } catch {
      return DEFAULT_MUSCLE_CATEGORIES;
    }
  },

  async saveMuscleCategories(categories: MuscleCategory[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.MUSCLE_CATEGORIES, JSON.stringify(categories));
  },

  async getRoutines(): Promise<Routine[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ROUTINES);
      if (!data) {
        await this.saveRoutines(DEFAULT_ROUTINES);
        return DEFAULT_ROUTINES;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_ROUTINES;
    }
  },

  async saveRoutines(routines: Routine[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
  },

  async getHistory(): Promise<WorkoutLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveHistory(history: WorkoutLog[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  async addWorkoutLog(log: WorkoutLog): Promise<void> {
    const history = await this.getHistory();
    const updated = [log, ...history];
    await this.saveHistory(updated);
  },

  async getBodyWeightLogs(): Promise<BodyWeightLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BODY_WEIGHT);
      if (!data) return [];
      const parsed: BodyWeightLog[] = JSON.parse(data);
      return parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch {
      return [];
    }
  },

  async saveBodyWeightLogs(logs: BodyWeightLog[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BODY_WEIGHT, JSON.stringify(logs));
  },

  async addBodyWeightLog(log: Omit<BodyWeightLog, 'id' | 'createdAt'>): Promise<BodyWeightLog> {
    const logs = await this.getBodyWeightLogs();
    const newLog: BodyWeightLog = {
      ...log,
      id: `bw-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...logs, newLog].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    await this.saveBodyWeightLogs(updated);
    return newLog;
  },

  async deleteBodyWeightLog(id: string): Promise<void> {
    const logs = await this.getBodyWeightLogs();
    const updated = logs.filter((l) => l.id !== id);
    await this.saveBodyWeightLogs(updated);
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  async getActiveWorkout(): Promise<ActiveWorkoutSession | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async saveActiveWorkout(session: ActiveWorkoutSession | null): Promise<void> {
    if (!session) {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, JSON.stringify(session));
    }
  },

  // Export all user data to a JSON backup file
  async exportBackup(): Promise<boolean> {
    try {
      const [exercises, muscleCategories, routines, history, bodyWeights, settings] =
        await Promise.all([
          this.getExercises(),
          this.getMuscleCategories(),
          this.getRoutines(),
          this.getHistory(),
          this.getBodyWeightLogs(),
          this.getSettings(),
        ]);

      const backupData = {
        app: 'BebanKu',
        version: '1.1.0',
        exportedAt: new Date().toISOString(),
        exercises,
        muscleCategories,
        routines,
        history,
        bodyWeights,
        settings,
      };

      const fileName = `BebanKu_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      const file = new File(Paths.document, fileName);
      await file.write(JSON.stringify(backupData, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'BebanKu Backup Export',
        });
      }
      return true;
    } catch (e) {
      console.error('Export backup error:', e);
      return false;
    }
  },

  // Import and restore from JSON string
  async importBackup(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.exercises || !Array.isArray(parsed.exercises)) {
        return false;
      }
      if (parsed.exercises) await this.saveExercises(parsed.exercises);
      if (parsed.muscleCategories && Array.isArray(parsed.muscleCategories)) {
        await this.saveMuscleCategories(parsed.muscleCategories);
      } else {
        const mergedCats = [...DEFAULT_MUSCLE_CATEGORIES];
        for (const ex of parsed.exercises) {
          const cat = typeof ex?.muscleCategory === 'string' ? ex.muscleCategory.trim() : '';
          if (cat && !mergedCats.some((c) => c.toLowerCase() === cat.toLowerCase())) {
            mergedCats.push(cat);
          }
        }
        await this.saveMuscleCategories(mergedCats);
      }
      if (parsed.routines) await this.saveRoutines(parsed.routines);
      if (parsed.history) await this.saveHistory(parsed.history);
      if (parsed.bodyWeights) await this.saveBodyWeightLogs(parsed.bodyWeights);
      if (parsed.settings) await this.saveSettings(parsed.settings);
      return true;
    } catch (e) {
      console.error('Import backup error:', e);
      return false;
    }
  },

  async resetAllToDefault(): Promise<void> {
    await AsyncStorage.clear();
    await this.saveExercises(DEFAULT_EXERCISES);
    await this.saveMuscleCategories(DEFAULT_MUSCLE_CATEGORIES);
    await this.saveRoutines(DEFAULT_ROUTINES);
    await this.saveSettings(DEFAULT_SETTINGS);
  },
};
