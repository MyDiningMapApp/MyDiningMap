import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { cardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  /** Kártyán belül (fehér háttéren) használva, hogy a gomb látszódjon. */
  onCard?: boolean;
};

export function Chip({ label, selected, onPress, icon, onCard }: ChipProps) {
  const theme = useTheme();
  const color = selected ? theme.onAccent : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected
            ? theme.accent
            : onCard
              ? theme.backgroundSelected
              : theme.backgroundElement,
        },
        pressed && styles.pressed,
      ]}>
      {icon ? <Icon name={icon} size={15} color={color} /> : null}
      <ThemedText type="small" style={{ color, fontWeight: selected ? 700 : 500 }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

type Option<T> = { value: T; label: string; icon?: IconName };

type ChipGroupProps<T> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Ha igaz, a kijelölt elemre újra koppintva kiválasztja az `emptyValue`-t. */
  allowDeselect?: boolean;
  emptyValue?: T;
  /** Vízszintesen görgethető sor (sok elemhez); különben több sorba tördel. */
  scroll?: boolean;
  onCard?: boolean;
};

export function ChipGroup<T>({
  options,
  value,
  onChange,
  allowDeselect,
  emptyValue,
  scroll,
  onCard,
}: ChipGroupProps<T>) {
  const chips = options.map((o) => (
    <Chip
      key={String(o.value)}
      label={o.label}
      icon={o.icon}
      onCard={onCard}
      selected={o.value === value}
      onPress={() => onChange(allowDeselect && o.value === value ? (emptyValue as T) : o.value)}
    />
  ));
  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
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
  /** Kártyán belül (fehér háttéren) használva. */
  onCard?: boolean;
};

/** iOS-szerű szegmentált váltó. */
export function Segmented<T>({ options, value, onChange, onCard }: SegmentedProps<T>) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: onCard ? theme.background : theme.backgroundSelected },
      ]}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[
              styles.segment,
              selected && { backgroundColor: theme.backgroundElement },
              selected && cardShadow(theme),
            ]}>
            {o.icon ? (
              <Icon
                name={o.icon}
                size={14}
                color={selected ? theme.accent : theme.textSecondary}
              />
            ) : null}
            <ThemedText
              type="small"
              themeColor={selected ? 'text' : 'textSecondary'}
              style={{ fontWeight: selected ? 700 : 600 }}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.small,
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
    borderRadius: Radius.medium,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.small,
  },
});
