import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Header } from '@/components/Header';
import { RadialMenu } from '@/components/RadialMenu';
import { TabBar } from '@/components/TabBar';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          header: () => <Header />,
        }}>
        <Tabs.Screen
          name="sites"
          options={{
            title: 'Sites',
          }}
        />
        <Tabs.Screen
          name="stores"
          options={{
            title: 'Stores',
          }}
        />
      </Tabs>
      <RadialMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
