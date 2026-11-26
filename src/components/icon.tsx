import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * Az app ikonjai: iOS-en az Apple SF Symbols, weben/Androidon a Material Symbols megfelelője.
 * Új ikonnál mindkét nevet itt kell felvenni.
 */
const ICONS = {
  add: { ios: 'plus', web: 'add' },
  search: { ios: 'magnifyingglass', web: 'search' },
  map: { ios: 'map', web: 'map' },
  pin: { ios: 'mappin.and.ellipse', web: 'location_on' },
  heart: { ios: 'heart.fill', web: 'favorite' },
  star: { ios: 'star.fill', web: 'star' },
  again: { ios: 'arrow.counterclockwise', web: 'replay' },
  check: { ios: 'checkmark', web: 'check' },
  close: { ios: 'xmark', web: 'close' },
  clock: { ios: 'clock', web: 'schedule' },
  calendar: { ios: 'calendar', web: 'calendar_month' },
  vote: { ios: 'hand.thumbsup', web: 'thumb_up' },
  lock: { ios: 'lock.fill', web: 'lock' },
  globe: { ios: 'globe', web: 'public' },
  pencil: { ios: 'pencil', web: 'edit' },
  people: { ios: 'person.2', web: 'group' },
  photo: { ios: 'photo.on.rectangle', web: 'photo_library' },
  cancel: { ios: 'nosign', web: 'block' },
  chevron: { ios: 'chevron.right', web: 'chevron_right' },
  etterem: { ios: 'fork.knife', web: 'restaurant' },
  bar: { ios: 'wineglass', web: 'local_bar' },
  kocsma: { ios: 'mug', web: 'sports_bar' },
  kavezo: { ios: 'cup.and.saucer', web: 'coffee' },
  pekseg: { ios: 'basket', web: 'bakery_dining' },
  cukraszda: { ios: 'birthday.cake', web: 'cake' },
} as const satisfies Record<string, { ios: SFName; web: WebName }>;

type SymbolName = SymbolViewProps['name'];
type SFName = Extract<SymbolName, string>;
type WebName = NonNullable<Exclude<SymbolName, string>['web']>;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  /** Ha meg van adva, a képernyőolvasó ezt mondja; különben az ikon díszítés. */
  label?: string;
};

export function Icon({ name, size = 20, color, label }: Props) {
  const theme = useTheme();
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={color ?? theme.text}
      accessibilityLabel={label}
      accessible={!!label}
      style={{ width: size, height: size }}
    />
  );
}
