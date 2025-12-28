import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { auth } from '../../firebaseConfig';

export default function SignupScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleSignup = async () => {
        if (!username || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: username });
            // Navigation is handled by the auth listener in _layout
        } catch (error: any) {
            console.error("Signup Error:", error);
            Alert.alert('Signup Failed', `Code: ${error.code}\nMessage: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>


            <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                placeholder="Username"
                placeholderTextColor={theme.icon}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

            <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                placeholder="Email"
                placeholderTextColor={theme.icon}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                placeholder="Password"
                placeholderTextColor={theme.icon}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.icon}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#64D2FF' }]}
                onPress={handleSignup}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/login')} style={styles.link}>
                <ThemedText type="link">Already have an account? Log in</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },

    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16,
        fontFamily: 'Valorant',
    },
    button: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Valorant',
    },
    link: {
        marginTop: 20,
        alignItems: 'center',
    },
});
