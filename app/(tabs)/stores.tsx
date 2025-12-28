
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, orderBy, query, Unsubscribe } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';

interface Store {
    id: string;
    name: string;
    location: string;
    imageUrl: string | null;
}

export default function StoresScreen() {
    const [stores, setStores] = useState<Store[]>([]);

    useEffect(() => {
        let unsubscribeSnapshot: Unsubscribe | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = undefined;
            }

            if (user) {
                const q = query(collection(db, 'stores'), orderBy('createdAt', 'desc'));
                unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                    const storesData: Store[] = [];
                    snapshot.forEach((doc) => {
                        storesData.push({ id: doc.id, ...doc.data() } as Store);
                    });
                    setStores(storesData);
                }, (error) => {
                    console.error("Error fetching stores:", error);
                });
            } else {
                setStores([]);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, []);

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.header}>Stores</ThemedText>
            <FlatList
                data={stores}
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
                ListEmptyComponent={<ThemedText>No stores found. Add one!</ThemedText>}
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
