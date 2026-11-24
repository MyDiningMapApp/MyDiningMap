import { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/form';
import { PickerMap } from '@/components/place-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { reverseGeocode, type GeocodeResult } from '@/lib/geocode';

type Props = {
  visible: boolean;
  initial: { lat: number; lng: number } | null;
  onCancel: () => void;
  onConfirm: (result: GeocodeResult) => void;
};

/** Teljes képernyős térkép, ahol koppintással (vagy a pin húzásával) jelölhető ki a hely. */
export function LocationPicker({ visible, initial, onCancel, onConfirm }: Props) {
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [busy, setBusy] = useState(false);

  const point = result ?? initial;

  async function pick(lat: number, lng: number) {
    setResult({ lat, lng, label: '…', address: null, district: null });
    setBusy(true);
    setResult(await reverseGeocode(lat, lng));
    setBusy(false);
  }

  function close(fn: () => void) {
    setResult(null);
    fn();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <ThemedView style={styles.flex}>
        <View style={styles.flex}>
          <PickerMap point={point} onPick={pick} />
        </View>
        <SafeAreaView edges={['bottom']} style={styles.panel}>
          <View style={styles.info}>
            {busy ? <ActivityIndicator /> : null}
            <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
              {result
                ? result.label
                : 'Koppints a térképen a hely pontjára. A pint húzással is mozgathatod.'}
            </ThemedText>
          </View>
          <View style={styles.buttons}>
            <View style={styles.flex}>
              <Button title="Mégse" variant="secondary" onPress={() => close(onCancel)} />
            </View>
            <View style={styles.flex}>
              <Button
                title="Kész"
                disabled={!result || busy}
                onPress={() => result && close(() => onConfirm(result))}
              />
            </View>
          </View>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  panel: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 40,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
