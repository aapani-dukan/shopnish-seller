import { create } from 'zustand';

interface LocationStore {
  selectedLocation: any;
  setSelectedLocation: (loc: any) => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
  selectedLocation: null,
  setSelectedLocation: (loc) => set({ selectedLocation: loc }),
}));