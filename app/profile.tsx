import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
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
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Edit modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);

    // About modal state
    const [showAboutModal, setShowAboutModal] = useState(false);

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

            if (!response.ok) {
                throw new Error(data.error?.message || 'Upload failed');
            }

            if (data.secure_url) {
                await setDoc(doc(db, 'users', user.uid), {
                    photoURL: data.secure_url,
                    displayName: profile.displayName,
                    email: profile.email,
                }, { merge: true });

                await updateProfile(user, { photoURL: data.secure_url });

                setProfile({ ...profile, photoURL: data.secure_url });
                Alert.alert('Success', 'Profile picture updated!');
            } else {
                throw new Error('No image URL returned from Cloudinary');
            }
        } catch (error: any) {
            Alert.alert(
                'Upload failed',
                error.message || 'Could not upload profile picture. Please try again.'
            );
        } finally {
            setUploading(false);
        }
    };

    const openEditModal = () => {
        setEditName(profile.displayName);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowEditModal(true);
    };

    const handleSaveChanges = async () => {
        if (!user) return;

        setSaving(true);
        try {
            let nameUpdated = false;
            let passwordUpdated = false;

            // Update name if changed
            if (editName.trim() && editName !== profile.displayName) {
                await setDoc(doc(db, 'users', user.uid), {
                    displayName: editName,
                    photoURL: profile.photoURL,
                    email: profile.email,
                }, { merge: true });

                await updateProfile(user, { displayName: editName });
                setProfile({ ...profile, displayName: editName });
                nameUpdated = true;
            }

            // Update password if provided
            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    Alert.alert('Error', 'New passwords do not match');
                    setSaving(false);
                    return;
                }

                if (newPassword.length < 6) {
                    Alert.alert('Error', 'Password must be at least 6 characters');
                    setSaving(false);
                    return;
                }

                if (!currentPassword) {
                    Alert.alert('Error', 'Please enter your current password');
                    setSaving(false);
                    return;
                }

                if (!user.email) {
                    Alert.alert('Error', 'Email not found');
                    setSaving(false);
                    return;
                }

                // Re-authenticate user
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);

                // Update password
                await updatePassword(user, newPassword);
                passwordUpdated = true;
            }

            if (nameUpdated || passwordUpdated) {
                const messages = [];
                if (nameUpdated) messages.push('Name');
                if (passwordUpdated) messages.push('Password');
                Alert.alert('Success', `${messages.join(' and ')} updated successfully!`);
            } else {
                Alert.alert('Info', 'No changes to save');
            }

            setShowEditModal(false);
        } catch (error: any) {
            console.error('Save error:', error);
            if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Current password is incorrect');
            } else {
                Alert.alert('Error', 'Could not save changes. Please try again.');
            }
        } finally {
            setSaving(false);
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
                    {/* Profile Header - Transparent Background */}
                    <View style={styles.headerGradient}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                                {uploading ? (
                                    <View style={[styles.avatar, { backgroundColor: 'rgba(100, 210, 255, 0.1)' }]}>
                                        <ActivityIndicator color="#64D2FF" />
                                    </View>
                                ) : profile.photoURL ? (
                                    <View style={styles.avatarWrapper}>
                                        <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
                                        <View style={styles.avatarGlow} />
                                    </View>
                                ) : (
                                    <View style={[styles.avatar, { backgroundColor: 'rgba(100, 210, 255, 0.1)' }]}>
                                        <Ionicons name="person" size={60} color="#64D2FF" />
                                    </View>
                                )}
                                <View style={styles.editBadge}>
                                    <Ionicons name="camera" size={18} color="#fff" />
                                </View>
                            </TouchableOpacity>

                            {/* Name Section */}
                            <View style={styles.nameSection}>
                                <ThemedText type="title" style={styles.name}>
                                    {profile.displayName}
                                </ThemedText>
                                <ThemedText style={styles.email}>{profile.email}</ThemedText>
                            </View>

                            {/* Edit Profile Button */}
                            <TouchableOpacity onPress={openEditModal} style={styles.editProfileButton}>
                                <LinearGradient
                                    colors={['#64D2FF', '#4A9FD8']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Ionicons name="create-outline" size={20} color="#fff" />
                                    <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* About Us Button */}
                            <TouchableOpacity onPress={() => setShowAboutModal(true)} style={styles.aboutButton}>
                                <LinearGradient
                                    colors={['rgba(100, 210, 255, 0.3)', 'rgba(100, 210, 255, 0.15)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Ionicons name="information-circle-outline" size={20} color="#64D2FF" />
                                    <ThemedText style={[styles.buttonText, { color: '#64D2FF' }]}>About Us</ThemedText>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sign Out Button */}
                    <TouchableOpacity
                        style={styles.signOutButton}
                        onPress={handleSignOut}
                    >
                        <LinearGradient
                            colors={['#F44336', '#D32F2F']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Ionicons name="log-out-outline" size={24} color="#fff" />
                            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
                        </LinearGradient>
                    </TouchableOpacity>
                </ThemedView>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContainer}
                    >
                        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <ThemedText type="title" style={styles.modalTitle}>Edit Profile</ThemedText>
                                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                    <Ionicons name="close" size={28} color={theme.icon} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalScroll}>
                                {/* Name Section */}
                                <View style={styles.inputSection}>
                                    <ThemedText style={styles.inputLabel}>Display Name</ThemedText>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: 'rgba(100, 210, 255, 0.3)', backgroundColor: 'rgba(100, 210, 255, 0.05)' }]}
                                        value={editName}
                                        onChangeText={setEditName}
                                        placeholder="Enter your name"
                                        placeholderTextColor={theme.icon}
                                    />
                                </View>

                                {/* Password Section */}
                                <View style={styles.inputSection}>
                                    <ThemedText style={styles.inputLabel}>Change Password (Optional)</ThemedText>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: 'rgba(100, 210, 255, 0.3)', backgroundColor: 'rgba(100, 210, 255, 0.05)' }]}
                                        placeholder="Current Password"
                                        placeholderTextColor={theme.icon}
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                        secureTextEntry
                                    />
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: 'rgba(100, 210, 255, 0.3)', backgroundColor: 'rgba(100, 210, 255, 0.05)' }]}
                                        placeholder="New Password"
                                        placeholderTextColor={theme.icon}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry
                                    />
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: 'rgba(100, 210, 255, 0.3)', backgroundColor: 'rgba(100, 210, 255, 0.05)' }]}
                                        placeholder="Confirm New Password"
                                        placeholderTextColor={theme.icon}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </ScrollView>

                            {/* Save Button */}
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveChanges}
                                disabled={saving}
                            >
                                <LinearGradient
                                    colors={['#64D2FF', '#4A9FD8']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                            <ThemedText style={styles.buttonText}>Save Changes</ThemedText>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* About Us Modal */}
            <Modal
                visible={showAboutModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAboutModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContainer}
                    >
                        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <ThemedText type="title" style={styles.modalTitle}>About Us</ThemedText>
                                <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                                    <Ionicons name="close" size={28} color={theme.icon} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalScroll}>
                                {/* About Content */}
                                <View style={styles.aboutModalContent}>
                                    <View style={styles.aboutIconContainer}>
                                        <Ionicons name="information-circle" size={60} color="#64D2FF" />
                                    </View>

                                    <ThemedText type="subtitle" style={styles.aboutModalTitle}>
                                        Flux
                                    </ThemedText>

                                    <ThemedText style={styles.aboutModalText}>
                                        Your modern solution for managing sites and stores efficiently. Built with
                                        cutting-edge technology and designed with you in mind.
                                    </ThemedText>

                                    <View style={styles.aboutDivider} />

                                    <View style={styles.aboutInfoRow}>
                                        <Ionicons name="code-slash" size={20} color="#64D2FF" />
                                        <ThemedText style={styles.aboutInfoText}>Version 1.0.0</ThemedText>
                                    </View>

                                    <View style={styles.aboutInfoRow}>
                                        <Ionicons name="rocket" size={20} color="#64D2FF" />
                                        <ThemedText style={styles.aboutInfoText}>Built with React Native & Expo</ThemedText>
                                    </View>

                                    <View style={styles.aboutInfoRow}>
                                        <Ionicons name="shield-checkmark" size={20} color="#64D2FF" />
                                        <ThemedText style={styles.aboutInfoText}>Secure & Reliable</ThemedText>
                                    </View>
                                </View>
                            </ScrollView>

                            {/* Close Button */}
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={() => setShowAboutModal(false)}
                            >
                                <LinearGradient
                                    colors={['#64D2FF', '#4A9FD8']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <ThemedText style={styles.buttonText}>Close</ThemedText>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 40,
    },
    headerGradient: {
        paddingTop: 110,
        paddingBottom: 40,
        marginBottom: 20,
    },
    header: {
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#64D2FF',
    },
    avatarGlow: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#64D2FF',
        opacity: 0.2,
        shadowColor: '#64D2FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
    },
    editBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#64D2FF',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#0A0E1A',
        shadowColor: '#64D2FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    nameSection: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    name: {
        marginBottom: 4,
        fontFamily: 'Valorant',
    },
    email: {
        opacity: 0.7,
        marginTop: 8,
        fontSize: 15,
    },
    editProfileButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginHorizontal: 20,
        width: '90%',
        marginBottom: 16,
    },
    aboutButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginHorizontal: 20,
        width: '90%',
        marginBottom: 16,
    },
    section: {
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: 'rgba(100, 210, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(100, 210, 255, 0.15)',
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
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(100, 210, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        marginBottom: 0,
    },
    gradientButton: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Valorant',
    },
    aboutContent: {
        marginTop: 16,
    },
    aboutText: {
        lineHeight: 24,
        opacity: 0.8,
        fontFamily: 'Valorant',
        fontSize: 14,
    },
    signOutButton: {
        marginHorizontal: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    signOutText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Valorant',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(100, 210, 255, 0.15)',
    },
    modalTitle: {
        fontFamily: 'Valorant',
        fontSize: 24,
    },
    modalScroll: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    inputSection: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 8,
        opacity: 0.8,
        fontFamily: 'Valorant',
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 12,
        fontSize: 16,
        fontFamily: 'Valorant',
    },
    saveButton: {
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    // About Modal Styles
    aboutModalContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    aboutIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(100, 210, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    aboutModalTitle: {
        marginBottom: 16,
        fontFamily: 'Valorant',
    },
    aboutModalText: {
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
        fontFamily: 'Valorant',
        fontSize: 14,
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    aboutDivider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(100, 210, 255, 0.15)',
        marginVertical: 20,
    },
    aboutInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        width: '100%',
        paddingHorizontal: 20,
    },
    aboutInfoText: {
        fontSize: 14,
        fontFamily: 'Valorant',
        opacity: 0.9,
    },
});
