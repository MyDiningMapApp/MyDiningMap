import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MAX_RATING, placeColor } from '@/lib/places';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
};

/** 1–10 értékelés: tíz gomb; a kijelöltre újra koppintva törli az értékelést. */
export function RatingInput({ value, onChange }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Értékelés">
      {Array.from({ length: MAX_RATING }, (_, i) => i + 1).map((n) => {
        const active = value != null && n <= value;
        const color = placeColor({ status: 'visited', rating: value });
        return (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === n }}
            accessibilityLabel={`${n} pont`}
            onPress={() => onChange(value === n ? null : n)}
            style={[
              styles.cell,
              { backgroundColor: active ? color : theme.backgroundElement },
            ]}>
            <ThemedText type="smallBold" style={{ color: active ? '#ffffff' : theme.textSecondary }}>
              {n}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Értékelés kiírása, pl. „8/10”. */
export function RatingBadge({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  return (
    <View style={[styles.badge, { backgroundColor: placeColor({ status: 'visited', rating }) }]}>
      <ThemedText type="smallBold" style={styles.badgeText}>
        {rating}/10
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    color: '#ffffff',
  },
});
