import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../store/themeStore';
import DashboardScreen from '../screens/app/DashboardScreen';
import CotisationsScreen from '../screens/app/CotisationsScreen';
import QuickPayScreen from '../screens/app/QuickPayScreen';
import ProfilScreen from '../screens/app/ProfilScreen';

const Tab = createBottomTabNavigator();

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
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Accueil: focused ? 'home' : 'home-outline',
            Cotisations: focused ? 'wallet' : 'wallet-outline',
            QuickPay: focused ? 'flash' : 'flash-outline',
            Profil: focused ? 'person' : 'person-outline',
          };
          const iconName = icons[route.name];
          return (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 32,
              borderRadius: 16,
              backgroundColor: focused ? colors.primary + '20' : 'transparent',
            }}>
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Accueil"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen
        name="Cotisations"
        component={CotisationsScreen}
        options={{ tabBarLabel: 'Cotisations' }}
      />
      <Tab.Screen
        name="QuickPay"
        component={QuickPayScreen}
        options={{ tabBarLabel: 'Quick Pay' }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}