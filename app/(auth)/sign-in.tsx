import { Link } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { InputField } from '@/components/forms/input-field'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'

export default function SignInScreen() {
  const { theme } = useTheme()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    setError(null)
    setLoading(true)
    const err = await signIn(email.trim(), password)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Personal Finances</Text>
            <Text style={[styles.subtitle, { color: theme.icon }]}>Sign in to your account</Text>
          </View>

          <View style={styles.form}>
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              autoComplete="email"
            />
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              autoComplete="current-password"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[styles.button, { backgroundColor: theme.tint }, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Sign In</Text>}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={{ color: theme.icon }}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up">
              <Text style={{ color: theme.tint, fontWeight: '600' }}>Sign Up</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 32 },
  header: { gap: 8, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 16 },
  form: { gap: 16 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
})
