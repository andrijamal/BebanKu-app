import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Colors } from '../constants/Colors';
import { Exercise, RoutineExercise } from '../types/workout';

export default function RoutineEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { routines, addRoutine, updateRoutine, exercises, t } = useApp();

  const [routineName, setRoutineName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchExercise, setSearchExercise] = useState('');

  // If editing an existing routine
  useEffect(() => {
    if (id) {
      const existing = routines.find((r) => r.id === id);
      if (existing) {
        setRoutineName(existing.name);
        setDescription(existing.description || '');
        setSelectedExercises(existing.exercises);
      }
    }
  }, [id, routines]);

  const handleAddExerciseToRoutine = (ex: Exercise) => {
    const newRoutineEx: RoutineExercise = {
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscleCategory: ex.muscleCategory,
      equipment: ex.equipment,
      targetSets: [
        { reps: 10, targetWeight: 20 },
        { reps: 10, targetWeight: 20 },
        { reps: 10, targetWeight: 20 },
      ],
    };
    setSelectedExercises([...selectedExercises, newRoutineEx]);
    setModalVisible(false);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = [...selectedExercises];
    updated.splice(index, 1);
    setSelectedExercises(updated);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updated = [...selectedExercises];
    const target = { ...updated[exerciseIndex] };
    const prevSet = target.targetSets[target.targetSets.length - 1];
    target.targetSets = [
      ...target.targetSets,
      { reps: prevSet?.reps || 10, targetWeight: prevSet?.targetWeight || 20 },
    ];
    updated[exerciseIndex] = target;
    setSelectedExercises(updated);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...selectedExercises];
    const target = { ...updated[exerciseIndex] };
    if (target.targetSets.length <= 1) return;
    target.targetSets.splice(setIndex, 1);
    updated[exerciseIndex] = target;
    setSelectedExercises(updated);
  };

  const handleSave = async () => {
    if (!routineName.trim()) {
      Alert.alert('Perhatian', 'Nama program latihan tidak boleh kosong!');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert('Perhatian', 'Tambahkan minimal satu gerakan ke program ini!');
      return;
    }

    if (id) {
      await updateRoutine({
        id,
        name: routineName.trim(),
        description: description.trim(),
        exercises: selectedExercises,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await addRoutine({
        name: routineName.trim(),
        description: description.trim(),
        exercises: selectedExercises,
      });
    }

    router.back();
  };

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchExercise.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {id ? t('editRoutine') : t('createRoutine')}
        </Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
          <Text style={styles.saveHeaderBtnText}>{t('save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.inputLabel}>{t('routineName')}</Text>
        <TextInput
          style={styles.textInput}
          placeholder={t('routineNamePlaceholder')}
          placeholderTextColor={Colors.textDim}
          value={routineName}
          onChangeText={setRoutineName}
        />

        <Text style={styles.inputLabel}>Deskripsi</Text>
        <TextInput
          style={[styles.textInput, { height: 70 }]}
          placeholder={t('routineDescPlaceholder')}
          placeholderTextColor={Colors.textDim}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('exercisesInRoutine')}</Text>
          <TouchableOpacity
            style={styles.addExBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={16} color={Colors.primaryText} />
            <Text style={styles.addExBtnText}>{t('add')}</Text>
          </TouchableOpacity>
        </View>

        {selectedExercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={40} color={Colors.textDim} />
            <Text style={styles.emptyText}>{t('noExercisesInRoutine')}</Text>
          </View>
        ) : (
          selectedExercises.map((item, exIdx) => (
            <View key={`${item.exerciseId}-${exIdx}`} style={styles.exerciseCard}>
              <View style={styles.exCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exCardName}>{item.exerciseName}</Text>
                  <Text style={styles.exCardMeta}>
                    {item.muscleCategory} • {item.equipment}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveExercise(exIdx)}
                  style={styles.deleteExBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>

              <View style={styles.setsList}>
                {item.targetSets.map((ts, sIdx) => (
                  <View key={sIdx} style={styles.setRow}>
                    <Text style={styles.setRowIndex}>Set {sIdx + 1}</Text>
                    <Text style={styles.setTargetText}>
                      Target: {ts.reps} reps
                    </Text>
                    {item.targetSets.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveSet(exIdx, sIdx)}
                        style={styles.removeSetBtn}
                      >
                        <Ionicons name="close" size={16} color={Colors.textDim} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.addSetBtn}
                onPress={() => handleAddSet(exIdx)}
              >
                <Ionicons name="add" size={14} color={Colors.primary} />
                <Text style={styles.addSetBtnText}>{t('addSet')}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal: Exercise Selector */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('tabExercises')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearch}
              placeholder={t('search')}
              placeholderTextColor={Colors.textDim}
              value={searchExercise}
              onChangeText={setSearchExercise}
            />

            <ScrollView style={{ maxHeight: 400 }}>
              {filteredExercises.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.modalItem}
                  onPress={() => handleAddExerciseToRoutine(ex)}
                >
                  <View>
                    <Text style={styles.modalItemName}>{ex.name}</Text>
                    <Text style={styles.modalItemMeta}>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  saveHeaderBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveHeaderBtnText: {
    color: Colors.primaryText,
    fontSize: 13,
    fontWeight: '800',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  addExBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addExBtnText: {
    color: Colors.primaryText,
    fontSize: 12,
    fontWeight: '800',
  },
  exerciseCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  exCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  exCardName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  exCardMeta: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 2,
  },
  deleteExBtn: {
    padding: 6,
  },
  setsList: {
    gap: 6,
    marginBottom: 10,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  setRowIndex: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  setTargetText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  removeSetBtn: {
    padding: 4,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.cardElevated,
    gap: 4,
  },
  addSetBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderLight,
    borderRadius: 14,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
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
  modalSearch: {
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
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  modalItemMeta: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 2,
  },
});

