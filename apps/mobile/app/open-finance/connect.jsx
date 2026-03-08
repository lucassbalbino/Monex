/**
 * Pluggy Connect WebView
 * 
 * Abre o widget do Pluggy dentro de um WebView para o usuário
 * autenticar com seu banco. Ao concluir, registra a conexão.
 */

import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { colors, spacing, typography, borderRadius } from '@shared/theme';
import { useOpenFinance } from '@/contexts/OpenFinanceContext';

// URLs que o WebView pode navegar internamente
const ALLOWED_HOSTS = [
  'connect.pluggy.ai',
  'pluggy.ai',
  'api.pluggy.ai',
];

const PLUGGY_CONNECT_URL = 'https://connect.pluggy.ai';

export default function PluggyConnectScreen() {
  const { connectToken } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addConnection } = useOpenFinance();
  const webViewRef = useRef(null);

  console.log('[PluggyConnect] Montando tela. connectToken:', connectToken ? `${connectToken.substring(0, 20)}...` : 'VAZIO');

  const handleMessage = useCallback(async (event) => {
    try {
      const raw = event.nativeEvent.data;
      console.log('[PluggyConnect] onMessage raw:', typeof raw === 'string' ? raw.substring(0, 200) : raw);
      const message = typeof raw === 'string' ? JSON.parse(raw) : raw;
      console.log('[PluggyConnect] onMessage parsed event:', message?.event, 'keys:', Object.keys(message || {}));
      
      // Intercepta window.open redirecionado pelo JS injetado
      if (message.event === 'open-url' && message.url) {
        console.log('[PluggyConnect] open-url interceptado:', message.url);
        Linking.openURL(message.url).catch((err) => console.log('[PluggyConnect] Linking.openURL falhou:', err.message));
        return;
      }

      if (message.event === 'close') {
        console.log('[PluggyConnect] Evento close recebido');
        router.back();
        return;
      }

      if (message.event === 'success' && message.itemId) {
        console.log('[PluggyConnect] Evento success! itemId:', message.itemId);
        // Conexão bem-sucedida — registra e volta
        const { error } = await addConnection(message.itemId);
        if (error) {
          Alert.alert('Erro', 'Banco conectado, mas houve um erro ao sincronizar. Tente atualizar manualmente.');
        } else {
          Alert.alert('Sucesso!', 'Banco conectado com sucesso. Seus dados estão sendo sincronizados.');
        }
        router.back();
        return;
      }

      if (message.event === 'error') {
        console.log('[PluggyConnect] Evento error:', message.message);
        Alert.alert('Erro na Conexão', message.message || 'Não foi possível conectar ao banco.');
        router.back();
      }
    } catch (e) {
      // Mensagem não é JSON válido — loga para debug
      console.log('[PluggyConnect] onMessage parse error:', e.message, '| raw:', String(event.nativeEvent.data).substring(0, 100));
    }
  }, [addConnection, router]);

  const injectedJS = `
    (function() {
      console.log('[PluggyConnect:JS] Script injetado executando');

      // Debounce para evitar flood de mensagens repetidas
      var lastMsg = '';
      var lastMsgTime = 0;

      // Captura mensagens do Pluggy Connect widget
      window.addEventListener('message', function(event) {
        try {
          var data = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
          
          // Evita logs repetidos (mesmo conteúdo em < 2s)
          var now = Date.now();
          if (data === lastMsg && (now - lastMsgTime) < 2000) return;
          lastMsg = data;
          lastMsgTime = now;
          
          console.log('[PluggyConnect:JS] postMessage:', String(data).substring(0, 150));
          window.ReactNativeWebView.postMessage(data);
        } catch(e) {
          console.log('[PluggyConnect:JS] Erro:', e.message);
        }
      });

      // Intercepta window.open
      window.open = function(url, target, features) {
        console.log('[PluggyConnect:JS] window.open:', url, 'target:', target);
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'open-url', url: url }));
        return null;
      };

      // Intercepta links com target=_blank
      document.addEventListener('click', function(e) {
        var el = e.target;
        while (el && el.tagName !== 'A') el = el.parentElement;
        if (el && el.tagName === 'A') {
          console.log('[PluggyConnect:JS] Click <a>:', el.href, 'target:', el.target);
          if (el.target === '_blank' || el.target === '_system') {
            e.preventDefault();
            window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'open-url', url: el.href }));
          }
        }
      }, true);

      // Monitora se a página tenta redirecionar via location
      var origAssign = window.location.assign;
      if (origAssign) {
        window.location.assign = function(url) {
          console.log('[PluggyConnect:JS] location.assign:', url);
          origAssign.call(window.location, url);
        };
      }

      console.log('[PluggyConnect:JS] Listeners OK');
    })();
    true;
  `;

  // PERMITIR TODAS as URLs http/https DENTRO do WebView
  // Só abre externamente deep links (esquemas custom como nubank://, itau://)
  const handleNavigationRequest = useCallback((request) => {
    const { url, navigationType } = request;

    // Permitir http/https — a autenticação do banco precisa acontecer DENTRO do WebView
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('[PluggyConnect] PERMITIDO (http/s):', url.substring(0, 120));
      return true;
    }

    // about:blank, about:srcdoc — permitir (iframes internos)
    if (url.startsWith('about:')) {
      return true;
    }

    // Deep links (nubank://, itau://, etc) — abrir no app nativo
    console.log('[PluggyConnect] DEEP LINK →', url);
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        console.log('[PluggyConnect] Abrindo deep link:', url);
        Linking.openURL(url);
      } else {
        console.log('[PluggyConnect] Deep link não suportado:', url);
        Alert.alert('App não encontrado', 'Instale o app do banco e tente novamente.');
      }
    }).catch((err) => console.log('[PluggyConnect] canOpenURL erro:', err.message));
    return false;
  }, []);

  // Lida com window.open() / target="_blank"
  const handleOpenWindow = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    const url = nativeEvent?.targetUrl;
    console.log('[PluggyConnect] onOpenWindow:', url);
    if (url) {
      Linking.openURL(url).catch((err) => console.log('[PluggyConnect] onOpenWindow Linking falhou:', err.message));
    }
  }, []);

  const handleError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.log('[PluggyConnect] WebView ERROR:', JSON.stringify({
      code: nativeEvent.code,
      description: nativeEvent.description,
      url: nativeEvent.url,
    }));
  }, []);

  const handleHttpError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.log('[PluggyConnect] WebView HTTP ERROR:', nativeEvent.statusCode, nativeEvent.url);
  }, []);

  const handleLoadStart = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.log('[PluggyConnect] loadStart:', nativeEvent.url);
  }, []);

  const handleLoadEnd = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.log('[PluggyConnect] loadEnd:', nativeEvent.url, 'title:', nativeEvent.title);
  }, []);

  const connectUrl = `${PLUGGY_CONNECT_URL}?connect_token=${connectToken}`;
  console.log('[PluggyConnect] URL final:', connectUrl);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conectar Banco</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.securityBanner}>
        <Ionicons name="shield-checkmark" size={16} color={colors.success} />
        <Text style={styles.securityText}>
          Conexão segura via Pluggy · Apenas leitura
        </Text>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: connectUrl }}
        style={styles.webview}
        onMessage={handleMessage}
        injectedJavaScript={injectedJS}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically
        allowsBackForwardNavigationGestures
        onShouldStartLoadWithRequest={handleNavigationRequest}
        onOpenWindow={handleOpenWindow}
        onError={handleError}
        onHttpError={handleHttpError}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        originWhitelist={['https://*', 'http://*', 'intent://*', 'itau://*', 'bradesco://*', 'bb://*', 'santander://*', 'nubank://*', 'inter://*', 'c6bank://*', 'safra://*', 'bancooriginal://*']}
        userAgent={Platform.OS === 'android'
          ? 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
          : undefined
        }
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.DEFAULT },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border.DEFAULT,
  },
  backButton: { padding: spacing.sm },
  headerTitle: { color: colors.text.primary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold },
  securityBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.sm, backgroundColor: `${colors.success}15`,
  },
  securityText: { color: colors.success, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, marginLeft: spacing.xs },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.DEFAULT,
    justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: colors.text.secondary, fontSize: typography.fontSize.sm, marginTop: spacing.md },
});
