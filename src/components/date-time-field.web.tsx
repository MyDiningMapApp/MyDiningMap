// Webes változat (csak fejlesztés közbeni ellenőrzésre): a böngésző saját dátum-idő mezője.
import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  minimumDate?: Date;
};

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function DateTimeField({ label, value, onChange, minimumDate }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {createElement('input', {
        type: 'datetime-local',
        'aria-label': label,
        value: toLocalInput(value),
        min: minimumDate ? toLocalInput(minimumDate) : undefined,
        onChange: (e: { target: { value: string } }) => {
          const d = new Date(e.target.value);
          if (!Number.isNaN(d.getTime())) onChange(d);
        },
        style: {
          fontSize: 16,
          padding: 12,
          borderRadius: 12,
          border: 'none',
          background: theme.backgroundElement,
          color: theme.text,
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
});
