import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MAX_RATING } from '@/lib/places';

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
        return (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === n }}
            accessibilityLabel={`${n} pont`}
            onPress={() => onChange(value === n ? null : n)}
            style={[
              styles.cell,
              { backgroundColor: active ? theme.accent : theme.backgroundElement },
            ]}>
            <ThemedText
              style={[styles.cellText, { color: active ? theme.onAccent : theme.textSecondary }]}>
              {n}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Az értékeléshez tartozó halvány színpár (9–10 zöld, 7–8 sárga, alatta piros). */
export function useRatingColors(rating: number) {
  const theme = useTheme();
  if (rating >= 9) return { bg: theme.ratingHighBg, ink: theme.ratingHighInk };
  if (rating >= 7) return { bg: theme.ratingMidBg, ink: theme.ratingMidInk };
  return { bg: theme.ratingLowBg, ink: theme.ratingLowInk };
}

/** Értékelés kiírása, pl. „★ 8/10”. */
export function RatingBadge({ rating }: { rating: number | null }) {
  const colors = useRatingColors(rating ?? 0);
  if (rating == null) return null;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Icon name="star" size={12} color={colors.ink} />
      <ThemedText style={[styles.badgeText, { color: colors.ink }]}>{rating}/10</ThemedText>
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
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    fontWeight: 700,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 800,
  },
});
