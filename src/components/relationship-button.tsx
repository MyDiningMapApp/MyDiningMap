import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/form';
import { Spacing } from '@/constants/theme';
import { confirm, showError } from '@/lib/confirm';
import { displayName, type ProfileSummary, type Relationship } from '@/lib/social';
import { useFriends } from '@/providers/friends-provider';

type Props = {
  profile: Pick<ProfileSummary, 'id' | 'username' | 'display_name'>;
  relationship: Relationship;
  onChange?: (relationship: Relationship) => void;
};

/** A kapcsolat állapotától függő gomb(ok): bejelölés, visszavonás, elfogadás, megszüntetés. */
export function RelationshipButton({ profile, relationship, onChange }: Props) {
  const { send, respond, remove } = useFriends();
  const [busy, setBusy] = useState<string | null>(null);
  const name = displayName(profile);

  async function run(key: string, fn: () => Promise<Relationship>) {
    setBusy(key);
    try {
      // Fontos: előbb lefuttatjuk a műveletet, és csak utána hívjuk az (opcionális) onChange-et.
      // Az `onChange?.(await fn())` forma onChange nélkül a műveletet sem futtatná le.
      const relationship = await fn();
      onChange?.(relationship);
    } catch (e) {
      showError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  switch (relationship) {
    case 'self':
      return null;
    case 'none':
      return (
        <Button
          title="Bejelölés"
          icon="add"
          loading={busy === 'send'}
          onPress={() => run('send', () => send(profile.id))}
        />
      );
    case 'outgoing':
      return (
        <Button
          title="Jelölés elküldve · Visszavonás"
          variant="secondary"
          loading={busy === 'remove'}
          onPress={() =>
            confirm('Jelölés visszavonása', `Visszavonod a jelölést (${name})?`, 'Visszavonás', () =>
              run('remove', () => remove(profile.id)),
            )
          }
        />
      );
    case 'incoming':
      return (
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button
              title="Elfogadás"
              loading={busy === 'accept'}
              disabled={!!busy}
              onPress={() => run('accept', () => respond(profile.id, true))}
            />
          </View>
          <View style={styles.flex}>
            <Button
              title="Elutasítás"
              variant="secondary"
              loading={busy === 'reject'}
              disabled={!!busy}
              onPress={() => run('reject', () => respond(profile.id, false))}
            />
          </View>
        </View>
      );
    case 'friends':
      return (
        <Button
          title="Barátok"
          icon="check"
          variant="secondary"
          loading={busy === 'remove'}
          onPress={() =>
            confirm(
              'Barátság megszüntetése',
              `Megszünteted a barátságot vele: ${name}? Ezután nem látjátok egymás helyeit (kivéve, ha a profil publikus).`,
              'Megszüntetés',
              () => run('remove', () => remove(profile.id)),
            )
          }
        />
      );
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
