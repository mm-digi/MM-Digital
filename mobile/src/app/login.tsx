import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { colors, radius, spacing } from "@/lib/theme";

export default function LoginScreen() {
  const auth = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!username || !password) {
      setError("Enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(username.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await auth.signIn(result.token, result.name);
    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>Client Access</Text>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Sign in to view your live analytics dashboard.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Username or E-mail</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder=""
            placeholderTextColor={colors.textFaint}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholderTextColor={colors.textFaint}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.pink,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  buttonPressed: {
    backgroundColor: colors.pinkPressed,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
