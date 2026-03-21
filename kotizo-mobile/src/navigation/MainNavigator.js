import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import useThemeStore from '../store/themeStore';
import DashboardScreen from '../screens/app/DashboardScreen';
import CotisationsScreen from '../screens/app/CotisationsScreen';
import QuickPayScreen from '../screens/app/QuickPayScreen';
import ProfilScreen from '../screens/app/ProfilScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, color }) {
  const icons = {
    Accueil: focused ? 'H' : 'h',
    Cotisations: focused ? 'C' : 'c',
    QuickPay: focused ? 'Q' : 'q',
    Profil: focused ? 'P' : 'p',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color, fontSize: 18, fontWeight: focused ? '700' : '400' }}>
        {icons[name]}
      </Text>
    </View>
  );
}

export default function MainNavigator() {
  const { colors } = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Accueil" component={DashboardScreen} />
      <Tab.Screen name="Cotisations" component={CotisationsScreen} />
      <Tab.Screen name="QuickPay" component={QuickPayScreen} options={{ title: 'Quick Pay' }} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}