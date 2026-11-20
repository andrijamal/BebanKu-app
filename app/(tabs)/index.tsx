import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Colors } from '../../constants/Colors';
import { AppHeader } from '../../components/AppHeader';

export default function WorkoutHomeScreen() {
  const { routines, startActiveWorkout, activeWorkout, t } = useApp();
  const router = useRouter();

  const handleStartQuickWorkout = async () => {
    await startActiveWorkout();
    router.push('/active-workout');
  };

  const handleStartRoutine = async (routine: any) => {
    await startActiveWorkout(routine);
    router.push('/active-workout');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Workout Button */}
        <TouchableOpacity
          style={styles.quickWorkoutCard}
          onPress={handleStartQuickWorkout}
          activeOpacity={0.85}
        >
          <View style={styles.quickCardTop}>
            <View style={styles.quickIconCircle}>
              <Ionicons name="flash" size={28} color={Colors.primaryText} />
            </View>
            <View style={styles.quickBadge}>
              <Text style={styles.quickBadgeText}>EMPTY SESSION</Text>
            </View>
          </View>
          <Text style={styles.quickTitle}>{t('quickWorkout')}</Text>
          <Text style={styles.quickSubtitle}>{t('quickWorkoutSubtitle')}</Text>
          <View style={styles.quickActionRow}>
            <Text style={styles.quickActionText}>{t('startWorkout')}</Text>
            <Ionicons name="arrow-forward-circle" size={24} color={Colors.primaryText} />
          </View>
        </TouchableOpacity>

        {/* Section: Start from Saved Routine */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('startFromRoutine')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/routine-editor')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.sectionLink}>{t('createRoutine')}</Text>
          </TouchableOpacity>
        </View>

        {routines.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="barbell-outline" size={42} color={Colors.textDim} />
            <Text style={styles.emptyText}>{t('noRoutinesYet')}</Text>
            <TouchableOpacity
              style={styles.createRoutineBtn}
              onPress={() => router.push('/routine-editor')}
            >
              <Ionicons name="add" size={18} color={Colors.primaryText} />
              <Text style={styles.createRoutineBtnText}>{t('createRoutine')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          routines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <View style={styles.routineHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineTitle}>{routine.name}</Text>
                  {routine.description ? (
                    <Text style={styles.routineDesc} numberOfLines={2}>
                      {routine.description}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* List of preview exercises */}
              <View style={styles.previewExerciseList}>
                {routine.exercises.map((re, idx) => (
                  <View key={`${re.exerciseId}-${idx}`} style={styles.previewChip}>
                    <Text style={styles.previewChipText} numberOfLines={1}>
                      {re.exerciseName} ({re.targetSets.length} set)
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.startRoutineBtn}
                onPress={() => handleStartRoutine(routine)}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={18} color={Colors.primaryText} />
                <Text style={styles.startRoutineBtnText}>
                  {t('startWorkout')} - {routine.name}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  quickWorkoutCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  quickCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBadge: {
    backgroundColor: Colors.primaryText,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  quickTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primaryText,
    marginBottom: 4,
  },
  quickSubtitle: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    marginBottom: 16,
    lineHeight: 18,
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  routineCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routineTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 3,
  },
  routineDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  previewExerciseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  previewChip: {
    backgroundColor: Colors.cardElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewChipText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  startRoutineBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  startRoutineBtnText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderLight,
    marginTop: 8,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 16,
    lineHeight: 18,
  },
  createRoutineBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  createRoutineBtnText: {
    color: Colors.primaryText,
    fontSize: 13,
    fontWeight: '800',
  },
});
