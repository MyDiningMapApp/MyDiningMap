import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { cardShadow, FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  /** Kártyán belül (fehér háttéren) a mező az oldal hátterének színét kapja, hogy látszódjon. */
  onCard?: boolean;
};

export function TextField({ label, error, onCard, style, ...rest }: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: onCard ? theme.background : theme.backgroundElement,
            borderColor: error ? theme.danger : 'transparent',
          },
          !onCard && cardShadow(theme),
          style,
        ]}
        {...rest}
      />
      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Kártyán belül: a másodlagos gomb az oldal hátterének színét kapja. */
  onCard?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  onCard,
}: ButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const inactive = disabled || loading;
  const color = primary ? theme.onAccent : variant === 'danger' ? theme.danger : theme.text;
  const background = primary
    ? theme.accent
    : variant === 'danger'
      ? theme.dangerSoft
      : onCard
        ? theme.background
        : theme.backgroundElement;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background },
        primary || (!onCard && variant === 'secondary') ? cardShadow(theme) : null,
        (pressed || inactive) && styles.buttonDimmed,
      ]}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? <Icon name={icon} size={17} color={color} /> : null}
          <ThemedText style={{ color, fontWeight: 700 }}>{title}</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

export function FormError({ message }: { message: string | null }) {
  const theme = useTheme();
  if (!message) return null;
  return (
    <View style={[styles.formError, { backgroundColor: theme.dangerSoft }]}>
      <ThemedText type="small" style={{ color: theme.danger }}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  input: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    paddingHorizontal: Spacing.three,
    paddingVertical: 13,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
  },
  button: {
    minHeight: 50,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  buttonDimmed: {
    opacity: 0.6,
  },
  formError: {
    padding: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small,
  },
});
