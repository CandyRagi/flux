import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Header() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const insets = useSafeAreaInsets();
    const theme = Colors[colorScheme ?? 'light'];
    const { user } = useAuth();

    const [profileData, setProfileData] = useState({
        displayName: user?.displayName || 'User',
        photoURL: user?.photoURL || '',
    });

    useEffect(() => {
        if (!user) return;

        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setProfileData({
                    displayName: data.displayName || user.displayName || 'User',
                    photoURL: data.photoURL || user.photoURL || '',
                });
            }
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.topRow}>
                <View>
                    <MaskedView
                        maskElement={
                            <ThemedText style={styles.greeting}>Dashboard</ThemedText>
                        }
                    >
                        <LinearGradient
                            colors={['#11aef7ff', '#FFFFFF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1.2, y: 0 }}
                        >
                            <ThemedText style={[styles.greeting, { opacity: 0 }]}>Dashboard</ThemedText>
                        </LinearGradient>
                    </MaskedView>
                </View>
                <View style={styles.rightIcons}>
                    <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconButton}>
                        <View style={styles.notificationBadge} />
                        <Ionicons name="notifications-outline" size={28} color={theme.icon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <Image
                            source={profileData.photoURL || "https://picsum.photos/seed/user/100"}
                            style={styles.profileImage}
                            contentFit="cover"
                            transition={1000}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={[styles.searchContainer, { backgroundColor: theme.background === '#000' ? '#1A1A1A' : '#F0F0F0' }]}>
                <Ionicons name="search" size={20} color={theme.icon} style={styles.searchIcon} />
                <TextInput
                    placeholder="Search..."
                    placeholderTextColor="#888"
                    style={[styles.searchInput, { color: theme.text }]}
                />
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 16,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 60,
    },
    greeting: {
        fontSize: 25,
        fontFamily: 'Valorant',
        lineHeight: 32,
        marginTop: 7,
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    iconButton: {
        padding: 4,
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F44336',
        zIndex: 1,
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#2A2E35',
        borderWidth: 2,
        borderColor: '#64D2FF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        marginTop: 10,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Valorant',
    },
});
