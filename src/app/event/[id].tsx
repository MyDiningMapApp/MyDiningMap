import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Avatar } from '@/components/avatar';
import { Chip } from '@/components/chips';
import { DateTimeField } from '@/components/date-time-field';
import { Button, TextField } from '@/components/form';
import { FriendSelector } from '@/components/friend-selector';
import { OptionPicker } from '@/components/option-picker';
import { MiniMap } from '@/components/place-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirm, showError } from '@/lib/confirm';
import {
  addEventInvitees,
  addEventOption,
  cancelEvent,
  chooseEventOption,
  formatEventTime,
  getEvent,
  removeEventOption,
  respondEvent,
  RESPONSE_ICONS,
  RESPONSE_LABELS,
  setEventVote,
  sortOptions,
  updateEvent,
  type EventDetails,
  type EventOption,
  type EventResponse,
} from '@/lib/events';
import { displayName } from '@/lib/social';
import { useAuth } from '@/providers/auth-provider';
import { useEvents } from '@/providers/events-provider';
import { useFriends } from '@/providers/friends-provider';

type Panel = 'none' | 'suggest' | 'invite' | 'edit';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { session } = useAuth();
  const { reload: reloadList } = useEvents();
  const { friends } = useFriends();

  const [event, setEvent] = useState<EventDetails | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [panel, setPanel] = useState<Panel>('none');
  const [pickerOpen, setPickerOpen] = useState(false);

  // Panelek állapota
  const [suggestTime, setSuggestTime] = useState(new Date());
  const [suggestComment, setSuggestComment] = useState('');
  const [inviteIds, setInviteIds] = useState<string[]>([]);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState(new Date());
  const [editNote, setEditNote] = useState('');

  const load = useCallback(async () => {
    try {
      setEvent(await getEvent(id));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  /** Művelet futtatása, majd az esemény és a lista frissítése. */
  async function run(key: string, action: () => Promise<unknown>, after?: () => void) {
    setBusy(key);
    try {
      await action();
      after?.();
      await Promise.all([load(), reloadList()]);
    } catch (e) {
      showError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (event === undefined || event === null) {
    return (
      <ThemedView style={styles.center}>
        {event === null ? (
          <ThemedText themeColor="textSecondary">Ez az esemény nem található.</ThemedText>
        ) : error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : (
          <ActivityIndicator />
        )}
      </ThemedView>
    );
  }

  const ev = event;
  const active = ev.status === 'active';
  const organizer = ev.is_organizer;
  // A saját meghívotti sorom (szervezőként nincs ilyen).
  const me = organizer ? undefined : ev.invitees.find((i) => i.id === session?.user.id);
  const chosen = ev.options.find((o) => o.id === ev.chosen_option_id) ?? null;
  const options = sortOptions(ev.options);

  function openPanel(p: Panel) {
    if (p === 'suggest') {
      setSuggestTime(me?.suggested_time ? new Date(me.suggested_time) : new Date(ev.starts_at));
      setSuggestComment(me?.comment ?? '');
    }
    if (p === 'invite') setInviteIds([]);
    if (p === 'edit') {
      setEditTitle(ev.title);
      setEditTime(new Date(ev.starts_at));
      setEditNote(ev.note ?? '');
    }
    setPanel(panel === p ? 'none' : p);
  }

  function respond(response: EventResponse) {
    run(`respond-${response}`, () =>
      respondEvent(
        ev.id,
        response,
        me?.suggested_time ? new Date(me.suggested_time) : null,
        me?.comment ?? null,
      ),
    );
  }

  function saveEdit() {
    const timeChanged = editTime.getTime() !== new Date(ev.starts_at).getTime();
    const doSave = () =>
      run(
        'edit',
        () => updateEvent(ev.id, editTitle, editTime, editNote),
        () => setPanel('none'),
      );
    if (timeChanged && ev.invitees.some((i) => i.response !== 'pending')) {
      confirm(
        'Időpont módosítása',
        'Az időpont módosításakor a meghívottak válaszai törlődnek, és újra vissza kell jelezniük.',
        'Módosítás',
        doSave,
        false,
      );
    } else {
      doSave();
    }
  }

  function acceptSuggestion(time: string, who: string) {
    confirm(
      'Időpont módosítása',
      `Átteszed az eseményt erre: ${formatEventTime(time)} (${who} javaslata)? A válaszok törlődnek, mindenki újra visszajelez.`,
      'Áttétel',
      () => run('accept-time', () => updateEvent(ev.id, ev.title, new Date(time), ev.note ?? '')),
      false,
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }>
        {/* Fejléc */}
        <View style={styles.header}>
          {!active ? (
            <ThemedView style={styles.cancelled}>
              <ThemedText style={styles.cancelledText}>🚫 Ezt az eseményt lemondták.</ThemedText>
            </ThemedView>
          ) : null}
          <ThemedText type="subtitle" style={styles.centerText}>
            {ev.title}
          </ThemedText>
          <ThemedText style={styles.centerText}>🕒 {formatEventTime(ev.starts_at)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Szervező: {organizer ? 'te' : displayName(ev.organizer)}
          </ThemedText>
          {ev.note ? (
            <ThemedView type="backgroundElement" style={styles.note}>
              <ThemedText>{ev.note}</ThemedText>
            </ThemedView>
          ) : null}
        </View>

        {/* Saját válasz (meghívottként) */}
        {me && active ? (
          <Section title="A válaszod">
            <View style={styles.responses}>
              {(['going', 'maybe', 'declined'] as const).map((r) => (
                <Chip
                  key={r}
                  label={`${RESPONSE_ICONS[r]} ${r === 'going' ? 'Jövök' : r === 'maybe' ? 'Talán' : 'Nem jövök'}`}
                  selected={me.response === r}
                  onPress={() => respond(r)}
                />
              ))}
              {busy?.startsWith('respond') ? <ActivityIndicator /> : null}
            </View>
            {me.suggested_time ? (
              <ThemedText type="small" themeColor="textSecondary">
                ⏰ Javasolt időpontod: {formatEventTime(me.suggested_time)}
                {me.comment ? ` · „${me.comment}”` : ''}
              </ThemedText>
            ) : null}
            <View style={styles.row}>
              <View style={styles.flex}>
                <Button
                  title={me.suggested_time ? '✏️ Módosítás' : '⏰ Másik időpontot javaslok'}
                  variant="secondary"
                  onPress={() => openPanel('suggest')}
                />
              </View>
              {me.suggested_time ? (
                <View style={styles.flex}>
                  <Button
                    title="Visszavonás"
                    variant="secondary"
                    loading={busy === 'unsuggest'}
                    onPress={() =>
                      run('unsuggest', () => respondEvent(ev.id, me.response, null, null))
                    }
                  />
                </View>
              ) : null}
            </View>
            {panel === 'suggest' ? (
              <ThemedView type="backgroundElement" style={styles.panel}>
                <DateTimeField
                  label="Javasolt időpont"
                  value={suggestTime}
                  onChange={setSuggestTime}
                  minimumDate={new Date()}
                />
                <TextField
                  label="Megjegyzés (nem kötelező)"
                  value={suggestComment}
                  onChangeText={setSuggestComment}
                  placeholder="pl. Pénteken dolgozom, szombat jó lenne"
                  maxLength={300}
                  onCard
                />
                <Button
                  title="Javaslat elküldése"
                  loading={busy === 'suggest'}
                  onPress={() =>
                    run(
                      'suggest',
                      () =>
                        respondEvent(
                          ev.id,
                          me.response === 'pending' ? 'maybe' : me.response,
                          suggestTime,
                          suggestComment,
                        ),
                      () => setPanel('none'),
                    )
                  }
                />
              </ThemedView>
            ) : null}
          </Section>
        ) : null}

        {/* Hely */}
        <Section
          title={chosen ? 'Helyszín' : `Szavazás a helyszínről (${ev.options.length} hely)`}
          hint={
            !chosen && active
              ? 'Szavazz azokra, amelyek jók neked (többre is lehet). A végső helyet a szervező választja ki.'
              : undefined
          }>
          {chosen && chosen.lat != null && chosen.lng != null ? (
            <MiniMap place={{ lat: chosen.lat, lng: chosen.lng, status: 'visited', rating: 9 }} />
          ) : null}
          {options.map((o) => (
            <OptionCard
              key={o.id}
              option={o}
              chosen={o.id === ev.chosen_option_id}
              hasChosen={!!chosen}
              active={active}
              organizer={organizer}
              canRemove={organizer && active && ev.options.length > 1}
              busy={busy}
              onVote={() => run(`vote-${o.id}`, () => setEventVote(o.id, !o.my_vote))}
              onChoose={() =>
                run(`choose-${o.id}`, () =>
                  chooseEventOption(ev.id, o.id === ev.chosen_option_id ? null : o.id),
                )
              }
              onRemove={() =>
                confirm('Hely törlése', `Törlöd a javaslatok közül: ${o.name}?`, 'Törlés', () =>
                  run(`remove-${o.id}`, () => removeEventOption(o.id)),
                )
              }
            />
          ))}
          {organizer && active ? (
            <Button
              title="＋ Hely hozzáadása"
              variant="secondary"
              loading={busy === 'add-option'}
              onPress={() => setPickerOpen(true)}
            />
          ) : null}
        </Section>

        {/* Résztvevők */}
        <Section
          title={`Résztvevők (${ev.invitees.filter((i) => i.response === 'going').length + 1} jön)`}>
          <PersonRow name={displayName(ev.organizer)} status="✅ Jön · Szervező" />
          {ev.invitees.map((i) => (
            <View key={i.id} style={[styles.person, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.personMain}>
                <Avatar name={displayName(i)} size={32} />
                <ThemedText type="smallBold" style={styles.flex}>
                  {displayName(i)}
                </ThemedText>
                <ThemedText type="small">
                  {RESPONSE_ICONS[i.response]} {RESPONSE_LABELS[i.response]}
                </ThemedText>
              </View>
              {i.suggested_time ? (
                <View style={styles.suggestion}>
                  <ThemedText type="small" themeColor="textSecondary">
                    ⏰ Javasolt időpont: {formatEventTime(i.suggested_time)}
                    {i.comment ? ` · „${i.comment}”` : ''}
                  </ThemedText>
                  {organizer && active ? (
                    <Pressable
                      onPress={() => acceptSuggestion(i.suggested_time!, displayName(i))}
                      hitSlop={6}>
                      <ThemedText type="small" style={styles.link}>
                        Elfogadom ezt az időpontot
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>
              ) : i.comment ? (
                <ThemedText type="small" themeColor="textSecondary">
                  „{i.comment}”
                </ThemedText>
              ) : null}
            </View>
          ))}
        </Section>

        {/* Szervezői műveletek */}
        {organizer && active ? (
          <Section title="Szervezés">
            <Button title="✏️ Szerkesztés" variant="secondary" onPress={() => openPanel('edit')} />
            {panel === 'edit' ? (
              <ThemedView type="backgroundElement" style={styles.panel}>
                <TextField
                  label="Cím"
                  value={editTitle}
                  onChangeText={setEditTitle}
                  maxLength={100}
                  onCard
                />
                <DateTimeField label="Időpont" value={editTime} onChange={setEditTime} />
                <TextField
                  label="Megjegyzés"
                  value={editNote}
                  onChangeText={setEditNote}
                  multiline
                  maxLength={1000}
                  onCard
                />
                <ThemedText type="small" themeColor="textSecondary">
                  Ha az időpontot módosítod, a válaszok törlődnek, és mindenki újra visszajelez.
                </ThemedText>
                <Button title="Mentés" loading={busy === 'edit'} onPress={saveEdit} />
              </ThemedView>
            ) : null}
            <Button
              title="👥 Barátok meghívása"
              variant="secondary"
              onPress={() => openPanel('invite')}
            />
            {panel === 'invite' ? (
              <ThemedView type="backgroundElement" style={styles.panel}>
                <FriendSelector
                  friends={friends}
                  selected={inviteIds}
                  onChange={setInviteIds}
                  disabledIds={ev.invitees.map((i) => i.id)}
                />
                <Button
                  title={`Meghívás (${inviteIds.length})`}
                  disabled={inviteIds.length === 0}
                  loading={busy === 'invite'}
                  onPress={() =>
                    run(
                      'invite',
                      () => addEventInvitees(ev.id, inviteIds),
                      () => setPanel('none'),
                    )
                  }
                />
              </ThemedView>
            ) : null}
            <Button
              title="Esemény lemondása"
              variant="secondary"
              loading={busy === 'cancel'}
              onPress={() =>
                confirm(
                  'Esemény lemondása',
                  'Biztosan lemondod az eseményt? A meghívottak látni fogják, hogy lemondtad.',
                  'Lemondás',
                  () => run('cancel', () => cancelEvent(ev.id)),
                )
              }
            />
          </Section>
        ) : null}

        {!active ? (
          <Button
            title="Vissza az eseményekhez"
            variant="secondary"
            onPress={() => router.back()}
          />
        ) : null}
      </ScrollView>

      <OptionPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(o) => run('add-option', () => addEventOption(ev.id, o))}
      />
    </ThemedView>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
      {children}
    </View>
  );
}

function PersonRow({ name, status }: { name: string; status: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.person, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.personMain}>
        <Avatar name={name} size={32} />
        <ThemedText type="smallBold" style={styles.flex}>
          {name}
        </ThemedText>
        <ThemedText type="small" style={styles.link}>
          {status}
        </ThemedText>
      </View>
    </View>
  );
}

function OptionCard({
  option,
  chosen,
  hasChosen,
  active,
  organizer,
  canRemove,
  busy,
  onVote,
  onChoose,
  onRemove,
}: {
  option: EventOption;
  chosen: boolean;
  hasChosen: boolean;
  active: boolean;
  organizer: boolean;
  canRemove: boolean;
  busy: string | null;
  onVote: () => void;
  onChoose: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.option,
        { backgroundColor: theme.backgroundElement },
        chosen && styles.optionChosen,
      ]}>
      <View style={styles.optionTop}>
        <View style={styles.flex}>
          <ThemedText type="smallBold">
            {chosen ? '✓ ' : ''}
            {option.name}
          </ThemedText>
          {option.address || option.district ? (
            <ThemedText type="small" themeColor="textSecondary">
              {[option.address, option.district ? `${option.district}. ker.` : null]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">
            🗳️ {option.votes} szavazat
            {option.voters.length > 0 ? ` (${option.voters.map((v) => `@${v}`).join(', ')})` : ''}
          </ThemedText>
        </View>
        {canRemove ? (
          <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel={`${option.name} törlése`}>
            <ThemedText themeColor="textSecondary" style={styles.remove}>
              ✕
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {active ? (
        <View style={styles.row}>
          <Chip
            label={option.my_vote ? '✓ Szavaztam' : 'Szavazok'}
            selected={option.my_vote}
            onPress={onVote}
            onCard
          />
          {organizer && (chosen || !hasChosen) ? (
            <Chip
              label={chosen ? 'Kiválasztás visszavonása' : 'Ezt választom'}
              onPress={onChoose}
              onCard
            />
          ) : null}
          {busy === `vote-${option.id}` || busy === `choose-${option.id}` ? (
            <ActivityIndicator />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  cancelled: {
    backgroundColor: 'rgba(217, 48, 37, 0.12)',
    padding: Spacing.two,
    borderRadius: 10,
    marginBottom: Spacing.two,
  },
  cancelledText: {
    color: '#D93025',
  },
  note: {
    alignSelf: 'stretch',
    padding: Spacing.three,
    borderRadius: 12,
    marginTop: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
  responses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  panel: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
  },
  person: {
    gap: Spacing.one,
    padding: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  personMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  suggestion: {
    gap: 2,
    paddingLeft: 32 + Spacing.three,
  },
  link: {
    color: Accent,
    fontWeight: 600,
  },
  option: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionChosen: {
    borderColor: Accent,
  },
  optionTop: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  remove: {
    fontSize: 18,
  },
  error: {
    color: '#D93025',
  },
});
