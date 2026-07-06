import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AddressColorsState {
  colors: Record<string, string>; // accountingAddressId -> AddressColorKey
}

const initialState: AddressColorsState = {
  colors: {},
};

const addressColorsSlice = createSlice({
  name: 'addressColors',
  initialState,
  reducers: {
    setAddressColor(state, action: PayloadAction<{ id: string; color: string }>) {
      state.colors[action.payload.id] = action.payload.color;
    },
  },
});

export const { setAddressColor } = addressColorsSlice.actions;
export const addressColorsReducer = addressColorsSlice.reducer;
