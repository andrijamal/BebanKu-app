import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { Colors } from '../../constants/Colors';
import { AppHeader } from '../../components/AppHeader';
import { StorageService } from '../../services/storage';
import { LineChart, DataPoint } from '../../components/charts/LineChart';
import { BarChart, BarDataPoint } from '../../components/charts/BarChart';

export default function HistoryAndSettingsScreen() {
  const {
    history,
    deleteWorkoutLog,
    bodyWeightLogs,
    addBodyWeightLog,
    deleteBodyWeightLog,
    exercises,
    settings,
    updateSettings,
    language,
    setLanguage,
    resetAllData,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'history' | 'stats' | 'settings'>('history');

  // Body weight modal state
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [weightDateInput, setWeightDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [weightNotesInput, setWeightNotesInput] = useState('');

  // Selected exercise for strength progress chart
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    exercises[0]?.id || ''
  );

  // Settings local state
  const [apiKeyInput, setApiKeyInput] = useState(settings.aiApiKey || '');
  const [providerInput, setProviderInput] = useState<'gemini' | 'openai'>(
    settings.aiProvider || 'gemini'
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [restTimerInput, setRestTimerInput] = useState(String(settings.defaultRestSeconds || 90));

  useEffect(() => {
    setApiKeyInput(settings.aiApiKey || '');
    setProviderInput(settings.aiProvider || 'gemini');
    setRestTimerInput(String(settings.defaultRestSeconds || 90));
  }, [settings]);

  // Overall Statistics
  const totalWorkouts = history.length;
  const totalVolume = history.reduce((sum, h) => sum + (h.totalVolumeKg || 0), 0);

  // -------------------------------------------------------------
  // Data for Bagian A: Body Weight Tracker
  // -------------------------------------------------------------
  const sortedWeightLogs = useMemo(() => {
    return [...bodyWeightLogs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [bodyWeightLogs]);

  const startWeight = sortedWeightLogs[0]?.weight;
  const currentWeight = sortedWeightLogs[sortedWeightLogs.length - 1]?.weight;
  const weightDiff =
    startWeight !== undefined && currentWeight !== undefined
      ? Math.round((currentWeight - startWeight) * 10) / 10
      : undefined;

  const weightChartData: DataPoint[] = useMemo(() => {
    return sortedWeightLogs.map((item) => {
      const d = new Date(item.date);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      return {
        label,
        value: item.weight,
        date: item.date,
        note: item.notes,
      };
    });
  }, [sortedWeightLogs]);

  const handleSaveBodyWeight = async () => {
    const num = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      Alert.alert('Perhatian', 'Masukkan angka berat badan yang valid!');
      return;
    }

    await addBodyWeightLog({
      weight: num,
      date: weightDateInput || new Date().toISOString().slice(0, 10),
      notes: weightNotesInput.trim() || undefined,
    });

    setWeightInput('');
    setWeightNotesInput('');
    setWeightModalVisible(false);
  };

  const confirmDeleteWeight = (id: string, date: string) => {
    Alert.alert(
      t('delete'),
      `${t('deleteWeightConfirm')} (${date})`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteBodyWeightLog(id),
        },
      ]
    );
  };

  // -------------------------------------------------------------
  // Data for Bagian B: Exercise Strength Progress
  // -------------------------------------------------------------
  const effectiveExerciseId = selectedExerciseId || exercises[0]?.id || '';
  const selectedExerciseObj = exercises.find((e) => e.id === effectiveExerciseId);

  const exerciseSessionData = useMemo(() => {
    if (!effectiveExerciseId) return { chartPoints: [], prMax: 0, pr1RM: 0, prDate: '' };

    // Extract all sessions where this exercise was performed, ordered chronologically
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const points: DataPoint[] = [];
    let prMax = 0;
    let pr1RM = 0;
    let prDate = '';

    for (const log of sortedHistory) {
      const match = log.exercises.find((e) => e.exerciseId === effectiveExerciseId);
      if (!match) continue;

      const completedSets = match.sets.filter((s) => s.completed && s.weight > 0);
      if (completedSets.length === 0) continue;

      let sessionMaxWeight = 0;
      let sessionMax1RM = 0;

      for (const s of completedSets) {
        if (s.weight > sessionMaxWeight) {
          sessionMaxWeight = s.weight;
        }
        // Epley Formula for 1RM: weight * (1 + reps/30)
        const est1RM = Math.round(s.weight * (1 + s.reps / 30));
        if (est1RM > sessionMax1RM) {
          sessionMax1RM = est1RM;
        }
      }

      const d = new Date(log.startTime);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;

      points.push({
        label,
        value: sessionMaxWeight,
        secondaryValue: sessionMax1RM,
        date: log.startTime.slice(0, 10),
        note: `${match.exerciseName} (${completedSets.length} set)`,
      });

      if (sessionMaxWeight > prMax) {
        prMax = sessionMaxWeight;
        pr1RM = sessionMax1RM;
        prDate = log.startTime.slice(0, 10);
      }
    }

    return { chartPoints: points, prMax, pr1RM, prDate };
  }, [history, effectiveExerciseId]);

  // -------------------------------------------------------------
  // Data for Bagian C: Weekly Activity Bar Chart
  // -------------------------------------------------------------
  const weeklyActivityData: BarDataPoint[] = useMemo(() => {
    // Generate buckets for the last 6 weeks
    const now = new Date();
    const weeks: { start: number; end: number; label: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      weeks.push({
        start: weekStart.getTime(),
        end: weekEnd.getTime(),
        label: i === 0 ? 'Ini' : `-${i}`,
        count: 0,
      });
    }

    for (const log of history) {
      const t = new Date(log.startTime).getTime();
      for (const w of weeks) {
        if (t >= w.start && t < w.end) {
          w.count += 1;
          break;
        }
      }
    }

    return weeks.map((w, idx) => ({
      label: idx === weeks.length - 1 ? (language === 'id' ? 'Kini' : 'Now') : `${t('weekLabel')}${idx + 1}`,
      subLabel: `Minggu ${idx + 1}`,
      value: w.count,
    }));
  }, [history, language]);

  // Settings Handlers
  const confirmDeleteLog = (id: string, date: string) => {
    Alert.alert(
      t('delete'),
      `${t('deleteHistoryConfirm')} (${date.slice(0, 10)})`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteWorkoutLog(id),
        },
      ]
    );
  };

  const handleSaveSettings = async () => {
    const sec = parseInt(restTimerInput, 10) || 90;
    await updateSettings({
      aiApiKey: apiKeyInput.trim(),
      aiProvider: providerInput,
      defaultRestSeconds: sec,
    });
    Alert.alert('Sukses', t('save') + '!');
  };

  const handleExportBackup = async () => {
    const success = await StorageService.exportBackup();
    if (success) {
      Alert.alert(t('appName'), t('exportSuccess'));
    }
  };

  const handleResetConfirm = () => {
    Alert.alert(
      t('resetData'),
      t('resetDataConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('resetData'),
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            Alert.alert('Reset', 'Data berhasil dikembalikan ke awal.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader title={t('historyTitle')} subtitle={t('historySubtitle')} />

      {/* 3-Segment Top Navigation */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'history' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons
            name="time-outline"
            size={15}
            color={activeTab === 'history' ? Colors.primaryText : Colors.textMuted}
          />
          <Text
            style={[styles.segmentText, activeTab === 'history' && styles.segmentTextActive]}
            numberOfLines={1}
          >
            {t('historyTab')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'stats' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons
            name="analytics-outline"
            size={15}
            color={activeTab === 'stats' ? Colors.primaryText : Colors.textMuted}
          />
          <Text
            style={[styles.segmentText, activeTab === 'stats' && styles.segmentTextActive]}
            numberOfLines={1}
          >
            {t('statsTab')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'settings' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name="settings-outline"
            size={15}
            color={activeTab === 'settings' ? Colors.primaryText : Colors.textMuted}
          />
          <Text
            style={[styles.segmentText, activeTab === 'settings' && styles.segmentTextActive]}
            numberOfLines={1}
          >
            {t('settingsTab')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* TAB 1: RIWAYAT LATIHAN (WORKOUT HISTORY)                  */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t('totalWorkouts')}</Text>
                <Text style={styles.statNumber}>{totalWorkouts}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t('totalVolumeLogged')}</Text>
                <Text style={styles.statNumber}>{totalVolume.toLocaleString()} kg</Text>
              </View>
            </View>

            {history.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="barbell-outline" size={48} color={Colors.textDim} />
                <Text style={styles.emptyText}>{t('noHistoryYet')}</Text>
              </View>
            ) : (
              history.map((log) => {
                const dateStr = new Date(log.startTime).toLocaleDateString(
                  language === 'id' ? 'id-ID' : 'en-US',
                  {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }
                );
                const minutes = Math.round(log.durationSeconds / 60);

                return (
                  <View key={log.id} style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyRoutineName}>{log.routineName}</Text>
                        <Text style={styles.historyDate}>{dateStr}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteLogBtn}
                        onPress={() => confirmDeleteLog(log.id, log.startTime)}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.metaBadgeRow}>
                      <View style={styles.metaBadge}>
                        <Ionicons name="time-outline" size={12} color={Colors.primary} />
                        <Text style={styles.metaBadgeText}>{minutes} menit</Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <Ionicons name="barbell-outline" size={12} color={Colors.primary} />
                        <Text style={styles.metaBadgeText}>{log.totalVolumeKg} kg volume</Text>
                      </View>
                    </View>

                    <View style={styles.exerciseBreakdown}>
                      {log.exercises.map((ex, exIdx) => (
                        <View key={`${ex.exerciseId}-${exIdx}`} style={styles.breakdownRow}>
                          <Text style={styles.breakdownExName}>{ex.exerciseName}</Text>
                          <Text style={styles.breakdownSets}>
                            {ex.sets
                              .map((s) => `${s.weight}kg x ${s.reps}`)
                              .join('  •  ')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* TAB 2: STATISTIK & GRAFIK (STATS & PROGRESS CHARTS)       */}
        {/* ======================================================== */}
        {activeTab === 'stats' && (
          <View style={styles.chartsSection}>
            {/* ---------------------------------------------------- */}
            {/* BAGIAN A: GRAFIK PROGRES BERAT BADAN (BODY WEIGHT)   */}
            {/* ---------------------------------------------------- */}
            <View style={styles.sectionHeaderCard}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Ionicons name="scale-outline" size={20} color="#38BDF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionMainTitle}>{t('bodyWeightTitle')}</Text>
                  <Text style={styles.sectionSubTitle}>{t('bodyWeightSubtitle')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionPillBtn}
                  onPress={() => setWeightModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color={Colors.primaryText} />
                  <Text style={styles.actionPillText}>{t('add')}</Text>
                </TouchableOpacity>
              </View>

              {/* Summary Metrics (Awal, Saat Ini, Perubahan) */}
              <View style={styles.weightMetricsRow}>
                <View style={styles.weightMetricItem}>
                  <Text style={styles.weightMetricLabel}>{t('initialWeight')}</Text>
                  <Text style={styles.weightMetricVal}>
                    {startWeight !== undefined ? `${startWeight} kg` : '-'}
                  </Text>
                </View>
                <View style={styles.weightMetricDivider} />
                <View style={styles.weightMetricItem}>
                  <Text style={styles.weightMetricLabel}>{t('currentWeight')}</Text>
                  <Text style={[styles.weightMetricVal, { color: '#38BDF8' }]}>
                    {currentWeight !== undefined ? `${currentWeight} kg` : '-'}
                  </Text>
                </View>
                <View style={styles.weightMetricDivider} />
                <View style={styles.weightMetricItem}>
                  <Text style={styles.weightMetricLabel}>{t('weightChange')}</Text>
                  <Text
                    style={[
                      styles.weightMetricVal,
                      weightDiff !== undefined && weightDiff > 0
                        ? { color: Colors.primary }
                        : weightDiff !== undefined && weightDiff < 0
                        ? { color: '#38BDF8' }
                        : { color: Colors.textMuted },
                    ]}
                  >
                    {weightDiff !== undefined
                      ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg`
                      : '-'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Line Chart Berat Badan */}
            {weightChartData.length < 2 ? (
              <View style={styles.chartEmptyCard}>
                <Ionicons name="trending-up-outline" size={32} color={Colors.textDim} />
                <Text style={styles.chartEmptyText}>{t('chartEmptyNotice')}</Text>
                <TouchableOpacity
                  style={styles.logWeightNowBtn}
                  onPress={() => setWeightModalVisible(true)}
                >
                  <Ionicons name="add" size={16} color={Colors.primaryText} />
                  <Text style={styles.logWeightNowBtnText}>{t('logBodyWeight')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <LineChart
                data={weightChartData}
                color="#38BDF8"
                unit="kg"
                height={210}
              />
            )}

            {/* Daftar Riwayat Berat Badan */}
            {sortedWeightLogs.length > 0 && (
              <View style={styles.weightHistoryCard}>
                <Text style={styles.weightHistoryTitle}>{t('weightHistory')}</Text>
                <View style={styles.weightListContainer}>
                  {[...sortedWeightLogs].reverse().slice(0, 5).map((log) => (
                    <View key={log.id} style={styles.weightLogRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.weightLogVal}>{log.weight} kg</Text>
                        <Text style={styles.weightLogDate}>
                          {log.date}
                          {log.notes ? ` • ${log.notes}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteWeightBtn}
                        onPress={() => confirmDeleteWeight(log.id, log.date)}
                      >
                        <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ---------------------------------------------------- */}
            {/* BAGIAN B: GRAFIK PROGRES BEBAN PER GERAKAN           */}
            {/* ---------------------------------------------------- */}
            <View style={[styles.sectionHeaderCard, { marginTop: 12 }]}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIconBadge, { backgroundColor: Colors.primaryMuted }]}>
                  <Ionicons name="barbell-outline" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionMainTitle}>{t('exerciseProgressTitle')}</Text>
                  <Text style={styles.sectionSubTitle}>{t('exerciseProgressSubtitle')}</Text>
                </View>
              </View>

              {/* Horizontal Scroll Selector Gerakan */}
              <Text style={styles.pickerLabel}>{t('selectExercise')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.exerciseChipsScroll}
              >
                {exercises.map((ex) => {
                  const isSelected = ex.id === effectiveExerciseId;
                  return (
                    <TouchableOpacity
                      key={ex.id}
                      style={[styles.exChip, isSelected && styles.exChipActive]}
                      onPress={() => setSelectedExerciseId(ex.id)}
                    >
                      <Text style={[styles.exChipText, isSelected && styles.exChipTextActive]}>
                        {ex.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* PR Card for Selected Exercise */}
              {exerciseSessionData.prMax > 0 && (
                <View style={styles.prCard}>
                  <View style={styles.prLeft}>
                    <Ionicons name="trophy" size={24} color={Colors.primary} />
                    <View>
                      <Text style={styles.prTitle}>{t('personalRecord')}</Text>
                      <Text style={styles.prSub}>
                        {selectedExerciseObj?.name} ({exerciseSessionData.prDate})
                      </Text>
                    </View>
                  </View>
                  <View style={styles.prRight}>
                    <Text style={styles.prValText}>
                      {exerciseSessionData.prMax} kg
                    </Text>
                    <Text style={styles.prEstText}>
                      Est. 1RM ~{exerciseSessionData.pr1RM} kg
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Line Chart Progres Beban Gerakan */}
            {exerciseSessionData.chartPoints.length < 2 ? (
              <View style={styles.chartEmptyCard}>
                <Ionicons name="fitness-outline" size={32} color={Colors.textDim} />
                <Text style={styles.chartEmptyText}>
                  {exerciseSessionData.chartPoints.length === 1
                    ? t('chartEmptyNotice')
                    : t('noExerciseSessionYet')}
                </Text>
              </View>
            ) : (
              <LineChart
                data={exerciseSessionData.chartPoints}
                color={Colors.primary}
                secondaryColor="#38BDF8"
                unit="kg"
                height={220}
                showSecondary={true}
                primaryLabel={t('maxWeight')}
                secondaryLabel={t('estimated1RM')}
              />
            )}

            {/* ---------------------------------------------------- */}
            {/* BAGIAN C: KONSISTENSI LATIHAN MINGGUAN (BAR CHART)   */}
            {/* ---------------------------------------------------- */}
            <View style={[styles.sectionHeaderCard, { marginTop: 12 }]}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionMainTitle}>{t('weeklyActivityTitle')}</Text>
                  <Text style={styles.sectionSubTitle}>{t('weeklyActivitySubtitle')}</Text>
                </View>
              </View>
            </View>

            <BarChart
              data={weeklyActivityData}
              color={Colors.primary}
              height={190}
              unit="sesi"
            />
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PENGATURAN (SETTINGS)                             */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <View style={styles.settingsSection}>
            <View style={styles.settingCard}>
              <Text style={styles.settingTitle}>{t('languageSettings')}</Text>
              <View style={styles.buttonToggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, language === 'id' && styles.toggleBtnActive]}
                  onPress={() => setLanguage('id')}
                >
                  <Text style={[styles.toggleBtnText, language === 'id' && styles.toggleBtnTextActive]}>
                    Bahasa Indonesia
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, language === 'en' && styles.toggleBtnActive]}
                  onPress={() => setLanguage('en')}
                >
                  <Text style={[styles.toggleBtnText, language === 'en' && styles.toggleBtnTextActive]}>
                    English
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingCardHeader}>
                <Ionicons name="sparkles" size={18} color={Colors.primary} />
                <Text style={styles.settingTitle}>{t('aiSettings')}</Text>
              </View>

              <Text style={styles.fieldLabel}>{t('aiProvider')}</Text>
              <View style={styles.buttonToggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, providerInput === 'gemini' && styles.toggleBtnActive]}
                  onPress={() => setProviderInput('gemini')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      providerInput === 'gemini' && styles.toggleBtnTextActive,
                    ]}
                  >
                    Google Gemini
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, providerInput === 'openai' && styles.toggleBtnActive]}
                  onPress={() => setProviderInput('openai')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      providerInput === 'openai' && styles.toggleBtnTextActive,
                    ]}
                  >
                    OpenAI
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>{t('aiApiKey')}</Text>
              <View style={styles.inputWithIconRow}>
                <TextInput
                  style={styles.keyInput}
                  placeholder={t('aiApiKeyPlaceholder')}
                  placeholderTextColor={Colors.textDim}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  secureTextEntry={!showApiKey}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowApiKey(!showApiKey)}
                >
                  <Ionicons
                    name={showApiKey ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.fieldHint}>{t('aiApiKeyHint')}</Text>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>{t('defaultRestTimer')}</Text>
              <TextInput
                style={styles.keyInput}
                keyboardType="numeric"
                value={restTimerInput}
                onChangeText={setRestTimerInput}
              />

              <TouchableOpacity style={styles.saveSettingsBtn} onPress={handleSaveSettings}>
                <Text style={styles.saveSettingsBtnText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingCard}>
              <Text style={styles.settingTitle}>{t('dataManagement')}</Text>
              <TouchableOpacity style={styles.actionRowBtn} onPress={handleExportBackup}>
                <Ionicons name="download-outline" size={20} color={Colors.primary} />
                <Text style={styles.actionRowText}>{t('exportData')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionRowBtn, styles.dangerActionBtn]}
                onPress={handleResetConfirm}
              >
                <Ionicons name="trash-bin-outline" size={20} color={Colors.danger} />
                <Text style={[styles.actionRowText, { color: Colors.danger }]}>
                  {t('resetData')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL: INPUT CATAT BERAT BADAN                           */}
      {/* ======================================================== */}
      <Modal visible={weightModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('logBodyWeight')}</Text>
              <TouchableOpacity onPress={() => setWeightModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>{t('enterWeight')}</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="decimal-pad"
                placeholder="70.5"
                placeholderTextColor={Colors.textDim}
                value={weightInput}
                onChangeText={setWeightInput}
                autoFocus
              />

              <Text style={styles.inputLabel}>{t('weightDate')}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textDim}
                value={weightDateInput}
                onChangeText={setWeightDateInput}
              />

              <Text style={styles.inputLabel}>{t('weightNotes')}</Text>
              <TextInput
                style={[styles.modalInput, { height: 70 }]}
                placeholder={t('weightNotesPlaceholder')}
                placeholderTextColor={Colors.textDim}
                value={weightNotesInput}
                onChangeText={setWeightNotesInput}
                multiline
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setWeightModalVisible(false)}
                >
                  <Text style={styles.cancelModalBtnText}>{t('cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveBodyWeight}>
                  <Text style={styles.saveModalBtnText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 5,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: Colors.primaryText,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyRoutineName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deleteLogBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.cardElevated,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  metaBadgeText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  exerciseBreakdown: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  breakdownRow: {
    gap: 2,
  },
  breakdownExName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  breakdownSets: {
    fontSize: 12,
    color: Colors.textDim,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 10,
  },
  // Charts Section Styles
  chartsSection: {
    gap: 12,
  },
  sectionHeaderCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionSubTitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  actionPillBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionPillText: {
    color: Colors.primaryText,
    fontSize: 12,
    fontWeight: '800',
  },
  weightMetricsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  weightMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  weightMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderLight,
  },
  weightMetricLabel: {
    fontSize: 11,
    color: Colors.textDim,
    fontWeight: '600',
  },
  weightMetricVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
    marginTop: 2,
  },
  chartEmptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderLight,
    padding: 24,
  },
  chartEmptyText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 18,
  },
  logWeightNowBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  logWeightNowBtnText: {
    color: Colors.primaryText,
    fontSize: 12,
    fontWeight: '800',
  },
  weightHistoryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  weightHistoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  weightListContainer: {
    gap: 8,
  },
  weightLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  weightLogVal: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '800',
  },
  weightLogDate: {
    color: Colors.textDim,
    fontSize: 11,
    marginTop: 1,
  },
  deleteWeightBtn: {
    padding: 6,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  exerciseChipsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  exChip: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  exChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  exChipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  exChipTextActive: {
    color: Colors.primaryText,
    fontWeight: '800',
  },
  prCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  prLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  prSub: {
    color: Colors.textDim,
    fontSize: 11,
    marginTop: 1,
  },
  prRight: {
    alignItems: 'flex-end',
  },
  prValText: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  prEstText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  // Settings Styles
  settingsSection: {
    gap: 16,
  },
  settingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  settingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  buttonToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: Colors.primaryText,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 11,
    color: Colors.textDim,
    marginTop: 4,
  },
  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  keyInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
  },
  eyeBtn: {
    padding: 10,
  },
  saveSettingsBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  saveSettingsBtnText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontWeight: '800',
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 10,
  },
  dangerActionBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  actionRowText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  // Modal Styles
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
  modalInput: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 14,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 20,
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: Colors.cardElevated,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  saveModalBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveModalBtnText: {
    color: Colors.primaryText,
    fontSize: 15,
    fontWeight: '800',
  },
});
