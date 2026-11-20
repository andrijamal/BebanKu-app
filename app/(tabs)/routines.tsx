import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Colors } from '../../constants/Colors';
import { AppHeader } from '../../components/AppHeader';

export default function RoutinesScreen() {
  const { routines, deleteRoutine, startActiveWorkout, t } = useApp();
  const router = useRouter();

  const handleStartRoutine = async (routine: any) => {
    await startActiveWorkout(routine);
    router.push('/active-workout');
  };

  const confirmDelete = (routineId: string, routineName: string) => {
    Alert.alert(
      t('delete'),
      `${t('deleteRoutineConfirm')} (${routineName})`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteRoutine(routineId),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title={t('routinesTitle')} subtitle={t('routinesSubtitle')} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/routine-editor')}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={22} color={Colors.primaryText} />
          <Text style={styles.createButtonText}>{t('createRoutine')}</Text>
        </TouchableOpacity>

        {routines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textDim} />
            <Text style={styles.emptyText}>{t('noRoutinesYet')}</Text>
          </View>
        ) : (
          routines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineName}>{routine.name}</Text>
                  {routine.description ? (
                    <Text style={styles.routineDesc}>{routine.description}</Text>
                  ) : null}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => router.push({ pathname: '/routine-editor', params: { id: routine.id } })}
                  >
                    <Ionicons name="create-outline" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => confirmDelete(routine.id, routine.name)}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.exerciseList}>
                {routine.exercises.map((item, idx) => (
                  <View key={`${item.exerciseId}-${idx}`} style={styles.exerciseRow}>
                    <View style={styles.exerciseIndex}>
                      <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseNameText}>{item.exerciseName}</Text>
                      <Text style={styles.exerciseMetaText}>
                        {item.muscleCategory} • {item.equipment} • {item.targetSets.length} sets
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => handleStartRoutine(routine)}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={16} color={Colors.primaryText} />
                <Text style={styles.startBtnText}>{t('startWorkout')}</Text>
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
  createButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: Colors.primaryText,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderLight,
    borderRadius: 16,
    marginTop: 10,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  routineCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  routineDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.cardElevated,
  },
  exerciseList: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    padding: 8,
    marginBottom: 14,
    gap: 6,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 10,
  },
  exerciseIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIndexText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  exerciseNameText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  exerciseMetaText: {
    color: Colors.textDim,
    fontSize: 11,
    marginTop: 1,
  },
  startBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  startBtnText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontWeight: '800',
  },
});

