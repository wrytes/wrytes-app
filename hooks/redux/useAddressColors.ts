import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/redux/redux.store';
import { setAddressColor, type AddressColorsState } from '@/redux/slices/addressColors.slice';
import { ADDRESS_COLOR_KEYS, type AddressColorKey, defaultAddressColor } from '@/components/features/tokenTransfers/addressColors';

export function useAddressColors() {
  const dispatch = useDispatch<AppDispatch>();
  const colors = useSelector((state: { addressColors: AddressColorsState }) => state.addressColors.colors);

  const colorFor = (id: string): AddressColorKey => {
    const stored = colors[id];
    return (ADDRESS_COLOR_KEYS as readonly string[]).includes(stored)
      ? (stored as AddressColorKey)
      : defaultAddressColor(id);
  };

  const setColor = (id: string, color: AddressColorKey) => dispatch(setAddressColor({ id, color }));

  return { colorFor, setColor };
}
