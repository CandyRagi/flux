import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface AddEntityModalProps {
    visible: boolean;
    onClose: () => void;
    type: 'site' | 'store';
    onSubmit: (name: string, location: string, imageUri: string | null) => Promise<void>;
}

export function AddEntityModal({ onClose, type, onSubmit }: AddEntityModalProps) {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!name || !location) return;

        setLoading(true);
        try {
            await onSubmit(name, location, imageUri);
            setName('');
            setLocation('');
            setImageUri(null);
            onClose();
        } catch (error) {
            console.error('Error creating entity:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Animated.View
            style={styles.overlay}
            entering={FadeIn}
            exiting={FadeOut}
        >
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
            <Animated.View
                style={[styles.container, { backgroundColor: theme.background }]}
                entering={SlideInDown.duration(250)}
                exiting={SlideOutDown.duration(250)}
            >
                <Text style={[styles.title, { color: theme.text }]}>
                    Add New {type === 'site' ? 'Site' : 'Store'}
                </Text>

                <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.image} />
                    ) : (
                        <View style={[styles.placeholder, { backgroundColor: theme.tint + '20' }]}>
                            <Ionicons name="camera" size={40} color={theme.tint} />
                            <Text style={{ color: theme.tint, marginTop: 8 }}>Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.icon, backgroundColor: theme.background }]}
                    placeholder="Name"
                    placeholderTextColor={theme.icon}
                    value={name}
                    onChangeText={setName}
                />

                <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.icon, backgroundColor: theme.background }]}
                    placeholder="Location"
                    placeholderTextColor={theme.icon}
                    value={location}
                    onChangeText={setLocation}
                />

                <View style={styles.buttons}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.icon + '40' }]}
                        onPress={onClose}
                        disabled={loading}
                    >
                        <Text style={{ color: theme.text }}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.tint }]}
                        onPress={handleSubmit}
                        disabled={loading || !name || !location}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Create</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
        zIndex: 1000,
    },
    container: {
        borderRadius: 20,
        padding: 24,
        gap: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    imagePicker: {
        alignSelf: 'center',
        marginBottom: 8,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    placeholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
