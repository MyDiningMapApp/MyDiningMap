import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { DateTimeField } from '@/components/date-time-field';
import { Button, FormError, TextField } from '@/components/form';
import { FriendSelector } from '@/components/friend-selector';
import { OptionPicker } from '@/components/option-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createEvent, defaultEventTime, type OptionInput } from '@/lib/events';
import { useEvents } from '@/providers/events-provider';
import { useFriends } from '@/providers/friends-provider';

export default function NewEventScreen() {
  const theme = useTheme();
  const { friends } = useFriends();
  const { reload } = useEvents();

  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState(defaultEventTime);
  const [note, setNote] = useState('');
  const [invitees, setInvitees] = useState<string[]>([]);
  const [options, setOptions] = useState<OptionInput[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!title.trim()) return setError('Add meg az esemény címét.');
    if (startsAt.getTime() < Date.now()) return setError('Az időpont nem lehet a múltban.');
    if (invitees.length === 0) return setError('Hívj meg legalább egy barátot.');
    if (options.length === 0) return setError('Javasolj legalább egy helyet.');
    setError(null);
    setSaving(true);
    try {
      const id = await createEvent({ title: title.trim(), startsAt, note, invitees, options });
      await reload();
      router.replace({ pathname: '/event/[id]', params: { id } });
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ThemedText style={{ color: Accent }}>Mégse</ThemedText>
            </Pressable>
          ),
          headerRight: () =>
            saving ? (
              <ActivityIndicator />
            ) : (
              <Pressable onPress={save} hitSlop={12}>
                <ThemedText style={{ color: Accent, fontWeight: 600 }}>Létrehozás</ThemedText>
              </Pressable>
            ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <TextField
            label="Cím *"
            value={title}
            onChangeText={setTitle}
            placeholder="pl. Péntek esti ramen"
            maxLength={100}
            autoFocus
          />
          <DateTimeField
            label="Időpont"
            value={startsAt}
            onChange={setStartsAt}
            minimumDate={new Date()}
          />
          <TextField
            label="Megjegyzés"
            value={note}
            onChangeText={setNote}
            placeholder="pl. Asztalt foglalok, szólj, ha jössz!"
            multiline
            maxLength={1000}
            style={styles.note}
          />

          <View style={styles.section}>
            <ThemedText type="smallBold">Kiket hívsz meg? ({invitees.length})</ThemedText>
            <FriendSelector friends={friends} selected={invitees} onChange={setInvitees} />
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold">Javasolt helyek ({options.length})</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Ha több helyet javasolsz, a meghívottak szavazhatnak, a végső helyet te választod ki.
            </ThemedText>
            {options.map((o, i) => (
              <View
                key={`${o.name}-${i}`}
                style={[styles.option, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{o.name}</ThemedText>
                  {o.address || o.district ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {[o.address, o.district ? `${o.district}. ker.` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </ThemedText>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => setOptions((list) => list.filter((_, j) => j !== i))}
                  hitSlop={8}
                  accessibilityLabel={`${o.name} eltávolítása`}>
                  <ThemedText themeColor="textSecondary" style={styles.remove}>
                    ✕
                  </ThemedText>
                </Pressable>
              </View>
            ))}
            <Button
              title="＋ Hely hozzáadása"
              variant="secondary"
              onPress={() => setPickerOpen(true)}
            />
          </View>

          <FormError message={error} />
          <Button title="Létrehozás és meghívók küldése" onPress={save} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>

      <OptionPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(o) => setOptions((list) => [...list, o])}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  note: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  section: {
    gap: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  remove: {
    fontSize: 18,
  },
});
