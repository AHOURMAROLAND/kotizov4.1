import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

import SplashScreen from '../screens/onboarding/SplashScreen';
import TutorialScreen from '../screens/onboarding/TutorialScreen';
import CGUScreen from '../screens/onboarding/CGUScreen';
import ConnexionScreen from '../screens/auth/ConnexionScreen';
import InscriptionScreen from '../screens/auth/InscriptionScreen';
import VerificationScreen from '../screens/auth/VerificationScreen';
import MainNavigator from './MainNavigator';
import CreerCotisationScreen from '../screens/app/CreerCotisationScreen';
import DetailCotisationScreen from '../screens/app/DetailCotisationScreen';
import RejoindreScreen from '../screens/app/RejoindreScreen';
import CreerQuickPayScreen from '../screens/app/CreerQuickPayScreen';
import HistoriqueScreen from '../screens/app/HistoriqueScreen';
import StatistiquesScreen from '../screens/app/StatistiquesScreen';
import NotificationsScreen from '../screens/app/NotificationsScreen';
import AgentIAScreen from '../screens/app/AgentIAScreen';
import VerificationProfilScreen from '../screens/app/VerificationScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, init } = useAuthStore();
  const { init: initTheme } = useThemeStore();

  useEffect(() => { init(); initTheme(); }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F1E' }}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Tutorial" component={TutorialScreen} />
            <Stack.Screen name="CGU" component={CGUScreen} />
            <Stack.Screen name="Connexion" component={ConnexionScreen} />
            <Stack.Screen name="Inscription" component={InscriptionScreen} />
            <Stack.Screen name="Verification" component={VerificationScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen name="CreerCotisation" component={CreerCotisationScreen} />
            <Stack.Screen name="DetailCotisation" component={DetailCotisationScreen} />
            <Stack.Screen name="Rejoindre" component={RejoindreScreen} />
            <Stack.Screen name="CreerQuickPay" component={CreerQuickPayScreen} />
            <Stack.Screen name="Historique" component={HistoriqueScreen} />
            <Stack.Screen name="Statistiques" component={StatistiquesScreen} />
            <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
            <Stack.Screen name="AgentIA" component={AgentIAScreen} />
            <Stack.Screen name="VerificationProfil" component={VerificationProfilScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}