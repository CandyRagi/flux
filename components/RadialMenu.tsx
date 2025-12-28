import { Colors } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { AddEntityModal } from './AddEntityModal';

const FAB_SIZE = 60;
const ITEM_SIZE = 50;
const RADIUS = 100;

export function RadialMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'site' | 'store'>('site');

    const animation = useSharedValue(0);
    const pathname = usePathname();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const isSites = pathname.includes('sites') || pathname === '/';
    const addIcon = isSites ? 'globe-outline' : 'cart-outline';

    const iconColor = colorScheme === 'dark' ? '#000' : '#fff';

    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1;
        animation.value = withTiming(toValue, {
            duration: 200,
        });
        setIsOpen(!isOpen);
    };

    const handleAddPress = () => {
        setModalType(isSites ? 'site' : 'store');
        toggleMenu(); // Close menu
        setTimeout(() => {
            setIsModalVisible(true);
        }, 250); // Wait for animation to finish
    };

    const handleCreateEntity = async (name: string, location: string, imageUri: string | null) => {
        const user = auth.currentUser;
        if (!user) {
            console.error('No user logged in');
            return;
        }

        const collectionName = modalType === 'site' ? 'sites' : 'stores';

        try {
            await addDoc(collection(db, collectionName), {
                name,
                location,
                imageUrl: imageUri, // In a real app, upload to storage first and get URL
                adminId: user.uid,
                members: [user.uid],
                createdAt: serverTimestamp(),
            });
            console.log(`Created new ${modalType}: ${name}`);
        } catch (error) {
            console.error(`Error creating ${modalType}:`, error);
            throw error;
        }
    };

    const rotationStyle = useAnimatedStyle(() => {
        const rotate = interpolate(animation.value, [0, 1], [0, 45]);
        return {
            transform: [{ rotate: `${rotate}deg` }],
        };
    });

    const getAnimatedStyle = (angle: number) => {
        return useAnimatedStyle(() => {
            const rad = (angle * Math.PI) / 180;
            const x = interpolate(animation.value, [0, 1], [0, Math.cos(rad) * RADIUS]);
            const y = interpolate(animation.value, [0, 1], [0, Math.sin(rad) * RADIUS]);
            const scale = interpolate(animation.value, [0, 1], [0, 1]);
            const opacity = interpolate(animation.value, [0, 0.5, 1], [0, 0, 1]);

            return {
                transform: [{ translateX: x }, { translateY: y }, { scale }],
                opacity,
            };
        });
    };

    const MenuItem = ({ icon, angle, onPress }: { icon: keyof typeof Ionicons.glyphMap; angle: number; onPress?: () => void }) => (
        <Animated.View style={[styles.menuItemContainer, getAnimatedStyle(angle)]}>
            <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.tint }]} onPress={onPress}>
                <Ionicons name={icon} size={24} color={iconColor} />
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container} pointerEvents="box-none">
            {isOpen && (
                <BlurView intensity={60} style={styles.overlay} tint={colorScheme === 'dark' ? 'dark' : 'light'}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={toggleMenu}
                    />
                </BlurView>
            )}
            <View style={styles.menuWrapper} pointerEvents="box-none">
                {/* Analytics - Left (180 degrees) */}
                <MenuItem icon="stats-chart" angle={180} />

                {/* ChatBot - Top-Left (227 degrees) */}
                <MenuItem icon="chatbubble-ellipses" angle={225} />

                {/* Add Site/Store - Top (270 degrees) */}
                <MenuItem icon={addIcon} angle={270} onPress={handleAddPress} />

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={toggleMenu}
                    style={[styles.fab, { backgroundColor: theme.tint }]}
                >
                    <Animated.View style={rotationStyle}>
                        <Ionicons name="add" size={32} color={iconColor} />
                    </Animated.View>
                </TouchableOpacity>
            </View>

            {isModalVisible && (
                <AddEntityModal
                    visible={isModalVisible}
                    onClose={() => setIsModalVisible(false)}
                    type={modalType}
                    onSubmit={handleCreateEntity}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    menuWrapper: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        zIndex: 10,
    },
    menuItemContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        width: ITEM_SIZE,
        height: ITEM_SIZE,
    },
    menuItem: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        borderRadius: ITEM_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});
