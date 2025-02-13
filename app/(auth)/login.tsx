import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { auth, db } from '../../lib/firebaseConfig';

export default function LoginScreen() {
  const router = useRouter();

  // Controle de modos (login ou signup)
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Campos do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Controle de exibição de senha
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Observa estado do Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)/home');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Funções de ação
  async function handleSignUp() {
    if (!email || !password || !name) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Cria dados do usuário no Firestore
      const userData = {
        name,
        email,
        login: email,
        authId: cred.user.uid,
        createdAt: new Date().toISOString(),
      };

      const docRef = doc(db, 'users', cred.user.uid);
      await setDoc(docRef, userData);

      Alert.alert('Sucesso', 'Conta criada com sucesso!');
    } catch (error: any) {
      console.log('Erro no SignUp:', error);
      Alert.alert('Erro', error.message || 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert('Erro', 'Informe e-mail e senha.');
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      // Redirecionamento no onAuthStateChanged
    } catch (error: any) {
      console.log('Erro no SignIn:', error);
      Alert.alert('Erro', error.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!email) {
      Alert.alert('Erro', 'Informe o e-mail para redefinir sua senha.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Sucesso', 'Um e-mail de redefinição foi enviado.');
    } catch (error: any) {
      console.log('Erro ao redefinir senha:', error);
      Alert.alert('Erro', error.message || 'Não foi possível enviar o e-mail.');
    }
  }

  // Renderização principal
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A9B3C" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>
            {mode === 'signup' ? 'Criar Conta' : 'Entrar'}
          </Text>

          {/* Nome (apenas em signup) */}
          {mode === 'signup' && (
            <>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Seu Nome"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            </>
          )}

          {/* E-mail */}
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seuemail@exemplo.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Senha */}
          <Text style={styles.label}>Senha</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Digite sua senha"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          {/* Esqueceu a senha (apenas login) */}
          {mode === 'login' && (
            <TouchableOpacity
              style={{ marginTop: 10, alignSelf: 'flex-end' }}
              onPress={handleResetPassword}
            >
              <Text style={styles.forgotText}>Esqueceu a Senha?</Text>
            </TouchableOpacity>
          )}

          {/* Botão principal */}
          <TouchableOpacity
            style={styles.button}
            onPress={mode === 'signup' ? handleSignUp : handleSignIn}
          >
            <Ionicons
              name={mode === 'signup' ? 'person-add' : 'log-in'}
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.buttonText}>
              {mode === 'signup' ? 'Cadastrar' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          {/* Link para alternar entre login e signup */}
          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          >
            <Text style={styles.switchText}>
              {mode === 'signup'
                ? 'Já tem uma conta? Entre aqui'
                : 'Não tem conta? Cadastre-se'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A9B3C',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#292929',
    color: '#FFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    padding: 10,
  },
  forgotText: {
    color: '#4A9B3C',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#4A9B3C',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFF',
    fontSize: 16,
  },
});
