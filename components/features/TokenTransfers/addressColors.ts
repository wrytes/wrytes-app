export const ADDRESS_COLOR_KEYS = [
  'blue',
  'purple',
  'pink',
  'teal',
  'amber',
  'green',
  'red',
  'indigo',
] as const;

export type AddressColorKey = (typeof ADDRESS_COLOR_KEYS)[number];

export const ADDRESS_COLOR_CLASSES: Record<AddressColorKey, { bg: string; text: string; border: string; dot: string }> = {
  blue:   { bg: 'bg-tag-blue/10',   text: 'text-tag-blue',   border: 'border-tag-blue/30',   dot: 'bg-tag-blue' },
  purple: { bg: 'bg-tag-purple/10', text: 'text-tag-purple', border: 'border-tag-purple/30', dot: 'bg-tag-purple' },
  pink:   { bg: 'bg-tag-pink/10',   text: 'text-tag-pink',   border: 'border-tag-pink/30',   dot: 'bg-tag-pink' },
  teal:   { bg: 'bg-tag-teal/10',   text: 'text-tag-teal',   border: 'border-tag-teal/30',   dot: 'bg-tag-teal' },
  amber:  { bg: 'bg-tag-amber/10',  text: 'text-tag-amber',  border: 'border-tag-amber/30',  dot: 'bg-tag-amber' },
  green:  { bg: 'bg-tag-green/10',  text: 'text-tag-green',  border: 'border-tag-green/30',  dot: 'bg-tag-green' },
  red:    { bg: 'bg-tag-red/10',    text: 'text-tag-red',    border: 'border-tag-red/30',    dot: 'bg-tag-red' },
  indigo: { bg: 'bg-tag-indigo/10', text: 'text-tag-indigo', border: 'border-tag-indigo/30', dot: 'bg-tag-indigo' },
};

// Deterministic fallback so distinct addresses get distinct colors before the user picks one.
function hashToIndex(id: string, len: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % len;
}

export function defaultAddressColor(id: string): AddressColorKey {
  return ADDRESS_COLOR_KEYS[hashToIndex(id, ADDRESS_COLOR_KEYS.length)];
}
