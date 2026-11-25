import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatEventTime } from '@/lib/events';

type Props = {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  minimumDate?: Date;
};

/** Dátum és idő választása (iOS: kompakt rendszerválasztó; Android: két párbeszédablak). */
export function DateTimeField({ label, value, onChange, minimumDate }: Props) {
  const theme = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.row}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <DateTimePicker
          value={value}
          mode="datetime"
          display="compact"
          locale="hu-HU"
          minuteInterval={5}
          minimumDate={minimumDate}
          onValueChange={(_, date) => onChange(date)}
        />
      </View>
    );
  }

  function openAndroid() {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      minimumDate,
      onValueChange: (_, date) =>
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour: true,
          onValueChange: (__, time) => onChange(time),
        }),
    });
  }

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Pressable
        onPress={openAndroid}
        style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText>{formatEventTime(value)}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.one,
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
