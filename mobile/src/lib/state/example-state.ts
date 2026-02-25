import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface RootStore {
  someData: number;
  addSomeData: () => void;
}

const useRootStore = create<RootStore>()(
  persist(
    (set, get) => ({
      someData: 0,
      addSomeData: () => set({ someData: get().someData + 1 }),
    }),
    {
      name: "root-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useRootStore;
