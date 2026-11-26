import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/event-card';
import { TabHeader } from '@/components/tab-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { splitEvents } from '@/lib/events';
import { useEvents } from '@/providers/events-provider';

export default function EventsScreen() {
  const theme = useTheme();
  const { events, loading, error, reload } = useEvents();
  const [refreshing, setRefreshing] = useState(false);

  // A fülre visszatérve frissítünk (pl. egy esemény módosítása után).
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const sections = useMemo(() => {
    const { upcoming, past } = splitEvents(events);
    return [
      { title: `Közelgő (${upcoming.length})`, data: upcoming },
      ...(past.length > 0 ? [{ title: `Korábbi (${past.length})`, data: past }] : []),
    ];
  }, [events]);

  async function onRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <TabHeader
          actionLabel="Új esemény létrehozása"
          onAction={() => router.push('/event/new')}
        />
        <SectionList
          sections={sections}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
            />
          )}
          renderSectionHeader={({ section }) => (
            <ThemedView style={styles.sectionHeader}>
              <ThemedText type="smallBold">{section.title}</ThemedText>
            </ThemedView>
          )}
          ListHeaderComponent={
            error ? (
              <ThemedText type="small" style={[styles.error, { color: theme.danger }]}>
                {error} Húzd le a listát az újrapróbáláshoz.
              </ThemedText>
            ) : undefined
          }
          ListFooterComponent={
            !loading && events.length === 0 ? (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                Még nincs eseményed. Hívd meg a barátaidat egy közös vacsorára a jobb felső ＋
                gombbal!
              </ThemedText>
            ) : undefined
          }
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  sectionHeader: {
    paddingTop: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  error: {
    fontWeight: 600,
  },
});
