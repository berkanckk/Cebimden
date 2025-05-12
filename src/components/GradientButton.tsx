import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../styles/colors';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  loading?: boolean;
  colors?: string[];
  startPosition?: { x: number; y: number };
  endPosition?: { x: number; y: number };
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
}

const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  colors,
  startPosition = { x: 0, y: 0 },
  endPosition = { x: 1, y: 1 },
  variant = 'primary',
}) => {
  // Varsayılan renkleri seç
  const getColors = () => {
    if (colors) return colors;
    
    switch (variant) {
      case 'secondary':
        return [COLORS.secondaryLight, COLORS.secondaryDark];
      case 'danger':
        return ['#FF6B6B', '#D03838'];
      case 'success':
        return ['#34D399', '#10B981'];
      case 'outline':
        return [COLORS.white, COLORS.white];
      default:
        return [COLORS.gradientStart, COLORS.gradientEnd];
    }
  };

  const buttonStyle = [
    styles.button,
    variant === 'outline' && styles.outlineButton,
    disabled && styles.disabledButton,
    style,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    variant === 'outline' && styles.outlineButtonText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={buttonStyle}
      activeOpacity={0.8}
    >
      {variant === 'outline' ? (
        loading ? (
          <ActivityIndicator color={COLORS.primary} size="small" />
        ) : (
          <Text style={buttonTextStyle}>{title}</Text>
        )
      ) : (
        <LinearGradient
          colors={getColors()}
          start={startPosition}
          end={endPosition}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={buttonTextStyle}>{title}</Text>
          )}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    height: 56,
    overflow: 'hidden',
    marginVertical: 10,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  outlineButtonText: {
    color: COLORS.primary,
  },
});

export default GradientButton; 