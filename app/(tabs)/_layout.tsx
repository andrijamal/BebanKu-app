import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useApp } from '../../context/AppContext';
import { RestTimerOverlay } from '../../components/RestTimerOverlay';

export default function TabLayout() {
  const { t } = useApp();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.tabBarActive,
          tabBarInactiveTintColor: Colors.tabBarInactive,
          tabBarStyle: {
            backgroundColor: Colors.tabBar,
            borderTopColor: Colors.tabBarBorder,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabWorkout'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barbell" size={size} color={color as string} />
            ),
          }}
        />
        <Tabs.Screen
          name="routines"
          options={{
            title: t('tabRoutines'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color as string} />
            ),
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            title: t('tabExercises'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color as string} />
            ),
          }}
        />
        <Tabs.Screen
          name="ai-coach"
          options={{
            title: t('tabAiCoach'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sparkles" size={size} color={color as string} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: t('tabHistory'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time-outline" size={size} color={color as string} />
            ),
          }}
        />
      </Tabs>
      <RestTimerOverlay />
    </>
  );
}
