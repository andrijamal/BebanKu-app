import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { Colors } from '../constants/Colors';
import { Exercise } from '../types/workout';
import { RestTimerOverlay } from '../components/RestTimerOverlay';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const {
    activeWorkout,
    addExerciseToActiveWorkout,
    removeExerciseFromActiveWorkout,
    updateActiveSet,
    addSetToActiveExercise,
    removeSetFromActiveExercise,
    finishActiveWorkout,
    discardActiveWorkout,
    exercises,
    t,
  } = useApp();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [discardModalVisible, setDiscardModalVisible] = useState(false);
  const [searchExercise, setSearchExercise] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Live workout timer ticker
  useEffect(() => {
    if (!activeWorkout || !activeWorkout.isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const sec = Math.floor((now - activeWorkout.startTime) / 1000);
      setElapsedSeconds(sec);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout]);

  if (!activeWorkout || !activeWorkout.isActive) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredContainer}>
          <Ionicons name="barbell-outline" size={54} color={Colors.textDim} />
          <Text style={styles.noActiveTitle}>Tidak ada sesi latihan aktif</Text>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.backHomeBtnText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleFinishPress = () => {
    setSaveError(false);
    setFinishModalVisible(true);
  };

  const confirmAndSaveWorkout = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((error) => {
      console.warn('Workout completion haptics failed:', error);
    });

    try {
      const workoutLog = await finishActiveWorkout();
      if (!workoutLog) {
        setSaveError(true);
        return;
      }

      setFinishModalVisible(false);
      router.replace('/(tabs)/history');
    } catch (error) {
      console.error('Failed to save workout history:', error);
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardPress = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      const ok = window.confirm(t('discardWorkoutConfirm'));
      if (ok) {
        confirmAndDiscardWorkout();
        return;
      }
    }
    setDiscardModalVisible(true);
  };

  const confirmAndDiscardWorkout = async () => {
    setDiscardModalVisible(false);
    await discardActiveWorkout();
    router.replace('/(tabs)');
  };

  const handleSelectExercise = (ex: Exercise) => {
    addExerciseToActiveWorkout(ex);
    setExerciseModalVisible(false);
  };

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchExercise.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.routineTitle} numberOfLines={1}>
            {activeWorkout.routineName}
          </Text>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={14} color={Colors.primary} />
            <Text style={styles.timerText}>{formatElapsed(elapsedSeconds)}</Text>
          </View>
        </View>

        <View style={styles.headerActionRow}>
          <TouchableOpacity
            style={styles.discardBtn}
            onPress={handleDiscardPress}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={20} color={Colors.danger} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.finishBtn}
            onPress={handleFinishPress}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={18} color={Colors.primaryText} />
            <Text style={styles.finishBtnText}>{t('done')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Exercises List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeWorkout.exercises.map((item, exIdx) => (
          <View key={`${item.exerciseId}-${exIdx}`} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{item.exerciseName}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.muscleCategory}</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeSec]}>
                    <Text style={styles.badgeSecText}>{item.equipment}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.removeExBtn}
                onPress={() => removeExerciseFromActiveWorkout(exIdx)}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Set Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCol, styles.colSet]}>SET</Text>
              <Text style={[styles.tableCol, styles.colPrev]}>{t('previousBest')}</Text>
              <Text style={[styles.tableCol, styles.colWeight]}>KG</Text>
              <Text style={[styles.tableCol, styles.colReps]}>REPS</Text>
              <Text style={[styles.tableCol, styles.colCheck]}>✓</Text>
            </View>

            {/* Set Rows */}
            {item.sets.map((set, setIdx) => (
              <View
                key={set.id}
                style={[
                  styles.setRow,
                  set.completed && styles.setRowCompleted,
                ]}
              >
                <Text style={styles.setIndexText}>{setIdx + 1}</Text>

                <Text style={styles.prevText}>
                  {set.prevWeight ? `${set.prevWeight}k x ${set.prevReps}` : '-'}
                </Text>

                <TextInput
                  style={[styles.numericInput, set.completed && styles.numericInputCompleted]}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textDim}
                  value={set.weight}
                  onChangeText={(val) => updateActiveSet(exIdx, setIdx, 'weight', val)}
                />

                <TextInput
                  style={[styles.numericInput, set.completed && styles.numericInputCompleted]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textDim}
                  value={set.reps}
                  onChangeText={(val) => updateActiveSet(exIdx, setIdx, 'reps', val)}
                />

                <TouchableOpacity
                  style={[
                    styles.checkButton,
                    set.completed && styles.checkButtonActive,
                  ]}
                  onPress={() =>
                    updateActiveSet(exIdx, setIdx, 'completed', !set.completed)
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={set.completed ? Colors.primaryText : Colors.textMuted}
                  />
                </TouchableOpacity>

                {item.sets.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeSetBtn}
                    onPress={() => removeSetFromActiveExercise(exIdx, setIdx)}
                  >
                    <Ionicons name="close" size={16} color={Colors.textDim} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Bottom Add Set Button */}
            <TouchableOpacity
              style={styles.addSetBtn}
              onPress={() => addSetToActiveExercise(exIdx)}
            >
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addSetBtnText}>{t('addSet')}</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Big Add Exercise Button */}
        <TouchableOpacity
          style={styles.addExerciseMainBtn}
          onPress={() => setExerciseModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={24} color={Colors.primaryText} />
          <Text style={styles.addExerciseMainBtnText}>
            {t('addExerciseToWorkout')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal: Konfirmasi Selesai Latihan */}
      <Modal visible={finishModalVisible} transparent animationType="fade">
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalCard}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="checkmark-done" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.confirmTitle}>{t('finishWorkout')}</Text>
            <Text style={[styles.confirmMessage, saveError && styles.confirmErrorMessage]}>
              {saveError ? t('workoutSaveError') : t('finishWorkoutConfirm')}
            </Text>

            <View style={styles.confirmStatsRow}>
              <View style={styles.confirmStatItem}>
                <Text style={styles.confirmStatLabel}>{t('duration')}</Text>
                <Text style={styles.confirmStatVal}>{formatElapsed(elapsedSeconds)}</Text>
              </View>
              <View style={styles.confirmStatItem}>
                <Text style={styles.confirmStatLabel}>{t('tabExercises')}</Text>
                <Text style={styles.confirmStatVal}>{activeWorkout.exercises.length}</Text>
              </View>
            </View>

            <View style={styles.confirmButtonRow}>
              <TouchableOpacity
                style={styles.cancelConfirmBtn}
                onPress={() => {
                  setFinishModalVisible(false);
                  setSaveError(false);
                }}
              >
                <Text style={styles.cancelConfirmBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveConfirmBtn}
                onPress={confirmAndSaveWorkout}
                disabled={isSaving}
              >
                <Text style={styles.saveConfirmBtnText}>
                  {isSaving ? 'Menyimpan...' : t('finishWorkout')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Konfirmasi Batal Latihan */}
      <Modal visible={discardModalVisible} transparent animationType="fade">
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalCard}>
            <View style={[styles.confirmIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="alert-circle-outline" size={32} color={Colors.danger} />
            </View>
            <Text style={styles.confirmTitle}>{t('discardWorkout')}</Text>
            <Text style={styles.confirmMessage}>{t('discardWorkoutConfirm')}</Text>

            <View style={styles.confirmButtonRow}>
              <TouchableOpacity
                style={styles.cancelConfirmBtn}
                onPress={() => setDiscardModalVisible(false)}
              >
                <Text style={styles.cancelConfirmBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveConfirmBtn, { backgroundColor: Colors.danger }]}
                onPress={confirmAndDiscardWorkout}
              >
                <Text style={styles.saveConfirmBtnText}>{t('discardWorkout')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exercise Picker Modal */}
      <Modal visible={exerciseModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('tabExercises')}</Text>
              <TouchableOpacity onPress={() => setExerciseModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder={t('search')}
              placeholderTextColor={Colors.textDim}
              value={searchExercise}
              onChangeText={setSearchExercise}
            />

            <ScrollView style={{ maxHeight: 400 }}>
              {filteredExercises.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.exercisePickerItem}
                  onPress={() => handleSelectExercise(ex)}
                >
                  <View>
                    <Text style={styles.pickerExName}>{ex.name}</Text>
                    <Text style={styles.pickerExMeta}>
                      {ex.muscleCategory} • {ex.equipment}
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rest Timer Overlay */}
      <RestTimerOverlay />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  timerText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  discardBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  finishBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  finishBtnText: {
    color: Colors.primaryText,
    fontSize: 13,
    fontWeight: '800',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  exerciseCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(190, 242, 100, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeSec: {
    backgroundColor: Colors.cardElevated,
  },
  badgeSecText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  removeExBtn: {
    padding: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 8,
  },
  tableCol: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textDim,
    textAlign: 'center',
  },
  colSet: { width: 36 },
  colPrev: { flex: 1.2, textAlign: 'left', paddingLeft: 4 },
  colWeight: { flex: 1 },
  colReps: { flex: 1 },
  colCheck: { width: 44 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(190, 242, 100, 0.08)',
  },
  setIndexText: {
    width: 36,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  prevText: {
    flex: 1.2,
    color: Colors.textDim,
    fontSize: 11,
    paddingLeft: 4,
  },
  numericInput: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8,
    marginHorizontal: 3,
    height: 42,
    textAlign: 'center',
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  numericInputCompleted: {
    borderColor: Colors.primary,
  },
  checkButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  checkButtonActive: {
    backgroundColor: Colors.primary,
  },
  removeSetBtn: {
    padding: 4,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: Colors.cardElevated,
    gap: 6,
  },
  addSetBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  addExerciseMainBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  addExerciseMainBtnText: {
    color: Colors.primaryText,
    fontSize: 16,
    fontWeight: '900',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noActiveTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 20,
  },
  backHomeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backHomeBtnText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontWeight: '800',
  },
  // Modal Confirm Styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  confirmIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  confirmErrorMessage: {
    color: Colors.danger,
  },
  confirmStatsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 20,
  },
  confirmStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  confirmStatLabel: {
    fontSize: 11,
    color: Colors.textDim,
    fontWeight: '600',
  },
  confirmStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
  confirmButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelConfirmBtn: {
    flex: 1,
    backgroundColor: Colors.cardElevated,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelConfirmBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  saveConfirmBtn: {
    flex: 1.5,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveConfirmBtnText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontWeight: '800',
  },
  // Modal General Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSearchInput: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  exercisePickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerExName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  pickerExMeta: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 2,
  },
});
