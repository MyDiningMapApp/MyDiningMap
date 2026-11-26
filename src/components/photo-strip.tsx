import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StripItem = {
  key: string;
  /** A megjelenítendő kép (helyi fájl vagy aláírt link); amíg nincs meg, töltésjelző látszik. */
  uri?: string;
};

type Props = {
  items: StripItem[];
  size?: number;
  onPressItem?: (index: number) => void;
  /** Ha meg van adva, minden kép sarkában × gomb jelenik meg. */
  onRemove?: (key: string) => void;
  /** Ha meg van adva, a sor végén „+” csempe jelenik meg. */
  onAdd?: () => void;
  addLabel?: string;
};

/** Vízszintesen görgethető bélyegkép-sor. */
export function PhotoStrip({ items, size = 96, onPressItem, onRemove, onAdd, addLabel }: Props) {
  const theme = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item, i) => (
        <View key={item.key}>
          <Pressable
            onPress={() => onPressItem?.(i)}
            disabled={!onPressItem}
            accessibilityRole="imagebutton"
            accessibilityLabel={`${i + 1}. fotó`}
            style={[
              styles.tile,
              { width: size, height: size, backgroundColor: theme.backgroundElement },
            ]}>
            {item.uri ? (
              <Image source={{ uri: item.uri }} style={styles.image} contentFit="cover" transition={150} />
            ) : (
              <ActivityIndicator />
            )}
          </Pressable>
          {onRemove ? (
            <Pressable
              onPress={() => onRemove(item.key)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`${i + 1}. fotó eltávolítása`}
              style={styles.remove}>
              <ThemedText style={styles.removeText}>×</ThemedText>
            </Pressable>
          ) : null}
        </View>
      ))}
      {onAdd ? (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={addLabel ?? 'Fotó hozzáadása'}
          style={({ pressed }) => [
            styles.tile,
            styles.add,
            { width: size, height: size, borderColor: theme.accent },
            pressed && styles.pressed,
          ]}>
          <Icon name="add" size={24} color={theme.accent} />
          <ThemedText type="small" themeColor="textSecondary">
            {addLabel ?? 'Fotó'}
          </ThemedText>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
    paddingTop: 6,
    paddingRight: 6,
  },
  tile: {
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: 700,
  },
  add: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  pressed: {
    opacity: 0.6,
  },
});
