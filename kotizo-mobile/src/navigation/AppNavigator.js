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

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, init } = useAuthStore();
  const { init: initTheme } = useThemeStore();

  useEffect(() => {
    init();
    initTheme();
  }, []);

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
          <Stack.Screen name="Main" component={PlaceholderMain} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function PlaceholderMain() {
  return <View style={{ flex: 1, backgroundColor: '#0A0F1E' }} />;
}