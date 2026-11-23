import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Colors } from '../constants/Colors';

export const RestTimerOverlay: React.FC<{ bottomOffset?: number }> = ({
  bottomOffset = 80,
}) => {
  const { restSecondsLeft, isRestTimerRunning, adjustRestTimer, stopRestTimer, t } = useApp();

  if (!isRestTimerRunning || restSecondsLeft <= 0) {
    return null;
  }

  const minutes = Math.floor(restSecondsLeft / 60);
  const seconds = restSecondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <View style={styles.innerCard}>
        <View style={styles.leftSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="timer-outline" size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.label}>{t('restTimer')}</Text>
            <Text style={styles.timeText}>{formattedTime}</Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => adjustRestTimer(-15)}
            activeOpacity={0.7}
          >
            <Text style={styles.adjustBtnText}>-15s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => adjustRestTimer(15)}
            activeOpacity={0.7}
          >
            <Text style={styles.adjustBtnText}>+15s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={stopRestTimer}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={18} color={Colors.text} />
            <Text style={styles.skipBtnText}>{t('skipRest')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  innerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(190, 242, 100, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 22,
    color: Colors.primary,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adjustBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  adjustBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  skipBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  skipBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
});

