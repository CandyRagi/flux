import { Tabs } from 'expo-router';
import React from 'react';

import { Header } from '@/components/Header';
import { TabBar } from '@/components/TabBar';

export default function TabLayout() {
  return (
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
  );
}
