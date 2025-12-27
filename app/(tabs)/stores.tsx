import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';

export default function StoresScreen() {
    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Stores</ThemedText>
            <ThemedText>List of stores will appear here.</ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 8,
    },
});
