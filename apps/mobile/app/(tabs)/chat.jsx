import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@shared/theme';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
      text: 'Olá! Sou o ClawdBot, seu assistente financeiro da Monex. 🐾\n\nComo posso ajudar você hoje? Posso analisar seus gastos, criar metas, gerenciar dívidas e muito mais!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      type: 'user',
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate bot response (will be replaced with actual AI integration)
    setTimeout(() => {
      const botMsg = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: 'Entendi! Estou analisando seus dados financeiros para dar a melhor recomendação. Esta funcionalidade será integrada com a IA em breve. 🚀',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }, 1500);
  };

  const renderMessage = ({ item }) => {
    const isBot = item.type === 'bot';
    return (
      <View style={[styles.msgRow, isBot ? styles.msgRowBot : styles.msgRowUser]}>
        {isBot && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🐾</Text>
          </View>
        )}
        <View style={[styles.msgBubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
          <Text style={[styles.msgText, isBot ? styles.msgTextBot : styles.msgTextUser]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>🐾</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>ClawdBot</Text>
            <Text style={styles.headerSubtitle}>Assistente Financeiro</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
          <Text style={styles.typingText}>ClawdBot está digitando...</Text>
        </View>
      )}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom || spacing.md }]}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={colors.text.muted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color={input.trim() ? colors.text.inverse : colors.text.muted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.DEFAULT },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing['2xl'], paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border.DEFAULT,
    backgroundColor: colors.background.card,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerAvatar: {
    width: 40, height: 40, borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary.DEFAULT}20`,
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 20 },
  headerTitle: { color: colors.text.primary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  headerSubtitle: { color: colors.text.muted, fontSize: typography.fontSize.xs },
  messagesList: { padding: spacing['2xl'], paddingBottom: spacing.md },
  msgRow: { marginBottom: spacing.md, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  msgRowBot: { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },
  avatar: {
    width: 28, height: 28, borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary.DEFAULT}20`,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 14 },
  msgBubble: {
    maxWidth: '80%', paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  bubbleBot: {
    backgroundColor: colors.background.card, borderWidth: 1,
    borderColor: colors.border.DEFAULT, borderBottomLeftRadius: borderRadius.sm,
  },
  bubbleUser: {
    backgroundColor: colors.primary.DEFAULT, borderBottomRightRadius: borderRadius.sm,
  },
  msgText: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  msgTextBot: { color: colors.text.primary },
  msgTextUser: { color: colors.text.inverse },
  typingIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing['2xl'], paddingVertical: spacing.sm,
  },
  typingText: { color: colors.text.muted, fontSize: typography.fontSize.xs },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border.DEFAULT,
    backgroundColor: colors.background.card,
  },
  input: {
    flex: 1, backgroundColor: colors.background.input, borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    color: colors.text.primary, fontSize: typography.fontSize.base,
    maxHeight: 100, borderWidth: 1, borderColor: colors.border.DEFAULT,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: borderRadius.full,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.border.DEFAULT },
});
