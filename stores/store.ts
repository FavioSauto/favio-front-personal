import { create } from 'zustand';

// import { createHistorySlice, HistorySlice } from './slices/historySlice';
import { createProfileSlice, ProfileSlice } from './slices/profileSlice';
// import { createTokenActionsSlice, TokenActionsSlice } from './slices/tokenActionsSlice';

// const useStore = create<ProfileSlice & TokenActionsSlice & HistorySlice>()((...a) => ({
const useStore = create<ProfileSlice>()((...a) => ({
  ...createProfileSlice(...a),
  //   ...createTokenActionsSlice(...a),
  //   ...createHistorySlice(...a),
}));

// /*//////////////////////////////////////////////////////////////
//                       PROFILE DETAILS STORE SLICE
// //////////////////////////////////////////////////////////////*/
export const useDetails = () => useStore((state) => state.details);
export const useDetailsLoading = () => useStore((state) => state.detailsIsLoading);
export const useDetailsError = () => useStore((state) => state.detailsHasError);
export const useDetailsActions = () => useStore((state) => state.detailsActions);

// /*//////////////////////////////////////////////////////////////
//                    TOKEN ACTIONS & STATE STORE SLICE
// //////////////////////////////////////////////////////////////*/
// export const useSelectedTokenInfo = () =>
//   useStore((state) => (state.selectedToken === 'DAI' ? state.daiBalance : state.usdcBalance));
// export const useBalanceActions = () => useStore((state) => state.balanceActions);
// export const useTransactionState = () => useStore((state) => state.transactionState);

// export const useDaiBalances = () => useStore((state) => state.daiBalance);
// export const useUsdcBalances = () => useStore((state) => state.usdcBalance);

// export const useMintFormValues = () => useStore((state) => state.mint.form);
// export const useMintFormValidationErrors = () => useStore((state) => state.mint.form.validationErrors);
// export const useMintTransactionState = () => useStore((state) => state.mint.transactionState);

// export const useTransferFormValues = () => useStore((state) => state.transfer.form);
// export const useTransferFormValidationErrors = () => useStore((state) => state.transfer.form.validationErrors);
// export const useTransferTransactionState = () => useStore((state) => state.transfer.transactionState);

// export const useApproveFormValues = () => useStore((state) => state.approve.form);
// export const useApproveFormValidationErrors = () => useStore((state) => state.approve.form.validationErrors);
// export const useApproveTransactionState = () => useStore((state) => state.approve.transactionState);

// /*//////////////////////////////////////////////////////////////
//                         TXS HISTORY STORE SLICE
// //////////////////////////////////////////////////////////////*/
// export const useEvents = () => useStore((state) => state.events);
// export const useEventsLoading = () => useStore((state) => state.eventsIsLoading);
// export const useEventsError = () => useStore((state) => state.eventsErrorMessage);
// export const useEventsActions = () => useStore((state) => state.eventsActions);
