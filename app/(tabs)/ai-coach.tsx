import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Colors } from '../../constants/Colors';
import { AppHeader } from '../../components/AppHeader';

export default function AiCoachScreen() {
  const {
    chatMessages,
    isAiThinking,
    sendChatMessage,
    clearChat,
    settings,
    t,
  } = useApp();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<any>(null);
  const router = useRouter();

  const isDemoMode = !settings.aiApiKey || settings.aiApiKey.trim().length <= 5;

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [chatMessages, isAiThinking]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const msg = inputText;
    setInputText('');
    sendChatMessage(msg);
  };

  const handleQuickPrompt = (promptText: string) => {
    sendChatMessage(promptText);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title={t('aiCoachTitle')} subtitle={t('aiCoachSubtitle')} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Demo Mode Notice Banner */}
        {isDemoMode && (
          <View style={styles.demoNoticeBanner}>
            <View style={styles.demoNoticeLeft}>
              <Ionicons name="sparkles" size={16} color={Colors.primary} />
              <Text style={styles.demoNoticeText} numberOfLines={2}>
                {t('aiModeDemoNotice')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.demoSettingsBtn}
              onPress={() => router.push('/(tabs)/history')}
            >
              <Text style={styles.demoSettingsBtnText}>API Key</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Prompts Bar */}
        <View style={styles.quickPromptsWrapper}>
          <Text style={styles.quickPromptsLabel}>{t('aiQuickPromptsTitle')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsList}>
            {[
              t('aiPrompt1'),
              t('aiPrompt2'),
              t('aiPrompt3'),
              t('aiPrompt4'),
            ].map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickPromptChip}
                onPress={() => handleQuickPrompt(prompt)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickPromptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.length === 0 ? (
            <View style={styles.welcomeBox}>
              <View style={styles.welcomeIconCircle}>
                <Ionicons name="fitness" size={36} color={Colors.primary} />
              </View>
              <Text style={styles.welcomeTitle}>BebanKu AI Coach</Text>
              <Text style={styles.welcomeSubtitle}>
                {settings.language === 'id'
                  ? 'Tanyakan apa saja seputar latihan beban, volume, otot yang perlu dilatih, atau rekomendasi jadwal latihan berdasarkan data riwayatmu!'
                  : 'Ask anything about progressive overload, volume, target muscles, or routine splits tailored to your logged history!'}
              </Text>
            </View>
          ) : (
            chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubbleRow,
                    isUser ? styles.userRow : styles.assistantRow,
                  ]}
                >
                  {!isUser && (
                    <View style={styles.aiAvatar}>
                      <Ionicons name="sparkles" size={14} color={Colors.primaryText} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isUser ? styles.userText : styles.assistantText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {isAiThinking && (
            <View style={[styles.messageBubbleRow, styles.assistantRow]}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={14} color={Colors.primaryText} />
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble, styles.thinkingBubble]}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.thinkingText}>
                  {settings.language === 'id' ? 'Sedang menganalisa data...' : 'Analyzing workout history...'}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.chatInput}
            placeholder={t('aiPlaceholder')}
            placeholderTextColor={Colors.textDim}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isAiThinking}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color={Colors.primaryText} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  demoNoticeBanner: {
    backgroundColor: Colors.cardElevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  demoNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginRight: 8,
  },
  demoNoticeText: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  demoSettingsBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  demoSettingsBtnText: {
    color: Colors.primaryText,
    fontSize: 10,
    fontWeight: '800',
  },
  quickPromptsWrapper: {
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quickPromptsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textDim,
    paddingHorizontal: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  quickPromptsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickPromptChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  quickPromptText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  welcomeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  welcomeIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 20,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: Colors.primaryText,
    fontWeight: '600',
  },
  assistantText: {
    color: Colors.text,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

