import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Colors } from '../constants/Colors';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showLanguageToggle?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showLanguageToggle = true,
}) => {
  const { language, setLanguage, activeWorkout, t } = useApp();
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <Text style={styles.brandText}>
            Beban<Text style={styles.brandAccent}>Ku</Text>
          </Text>
          {title && <Text style={styles.pageTitle}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {showLanguageToggle && (
          <View style={styles.langSwitchWrapper}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'id' && styles.langBtnActive]}
              onPress={() => setLanguage('id')}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.langText, language === 'id' && styles.langTextActive]}
              >
                ID
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.langText, language === 'en' && styles.langTextActive]}
              >
                EN
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Floating alert banner if there's an active workout session in progress */}
      {activeWorkout && activeWorkout.isActive && (
        <TouchableOpacity
          style={styles.activeBanner}
          onPress={() => router.push('/active-workout')}
          activeOpacity={0.85}
        >
          <View style={styles.activeBannerLeft}>
            <View style={styles.pulsingDot} />
            <Text style={styles.activeBannerTitle} numberOfLines={1}>
              {t('activeWorkoutBanner')} ({activeWorkout.routineName})
            </Text>
          </View>
          <View style={styles.resumePill}>
            <Text style={styles.resumePillText}>{t('resumeWorkout')}</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.primaryText} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.background,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleArea: {
    flex: 1,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: Colors.primary,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  langSwitchWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  langBtnActive: {
    backgroundColor: Colors.primary,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  langTextActive: {
    color: Colors.primaryText,
  },
  activeBanner: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 12,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  activeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  activeBannerTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  resumePill: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  resumePillText: {
    color: Colors.primaryText,
    fontSize: 11,
    fontWeight: '800',
  },
});

