import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MusicApp</Text>
      <Text style={styles.subtitle}>{mode === "login" ? "Welcome back" : "Create an account"}</Text>

      {mode === "register" && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder={mode === "login" ? "Email or username" : "Email"}
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>
          {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Register"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")}>
        <Text style={styles.switchText}>
          {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12", justifyContent: "center", padding: 24 },
  title: { fontSize: 32, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 15, color: "#9a9aa8", textAlign: "center", marginBottom: 28 },
  input: {
    backgroundColor: "#17171f",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#7c5cff",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 8,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600", fontSize: 15 },
  switchText: { color: "#9a9aa8", textAlign: "center", marginTop: 18, fontSize: 13 },
});
