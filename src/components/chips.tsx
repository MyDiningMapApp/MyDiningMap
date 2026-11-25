import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? Accent : theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="small" style={{ color: selected ? '#ffffff' : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

type Option<T> = { value: T; label: string };

type ChipGroupProps<T> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Ha igaz, a kijelölt elemre újra koppintva kiválasztja az `emptyValue`-t. */
  allowDeselect?: boolean;
  emptyValue?: T;
  /** Vízszintesen görgethető sor (sok elemhez); különben több sorba tördel. */
  scroll?: boolean;
};

export function ChipGroup<T>({
  options,
  value,
  onChange,
  allowDeselect,
  emptyValue,
  scroll,
}: ChipGroupProps<T>) {
  const chips = options.map((o) => (
    <Chip
      key={String(o.value)}
      label={o.label}
      selected={o.value === value}
      onPress={() =>
        onChange(allowDeselect && o.value === value ? (emptyValue as T) : o.value)
      }
    />
  ));
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chips}
      </ScrollView>
    );
  }
  return <View style={styles.wrap}>{chips}</View>;
}

type SegmentedProps<T> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Kártyán belül (szürke háttéren) használva. */
  onCard?: boolean;
};

/** iOS-szerű szegmentált váltó. */
export function Segmented<T>({ options, value, onChange, onCard }: SegmentedProps<T>) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: onCard ? theme.backgroundSelected : theme.backgroundElement },
      ]}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && { backgroundColor: theme.background }]}>
            <ThemedText
              type={selected ? 'smallBold' : 'small'}
              themeColor={selected ? 'text' : 'textSecondary'}
              numberOfLines={1}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
});
