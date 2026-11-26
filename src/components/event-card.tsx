import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { cardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  eventPlaceSummary,
  formatEventTime,
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
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: needsAnswer ? theme.accent : 'transparent' },
        cardShadow(theme),
        pressed && styles.pressed,
      ]}>
      <View style={styles.titleRow}>
        <ThemedText
          style={[styles.title, cancelled && styles.strike]}
          numberOfLines={1}>
          {event.title}
        </ThemedText>
        {event.is_organizer ? (
          <View style={[styles.tag, { backgroundColor: theme.accentSoft }]}>
            <ThemedText style={[styles.tagText, { color: theme.onAccentSoft }]}>Szervező</ThemedText>
          </View>
        ) : needsAnswer ? (
          <View style={[styles.tag, { backgroundColor: theme.accent }]}>
            <ThemedText style={[styles.tagText, { color: theme.onAccent }]}>Válaszolj!</ThemedText>
          </View>
        ) : null}
      </View>
      <View style={styles.line}>
        <Icon name="clock" size={14} color={theme.textSecondary} />
        <ThemedText type="small">{formatEventTime(event.starts_at)}</ThemedText>
      </View>
      <View style={styles.line}>
        <Icon name={event.chosen_place ? 'pin' : 'vote'} size={14} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.flex}>
          {eventPlaceSummary(event)}
        </ThemedText>
      </View>
      {cancelled ? (
        <View style={styles.line}>
          <Icon name="cancel" size={14} color={theme.danger} />
          <ThemedText type="small" style={{ color: theme.danger }}>
            Lemondva
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.flex}>
            {event.is_organizer
              ? `Te szervezed${event.has_suggestions ? ' · új időpont-javaslat' : ''}`
              : `${organizer} szervezi${
                  needsAnswer ? '' : ` · Válaszod: ${RESPONSE_LABELS[event.my_response ?? 'pending']}`
                }`}
          </ThemedText>
          <ThemedText type="small" accessibilityLabel="Válaszok összesítve" style={styles.summary}>
            {responseSummary(event)}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 6,
    padding: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.75,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 800,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  tagText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flex: {
    flex: 1,
  },
  footer: {
    flexDirection: 'column',
    gap: 2,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  summary: {
    fontWeight: 600,
  },
});
