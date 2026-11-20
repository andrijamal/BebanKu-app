import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { Colors } from '../../constants/Colors';
import { AppHeader } from '../../components/AppHeader';
import { Exercise, MuscleCategory, EquipmentType } from '../../types/workout';

const STANDARD_CATEGORIES: MuscleCategory[] = [
  'Dada',
  'Punggung',
  'Kaki',
  'Bahu',
  'Tangan',
  'Core',
];

const STANDARD_EQUIPMENT: EquipmentType[] = [
  'Barbell',
  'Dumbbell',
  'Mesin',
  'Kabel',
  'Bodyweight',
];

export default function ExercisesScreen() {
  const { exercises, addExercise, updateExercise, deleteExercise, t } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('All');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [muscleCategoryInput, setMuscleCategoryInput] = useState<string>('Dada');
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [equipmentInput, setEquipmentInput] = useState<string>('Barbell');

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedFilterCategory === 'All' || ex.muscleCategory === selectedFilterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchQuery, selectedFilterCategory]);

  const openCreateModal = () => {
    setEditingExercise(null);
    setNameInput('');
    setMuscleCategoryInput('Dada');
    setCustomCategoryText('');
    setEquipmentInput('Barbell');
    setModalVisible(true);
  };

  const openEditModal = (ex: Exercise) => {
    setEditingExercise(ex);
    setNameInput(ex.name);
    if (STANDARD_CATEGORIES.includes(ex.muscleCategory)) {
      setMuscleCategoryInput(ex.muscleCategory);
      setCustomCategoryText('');
    } else {
      setMuscleCategoryInput('Custom');
      setCustomCategoryText(ex.muscleCategory);
    }
    setEquipmentInput(ex.equipment);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Perhatian', 'Nama gerakan tidak boleh kosong!');
      return;
    }

    const finalCategory =
      muscleCategoryInput === 'Custom'
        ? customCategoryText.trim() || 'Lainnya'
        : muscleCategoryInput;

    if (editingExercise) {
      await updateExercise({
        ...editingExercise,
        name: nameInput.trim(),
        muscleCategory: finalCategory,
        equipment: equipmentInput,
      });
    } else {
      await addExercise({
        name: nameInput.trim(),
        muscleCategory: finalCategory,
        equipment: equipmentInput,
      });
    }

    setModalVisible(false);
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      t('delete'),
      `${t('deleteExerciseConfirm')} (${name})`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteExercise(id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title={t('exercisesTitle')} subtitle={t('exercisesSubtitle')} />

      <View style={styles.container}>
        {/* Top Action: Create Exercise Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={openCreateModal}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color={Colors.primaryText} />
            <Text style={styles.createBtnText}>{t('createExercise')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search')}
            placeholderTextColor={Colors.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Muscle Category Filter Chips */}
        <View style={styles.filterScrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            {['All', ...STANDARD_CATEGORIES].map((cat) => {
              const isSelected = selectedFilterCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => setSelectedFilterCategory(cat)}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {cat === 'All' ? t('all') : cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Exercises List */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredExercises.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="barbell-outline" size={42} color={Colors.textDim} />
              <Text style={styles.emptyText}>{t('emptyList')}</Text>
            </View>
          ) : (
            filteredExercises.map((ex) => (
              <View key={ex.id} style={styles.exerciseCard}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>{ex.name}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badgePrimary}>
                      <Text style={styles.badgePrimaryText}>{ex.muscleCategory}</Text>
                    </View>
                    <View style={styles.badgeSecondary}>
                      <Text style={styles.badgeSecondaryText}>{ex.equipment}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionIconBtn} onPress={() => openEditModal(ex)}>
                    <Ionicons name="create-outline" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => confirmDelete(ex.id, ex.name)}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Modal: Create / Edit Exercise */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingExercise ? t('edit') : t('createExercise')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{t('exerciseName')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('exerciseNamePlaceholder')}
                placeholderTextColor={Colors.textDim}
                value={nameInput}
                onChangeText={setNameInput}
              />

              <Text style={styles.inputLabel}>{t('muscleCategory')}</Text>
              <View style={styles.categoryChipsContainer}>
                {[...STANDARD_CATEGORIES, 'Custom'].map((cat) => {
                  const isSelected = muscleCategoryInput === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.modalChip, isSelected && styles.modalChipActive]}
                      onPress={() => setMuscleCategoryInput(cat)}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          isSelected && styles.modalChipTextActive,
                        ]}
                      >
                        {cat === 'Custom' ? '+ Custom' : cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {muscleCategoryInput === 'Custom' && (
                <TextInput
                  style={[styles.textInput, { marginTop: 10 }]}
                  placeholder={t('customCategoryPlaceholder')}
                  placeholderTextColor={Colors.textDim}
                  value={customCategoryText}
                  onChangeText={setCustomCategoryText}
                />
              )}

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>{t('equipment')}</Text>
              <View style={styles.categoryChipsContainer}>
                {STANDARD_EQUIPMENT.map((eq) => {
                  const isSelected = equipmentInput === eq;
                  return (
                    <TouchableOpacity
                      key={eq}
                      style={[styles.modalChip, isSelected && styles.modalChipActive]}
                      onPress={() => setEquipmentInput(eq)}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          isSelected && styles.modalChipTextActive,
                        ]}
                      >
                        {eq}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
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
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  createBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnText: {
    color: Colors.primaryText,
    fontSize: 15,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Colors.text,
    fontSize: 14,
  },
  filterScrollWrapper: {
    height: 44,
    marginBottom: 8,
  },
  filterChips: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: Colors.primaryText,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 10,
  },
  exerciseCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: 10,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badgePrimary: {
    backgroundColor: 'rgba(190, 242, 100, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePrimaryText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeSecondary: {
    backgroundColor: Colors.cardElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSecondaryText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.cardElevated,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 10,
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 14,
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalChip: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalChipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  modalChipTextActive: {
    color: Colors.primaryText,
    fontWeight: '800',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.cardElevated,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.primaryText,
    fontSize: 15,
    fontWeight: '800',
  },
});

