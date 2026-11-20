export type MuscleCategory =
  | 'Dada'
  | 'Punggung'
  | 'Kaki'
  | 'Bahu'
  | 'Tangan'
  | 'Core'
  | string;

export type EquipmentType =
  | 'Barbell'
  | 'Dumbbell'
  | 'Mesin'
  | 'Kabel'
  | 'Bodyweight'
  | string;

export interface Exercise {
  id: string;
  name: string;
  muscleCategory: MuscleCategory;
  equipment: EquipmentType;
  notes?: string;
  isCustom?: boolean;
  createdAt: string;
}

export interface RoutineExerciseSet {
  reps: number;
  targetWeight?: number;
}

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  muscleCategory: string;
  equipment: string;
  targetSets: RoutineExerciseSet[];
  notes?: string;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSetRecord {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutExerciseRecord {
  exerciseId: string;
  exerciseName: string;
  muscleCategory: string;
  equipment?: string;
  sets: WorkoutSetRecord[];
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  routineId?: string;
  routineName: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationSeconds: number;
  totalVolumeKg: number;
  exercises: WorkoutExerciseRecord[];
  notes?: string;
}

export interface ActiveWorkoutSet {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
  prevWeight?: number;
  prevReps?: number;
}

export interface ActiveWorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  muscleCategory: string;
  equipment: string;
  sets: ActiveWorkoutSet[];
  notes?: string;
}

export interface ActiveWorkoutSession {
  isActive: boolean;
  routineId?: string;
  routineName: string;
  startTime: number; // timestamp ms
  exercises: ActiveWorkoutExercise[];
  restTimerTarget?: number;
  restTimerSecondsLeft?: number;
  isRestTimerActive?: boolean;
}

export interface BodyWeightLog {
  id: string;
  weight: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface AppSettings {
  language: 'id' | 'en';
  weightUnit: 'kg' | 'lbs';
  aiApiKey: string;
  aiProvider: 'gemini' | 'openai';
  defaultRestSeconds: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}
