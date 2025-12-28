import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, orderBy, query, Unsubscribe } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';

interface Site {
    id: string;
    name: string;
    location: string;
    imageUrl: string | null;
}

export default function SitesScreen() {
    const [sites, setSites] = useState<Site[]>([]);

    useEffect(() => {
        let unsubscribeSnapshot: Unsubscribe | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = undefined;
            }

            if (user) {
                const q = query(collection(db, 'sites'), orderBy('createdAt', 'desc'));
                unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                    const sitesData: Site[] = [];
                    snapshot.forEach((doc) => {
                        sitesData.push({ id: doc.id, ...doc.data() } as Site);
                    });
                    setSites(sitesData);
                }, (error) => {
                    console.error("Error fetching sites:", error);
                });
            } else {
                setSites([]);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, []);

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.header}>Sites</ThemedText>
            <FlatList
                data={sites}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.image} />}
                        <View style={styles.info}>
                            <ThemedText type="subtitle">{item.name}</ThemedText>
                            <ThemedText>{item.location}</ThemedText>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<ThemedText>No sites found. Add one!</ThemedText>}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        marginBottom: 20,
    },
    list: {
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        gap: 12,
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    info: {
        flex: 1,
    },
});
