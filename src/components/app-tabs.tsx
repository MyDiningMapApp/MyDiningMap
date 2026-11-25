import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useEvents } from '@/providers/events-provider';
import { useFriends } from '@/providers/friends-provider';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { incoming } = useFriends();
  const { pendingCount } = useEvents();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
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
