import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Target, Wallet, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

function TabBarIcon({ icon: Icon, color, focused }: {
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  focused: boolean;
}) {
  return (
    <View className={`items-center justify-center ${focused ? 'opacity-100' : 'opacity-60'}`}>
      <Icon size={28} color={color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          paddingTop: 12,
          paddingBottom: 12,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginTop: 6,
        },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Plan', tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Target} color={color} focused={focused} /> }} />
      <Tabs.Screen name="spending" options={{ title: 'Spending', tabBarIcon: ({ color, focused }) => <TabBarIcon icon={Wallet} color={color} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <TabBarIcon icon={User} color={color} focused={focused} /> }} />
    </Tabs>
  );
}
