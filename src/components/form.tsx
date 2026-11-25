import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  /** Kártyán belül (szürke háttéren) a mező az oldal hátterének színét kapja, hogy látszódjon. */
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
          },
          error ? styles.inputError : null,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <ThemedText type="small" style={styles.errorText}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: primary ? Accent : theme.backgroundElement },
        (pressed || inactive) && styles.buttonDimmed,
      ]}>
      {loading ? (
        <ActivityIndicator color={primary ? '#ffffff' : theme.text} />
      ) : (
        <ThemedText style={{ color: primary ? '#ffffff' : theme.text, fontWeight: 600 }}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.formError}>
      <ThemedText type="small" style={styles.errorText}>
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
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#D93025',
  },
  errorText: {
    color: '#D93025',
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  buttonDimmed: {
    opacity: 0.6,
  },
  formError: {
    padding: Spacing.two,
    borderRadius: 8,
    backgroundColor: 'rgba(217, 48, 37, 0.1)',
  },
});
