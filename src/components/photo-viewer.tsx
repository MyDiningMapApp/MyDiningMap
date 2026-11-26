import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type Props = {
  /** A teljes méretű képek linkjei (vagy undefined, amíg töltődnek). */
  uris: (string | undefined)[];
  /** A megnyitott kép sorszáma; null = zárva. */
  index: number | null;
  onClose: () => void;
};

/** Teljes képernyős képnézegető, lapozással. */
export function PhotoViewer({ uris, index, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const [current, setCurrent] = useState(0);
  const open = index !== null;

  return (
    <Modal
      visible={open}
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => setCurrent(index ?? 0)}
      supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.backdrop}>
        <FlatList
          data={uris}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={index ?? 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) =>
            setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            <View style={[styles.page, { width, height }]}>
              {item ? (
                <Image source={{ uri: item }} style={styles.image} contentFit="contain" />
              ) : (
                <ActivityIndicator color="#ffffff" />
              )}
            </View>
          )}
        />
        <SafeAreaView style={styles.top} edges={['top']}>
          <ThemedText style={styles.counter}>
            {Math.min(current, uris.length - 1) + 1} / {uris.length}
          </ThemedText>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Bezárás"
            style={styles.close}>
            <Icon name="close" size={18} color="#ffffff" />
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  counter: {
    color: '#ffffff',
    paddingVertical: Spacing.two,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
