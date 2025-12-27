import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';

export default function SitesScreen() {
    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Sites</ThemedText>
            <ThemedText>List of sites will appear here.</ThemedText>
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
