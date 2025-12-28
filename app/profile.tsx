import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebaseConfig';

interface UserProfile {
    displayName: string;
    photoURL: string;
    email: string;
}

export default function ProfileScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [profile, setProfile] = useState<UserProfile>({
        displayName: '',
        photoURL: '',
        email: '',
    });
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Password change states
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        loadUserProfile();
    }, [user]);

    const loadUserProfile = async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();

            setProfile({
                displayName: userData?.displayName || user.displayName || 'User',
                photoURL: userData?.photoURL || user.photoURL || '',
                email: user.email || '',
            });
            setTempName(userData?.displayName || user.displayName || 'User');
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            uploadToCloudinary(result.assets[0].uri);
        }
    };

    const uploadToCloudinary = async (uri: string) => {
        if (!user) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri,
                type: 'image/jpeg',
                name: 'profile.jpg',
            } as any);
            formData.append('upload_preset', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');

            const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;

            console.log('Uploading to Cloudinary:', cloudName);
            console.log('Upload preset:', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                    },
                }
            );

            const data = await response.json();
            console.log('Cloudinary response:', data);

            if (!response.ok) {
                console.error('Cloudinary error:', data);
                throw new Error(data.error?.message || 'Upload failed');
            }

            if (data.secure_url) {
                // Update Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    photoURL: data.secure_url,
                    displayName: profile.displayName,
                    email: profile.email,
                }, { merge: true });

                // Update Firebase Auth profile
                await updateProfile(user, { photoURL: data.secure_url });

                setProfile({ ...profile, photoURL: data.secure_url });
                Alert.alert('Success', 'Profile picture updated!');
            } else {
                throw new Error('No image URL returned from Cloudinary');
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert(
                'Upload failed',
                error.message || 'Could not upload profile picture. Please check your Cloudinary settings and try again.'
            );
        } finally {
            setUploading(false);
        }
    };

    const handleSaveName = async () => {
        if (!user || !tempName.trim()) return;

        try {
            await setDoc(doc(db, 'users', user.uid), {
                displayName: tempName,
                photoURL: profile.photoURL,
                email: profile.email,
            }, { merge: true });

            await updateProfile(user, { displayName: tempName });

            setProfile({ ...profile, displayName: tempName });
            setIsEditingName(false);
            Alert.alert('Success', 'Name updated!');
        } catch (error) {
            console.error('Error updating name:', error);
            Alert.alert('Error', 'Could not update name. Please try again.');
        }
    };

    const handleChangePassword = async () => {
        if (!user || !user.email) return;

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setChangingPassword(true);
        try {
            // Re-authenticate user
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);

            Alert.alert('Success', 'Password updated successfully!');
            setShowPasswordChange(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Password change error:', error);
            if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Current password is incorrect');
            } else {
                Alert.alert('Error', 'Could not change password. Please try again.');
            }
        } finally {
            setChangingPassword(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            router.replace('/login');
                        } catch (error) {
                            Alert.alert('Error', 'Could not sign out. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ActivityIndicator size="large" color="#64D2FF" />
            </ThemedView>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
                <ThemedView style={styles.container}>
                    {/* Profile Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                            {uploading ? (
                                <View style={[styles.avatar, { backgroundColor: theme.icon + '20' }]}>
                                    <ActivityIndicator color="#64D2FF" />
                                </View>
                            ) : profile.photoURL ? (
                                <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, { backgroundColor: theme.icon + '20' }]}>
                                    <Ionicons name="person" size={50} color={theme.icon} />
                                </View>
                            )}
                            <View style={styles.editBadge}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        {/* Name Section */}
                        <View style={styles.nameSection}>
                            {isEditingName ? (
                                <View style={styles.nameEditContainer}>
                                    <TextInput
                                        style={[styles.nameInput, { color: theme.text, borderColor: theme.icon }]}
                                        value={tempName}
                                        onChangeText={setTempName}
                                        autoFocus
                                    />
                                    <View style={styles.nameEditButtons}>
                                        <TouchableOpacity onPress={handleSaveName} style={styles.iconButton}>
                                            <Ionicons name="checkmark" size={24} color="#4CAF50" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setIsEditingName(false);
                                                setTempName(profile.displayName);
                                            }}
                                            style={styles.iconButton}
                                        >
                                            <Ionicons name="close" size={24} color="#F44336" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.nameDisplayContainer}>
                                    <ThemedText type="title" style={styles.name}>
                                        {profile.displayName}
                                    </ThemedText>
                                    <TouchableOpacity onPress={() => setIsEditingName(true)}>
                                        <Ionicons name="pencil" size={20} color={theme.icon} />
                                    </TouchableOpacity>
                                </View>
                            )}
                            <ThemedText style={styles.email}>{profile.email}</ThemedText>
                        </View>
                    </View>

                    {/* Password Change Section */}
                    <View style={[styles.section, { backgroundColor: theme.icon + '10' }]}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => setShowPasswordChange(!showPasswordChange)}
                        >
                            <View style={styles.sectionTitleContainer}>
                                <Ionicons name="lock-closed" size={24} color={theme.text} />
                                <ThemedText type="subtitle" style={styles.sectionTitle}>
                                    Change Password
                                </ThemedText>
                            </View>
                            <Ionicons
                                name={showPasswordChange ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                color={theme.icon}
                            />
                        </TouchableOpacity>

                        {showPasswordChange && (
                            <View style={styles.passwordForm}>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                                    placeholder="Current Password"
                                    placeholderTextColor={theme.icon}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry
                                />
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                                    placeholder="New Password"
                                    placeholderTextColor={theme.icon}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                />
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                                    placeholder="Confirm New Password"
                                    placeholderTextColor={theme.icon}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: '#64D2FF' }]}
                                    onPress={handleChangePassword}
                                    disabled={changingPassword}
                                >
                                    {changingPassword ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <ThemedText style={styles.buttonText}>Update Password</ThemedText>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* About Us Section */}
                    <View style={[styles.section, { backgroundColor: theme.icon + '10' }]}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <Ionicons name="information-circle" size={24} color={theme.text} />
                                <ThemedText type="subtitle" style={styles.sectionTitle}>
                                    About Us
                                </ThemedText>
                            </View>
                        </View>
                        <View style={styles.aboutContent}>
                            <ThemedText style={styles.aboutText}>
                                Flux is your modern solution for managing sites and stores efficiently. Built with
                                cutting-edge technology and designed with you in mind.
                            </ThemedText>
                            <ThemedText style={[styles.aboutText, { marginTop: 12 }]}>
                                Version 1.0.0
                            </ThemedText>
                        </View>
                    </View>

                    {/* Sign Out Button */}
                    <TouchableOpacity
                        style={[styles.signOutButton, { backgroundColor: '#F44336' }]}
                        onPress={handleSignOut}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                        <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#64D2FF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    nameSection: {
        alignItems: 'center',
        width: '100%',
    },
    nameDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    nameEditContainer: {
        width: '100%',
        alignItems: 'center',
    },
    nameInput: {
        fontSize: 24,
        fontFamily: 'Valorant',
        borderBottomWidth: 2,
        paddingVertical: 8,
        paddingHorizontal: 16,
        textAlign: 'center',
        minWidth: 200,
    },
    nameEditButtons: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 12,
    },
    iconButton: {
        padding: 8,
    },
    name: {
        marginBottom: 4,
    },
    email: {
        opacity: 0.7,
        marginTop: 4,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sectionTitle: {
        marginBottom: 0,
    },
    passwordForm: {
        marginTop: 16,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 12,
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
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Valorant',
    },
    aboutContent: {
        marginTop: 12,
    },
    aboutText: {
        lineHeight: 22,
        opacity: 0.8,
        fontFamily: 'Valorant',
    },
    signOutButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
        marginBottom: 40,
    },
    signOutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Valorant',
    },
});
