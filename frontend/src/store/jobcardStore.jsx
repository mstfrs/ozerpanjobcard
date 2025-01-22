
import { create } from 'zustand'
const useJobcardsStore = create((set) => ({
  currentUser: null,
  currentWorkstation: null,
  currentOperation: null,
  currentJobcard: null,
  currentOpt: null,
  currentBarkod: null,
  jobCardList: [],
  tesDetayList: [],
  employee: null,
  isLoading: false,
  isAllProfileTransferred: false,
  isAccessoryLoading:false,
  filters: [],
  maxSanalAdet:0,
  setMaxSanalAdet: (maxSanalAdet) => set({ maxSanalAdet: maxSanalAdet }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentWorkstation: (workstation) => set({ currentWorkstation: workstation }),
  setCurrentOperation: (operation) => set({ currentOperation: operation }),
  setCurrentJobcard: (jobcard) => set({ currentJobcard: jobcard }),
  setCurrentOpt: (opt) => set({ currentOpt: opt }),
  setCurrentBarkod: (barkod) => set({ currentBarkod: barkod }),
  setJobCardList: (list) => set({ jobCardList: list }),
  setTesDetayList: (list) => set({ tesDetayList: list }),
  setEmployee: (employee) => set({ employee: employee }),
  setIsLoading: (isLoading) => set({ isLoading: isLoading }),
  setIsAllProfileTransferred: (isAllProfileTransferred) => set({ isAllProfileTransferred: isAllProfileTransferred }),
  setFilters: (filters) => set({ filters: filters }),
  setIsAccessoryLoading: (isAccessoryLoading) => set({ isAccessoryLoading: isAccessoryLoading }),
}));

export default useJobcardsStore;