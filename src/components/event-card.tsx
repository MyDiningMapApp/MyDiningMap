import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  eventPlaceSummary,
  formatEventTime,
  RESPONSE_ICONS,
  RESPONSE_LABELS,
  responseSummary,
  type EventSummary,
} from '@/lib/events';

/** Egy esemény kártyája az Események listában. */
export function EventCard({ event, onPress }: { event: EventSummary; onPress: () => void }) {
  const theme = useTheme();
  const cancelled = event.status === 'cancelled';
  const needsAnswer = !cancelled && !event.is_organizer && event.my_response === 'pending';
  const organizer = event.organizer_display_name || `@${event.organizer_username}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement },
        needsAnswer && styles.highlight,
        pressed && styles.pressed,
      ]}>
      <View style={styles.titleRow}>
        <ThemedText
          type="smallBold"
          style={[styles.title, cancelled && styles.strike]}
          numberOfLines={1}>
          {event.title}
        </ThemedText>
        {event.is_organizer ? (
          <ThemedText type="small" style={styles.badge}>
            Szervező
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="small">🕒 {formatEventTime(event.starts_at)}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {eventPlaceSummary(event)}
      </ThemedText>
      {cancelled ? (
        <ThemedText type="small" themeColor="textSecondary">
          🚫 Lemondva
        </ThemedText>
      ) : (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {event.is_organizer
              ? `Te szervezed${event.has_suggestions ? ' · ⏰ új időpont-javaslat' : ''}`
              : `${organizer} szervezi · ${RESPONSE_ICONS[event.my_response ?? 'pending']} ${
                  needsAnswer
                    ? 'Válaszolj!'
                    : `Válaszod: ${RESPONSE_LABELS[event.my_response ?? 'pending']}`
                }`}
          </ThemedText>
          <ThemedText type="small" accessibilityLabel="Válaszok összesítve">
            {responseSummary(event)}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 4,
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  highlight: {
    borderColor: Accent,
  },
  pressed: {
    opacity: 0.7,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
    fontSize: 16,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  badge: {
    color: Accent,
    fontWeight: 600,
  },
});
