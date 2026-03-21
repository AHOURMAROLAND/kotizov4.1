import React, { useState, useRef } from 'react';
import {
  View, TextInput, Text, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';
import useThemeStore from '../../store/themeStore';

export default function KInput({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  style,
  ...props
}) {
  const { colors } = useThemeStore();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(labelAnim, {
      toValue: 1, duration: 200, useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    if (!value) {
      Animated.timing(labelAnim, {
        toValue: 0, duration: 200, useNativeDriver: false,
      }).start();
    }
  };

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 6] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = focused ? colors.primary : colors.textTertiary;
  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.container, { backgroundColor: colors.cardSecondary, borderColor }]}>
        <Animated.Text style={[styles.label, { top: labelTop, fontSize: labelSize, color: labelColor }]}>
          {label}
        </Animated.Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.input, { color: colors.textPrimary }]}
          placeholderTextColor={colors.textTertiary}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eye}>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
              {showPassword ? 'CACHER' : 'VOIR'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  container: {
    height: 58,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  label: {
    position: 'absolute',
    left: 16,
    fontWeight: '500',
  },
  input: {
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  eye: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});