'use client';
import { ReactNode, createContext, useRef, useContext } from 'react';
import { useStore as useZustandStore } from 'zustand';

import { createStore } from '@/stores/store';

import type { AppState } from '@/types/global';

type StoreType = ReturnType<typeof createStore>;

const StoreContext = createContext<StoreType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StoreType>(null);

  if (!storeRef.current) {
    storeRef.current = createStore();
  }

  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
}

export function useStore<T>(selector: (state: AppState) => T): T {
  const store = useContext(StoreContext);
  if (!store) throw new Error('Missing StoreProvider');

  return useZustandStore(store, selector);
}

/*//////////////////////////////////////////////////////////////
                      PROFILE DETAILS STORE SLICE
//////////////////////////////////////////////////////////////*/
export const useDetails = () => useStore((state) => state.details);
export const useDetailsLoading = () => useStore((state) => state.detailsIsLoading);
export const useDetailsError = () => useStore((state) => state.detailsHasError);
export const useDetailsActions = () => useStore((state) => state.detailsActions);

/*//////////////////////////////////////////////////////////////
                   TOKEN ACTIONS & STATE STORE SLICE
//////////////////////////////////////////////////////////////*/
export const useSelectedToken = () => useStore((state) => state.selectedToken);
export const useSelectedTokenInfo = () =>
  useStore((state) => (state.selectedToken === 'DAI' ? state.daiBalance : state.usdcBalance));
export const useBalanceActions = () => useStore((state) => state.balanceActions);
export const useTransactionState = () => useStore((state) => state.transactionState);
export const useProfileActions = () => useStore((state) => state.detailsActions);

export const useDaiBalances = () => useStore((state) => state.daiBalance);
export const useUsdcBalances = () => useStore((state) => state.usdcBalance);

/*//////////////////////////////////////////////////////////////
                      MINT ACTIONS & STATE
//////////////////////////////////////////////////////////////*/
export const useMintFormValues = () => useStore((state) => state.mint.form);
export const useMintFormValidationErrors = () => useStore((state) => state.mint.form.validationErrors);
export const useMintTransactionState = () => useStore((state) => state.mint.transactionState);
export const useMintActions = () => useStore((state) => state.mintActions);

/*//////////////////////////////////////////////////////////////
                    TRANSFER ACTIONS & STATE
//////////////////////////////////////////////////////////////*/
export const useTransferFormValues = () => useStore((state) => state.transfer.form);
export const useTransferFormValidationErrors = () => useStore((state) => state.transfer.form.validationErrors);
export const useTransferTransactionState = () => useStore((state) => state.transfer.transactionState);

export const useApproveFormValues = () => useStore((state) => state.approve.form);
export const useApproveFormValidationErrors = () => useStore((state) => state.approve.form.validationErrors);
export const useApproveTransactionState = () => useStore((state) => state.approve.transactionState);

/*//////////////////////////////////////////////////////////////
                        TXS HISTORY STORE SLICE
//////////////////////////////////////////////////////////////*/
export const useEvents = () => useStore((state) => state.events);
export const useEventsLoading = () => useStore((state) => state.eventsIsLoading);
export const useEventsError = () => useStore((state) => state.eventsErrorMessage);
export const useEventsActions = () => useStore((state) => state.eventsActions);

/*//////////////////////////////////////////////////////////////
                        NETWORK STORE SLICE
//////////////////////////////////////////////////////////////*/
export const useNetwork = () => useStore((state) => state.network);
export const useIsWrongNetwork = () => useStore((state) => state.isWrongNetwork);
export const useNetworkActions = () => useStore((state) => state.networkActions);

/*//////////////////////////////////////////////////////////////
                          ERROR STORE SLICE
//////////////////////////////////////////////////////////////*/
export const useIsErrorModalOpen = () => useStore((state) => state.isErrorModalOpen);
export const useErrorMessage = () => useStore((state) => state.error);
export const useErrorActions = () => useStore((state) => state.errorActions);
