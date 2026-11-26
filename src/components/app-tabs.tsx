import { NativeTabs } from 'expo-router/native-tabs';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useEvents } from '@/providers/events-provider';
import { useFriends } from '@/providers/friends-provider';

/**
 * Alsó fülsor: az iOS saját menüje (iOS 26-tól lebegő „üveg” sáv), Menta színekkel.
 */
export default function AppTabs() {
  const theme = useTheme();
  const { incoming } = useFriends();
  const { pendingCount } = useEvents();

  return (
    <NativeTabs
      backgroundColor={theme.backgroundElement}
      tintColor={theme.accent}
      iconColor={{ default: theme.textSecondary, selected: theme.accent }}
      labelStyle={{
        default: { color: theme.textSecondary, fontFamily: FontFamily.medium },
        selected: { color: theme.accent, fontFamily: FontFamily.bold },
      }}
      indicatorColor={theme.accentSoft}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Térkép</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="places">
        <NativeTabs.Trigger.Label>Helyek</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md="list" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="friends">
        <NativeTabs.Trigger.Label>Barátok</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
        {incoming.length > 0 ? (
          <NativeTabs.Trigger.Badge>{String(incoming.length)}</NativeTabs.Trigger.Badge>
        ) : null}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="events">
        <NativeTabs.Trigger.Label>Események</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} md="event" />
        {pendingCount > 0 ? (
          <NativeTabs.Trigger.Badge>{String(pendingCount)}</NativeTabs.Trigger.Badge>
        ) : null}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
