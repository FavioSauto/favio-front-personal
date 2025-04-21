'use client';
import { useEffect, useState, useOptimistic, useTransition } from 'react';
import { Wallet, Send, Plus, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  ActionButton,
  MintFormData,
  TransferFormData,
  ApproveFormData,
  ActionFormData,
} from '@/components/shared/ActionButton';
import {
  useDaiBalances,
  useUsdcBalances,
  useBalanceActions,
  useEventsActions,
  useEvents,
  TokenEvent,
} from '@/providers/stores/storeProvider';
import { useAccount } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/lib/config';

// Define types for optimistic update actions
type OptimisticBalanceAction = { type: 'mint'; amount: string } | { type: 'transfer'; amount: string };

// Define a more detailed type for optimistic events shown in the UI
interface OptimisticEvent {
  id: string; // Unique ID for mapping and updates (can be txHash or temporary)
  type: 'Mint' | 'Transfer' | 'Approve';
  amount: string;
  status: 'Pending' | 'Success' | 'Failed'; // Include status
  tokenType: 'USDC' | 'DAI';
  recipient?: string; // For Transfer
  spender?: string; // For Approve
  transactionHash?: string; // Optional tx hash
}

const TokenDashboard = () => {
  const { address: walletAddress } = useAccount();
  const daiBalance = useDaiBalances();
  const usdcBalance = useUsdcBalances();
  const events = useEvents();
  const { fetchEvents } = useEventsActions();
  const { mintToken, transferToken, approveToken } = useBalanceActions();
  const { fetchTokenBalances } = useBalanceActions();
  const [isPending, startTransition] = useTransition();

  const [isDaiPending, setIsDaiPending] = useState(false);
  const [isUsdcPending, setIsUsdcPending] = useState(false);

  // Optimistic updates for USDC balance
  const [optimisticUsdcBalance, addOptimisticUsdcUpdate] = useOptimistic(
    { balance: Number(usdcBalance.balance) || 0.0 },
    (state: { balance: number }, action: OptimisticBalanceAction) => {
      switch (action.type) {
        case 'mint':
          return { balance: state.balance + Number(action.amount) };
        case 'transfer':
          return { balance: state.balance - Number(action.amount) };
        default:
          return state;
      }
    }
  );

  // Optimistic updates for DAI balance
  const [optimisticDaiBalance, addOptimisticDaiUpdate] = useOptimistic(
    { balance: Number(daiBalance.balance) || 0 },
    (state: { balance: number }, action: OptimisticBalanceAction) => {
      switch (action.type) {
        case 'mint':
          return { balance: state.balance + Number(action.amount) };
        case 'transfer':
          return { balance: state.balance - Number(action.amount) };
        default:
          return state;
      }
    }
  );

  // Helper to map store events (TokenEvent) to OptimisticEvent for consistent display
  // Adjust properties based on actual TokenEvent structure
  const mapTokenEventToOptimistic = (event: TokenEvent): OptimisticEvent => ({
    id: event.transactionHash, // Assuming transactionHash is unique and present
    transactionHash: event.transactionHash,
    type: event.type, // Assuming type exists
    amount: event.amount, // Assuming amount exists
    status: 'Success', // Events from store are successful
    tokenType: event.token === 'DAI' ? 'DAI' : 'USDC', // Assuming token symbol exists
    recipient: event.to, // Assuming 'to' exists for transfers
    spender: undefined, // Add spender if available for Approvals in TokenEvent
    // Add other relevant fields from TokenEvent
  });

  // Optimistic updates for events
  // Base state is now the mapped array of OptimisticEvent
  // The reducer action type is OptimisticEvent
  const [optimisticEvents, addOptimisticEvent] = useOptimistic<OptimisticEvent[], OptimisticEvent>(
    events.map(mapTokenEventToOptimistic), // Initial state mapped from store events
    (currentOptimisticEvents, newOrUpdatedEvent: OptimisticEvent) => {
      // Check if this is an update to an existing optimistic event (based on ID)
      const existingIndex = currentOptimisticEvents.findIndex(
        (event) => event.id === newOrUpdatedEvent.id && event.status === 'Pending'
      );

      if (existingIndex !== -1) {
        // Update existing pending event (e.g., adding txHash)
        const updatedEvents = [...currentOptimisticEvents];
        updatedEvents[existingIndex] = {
          ...updatedEvents[existingIndex], // Keep existing pending data
          ...newOrUpdatedEvent, // Overwrite with new data (like txHash)
          status: 'Pending', // Ensure status remains pending during update
        };
        return updatedEvents;
      } else {
        // Add new optimistic event
        // Prevent adding duplicates if the base 'events' load quickly
        if (currentOptimisticEvents.some((event) => event.id === newOrUpdatedEvent.id)) {
          return currentOptimisticEvents;
        }
        return [
          { ...newOrUpdatedEvent, status: 'Pending' }, // Ensure status is Pending
          ...currentOptimisticEvents,
        ];
      }
    }
  );

  useEffect(() => {
    if (walletAddress) {
      startTransition(() => {
        fetchTokenBalances(walletAddress);
        fetchEvents(walletAddress);
      });
    }
  }, [walletAddress, fetchTokenBalances, fetchEvents]);

  async function handleMint(data: MintFormData & { tokenType: 'DAI' | 'USDC' }) {
    const { amount, tokenType } = data;
    const setPending = tokenType === 'DAI' ? setIsDaiPending : setIsUsdcPending;
    const addOptimisticUpdate = tokenType === 'DAI' ? addOptimisticDaiUpdate : addOptimisticUsdcUpdate;
    const tempId = `optimistic-mint-${Date.now()}`; // Used if tx fails before hash generation
    let txHash: `0x${string}` | undefined = undefined;
    let optimisticEventAdded = false;

    setPending(true); // Indicate loading immediately

    try {
      txHash = await mintToken(tokenType, amount);
      if (!txHash) throw new Error('Transaction submission failed or rejected by user.');

      // ---> Optimistic Update AFTER signing <---
      startTransition(() => {
        addOptimisticUpdate({ type: 'mint', amount: amount });
        addOptimisticEvent({
          id: txHash as string, // Use txHash which is guaranteed to exist here
          type: 'Mint',
          amount: amount,
          status: 'Pending',
          tokenType: tokenType,
          transactionHash: txHash, // Include txHash immediately
        });
        optimisticEventAdded = true; // Mark that optimistic update was applied
      });
      // -----------------------------------------

      await waitForTransactionReceipt(config, { hash: txHash });

      // ---> Refetch AFTER confirmation (High Priority) <---
      if (walletAddress) {
        await fetchTokenBalances(walletAddress);
        await fetchEvents(walletAddress);
      }
      // ------------------------------------
    } catch (error) {
      console.error('[handleMint] Error caught:', error);
      startTransition(() => {
        if (optimisticEventAdded && txHash) {
          // Update the existing pending event to Failed status
          addOptimisticEvent({
            id: txHash as string, // txHash is confirmed non-null here
            type: 'Mint',
            amount: amount,
            tokenType: tokenType,
            status: 'Failed',
            transactionHash: txHash!, // Assert non-null
          });
        } else {
          // Transaction failed before hash was received or user rejected
          // Add a temporary failed event
          addOptimisticEvent({
            id: tempId,
            type: 'Mint',
            amount: amount,
            tokenType: tokenType,
            status: 'Failed',
            transactionHash: 'failed/rejected',
          });
        }
        // Optimistic balance update will be automatically reverted by React
        // or corrected by the final fetchTokenBalances.
      });
    } finally {
      // Only reset pending state here
      startTransition(() => {
        setPending(false); // Stop loading indicator
      });
    }
  }

  async function handleTransfer(data: TransferFormData & { tokenType: 'DAI' | 'USDC' }) {
    const { address, amount, tokenType } = data;
    const setPending = tokenType === 'DAI' ? setIsDaiPending : setIsUsdcPending;
    const addOptimisticUpdate = tokenType === 'DAI' ? addOptimisticDaiUpdate : addOptimisticUsdcUpdate;
    const tempId = `optimistic-transfer-${Date.now()}`;
    let txHash: `0x${string}` | undefined = undefined;
    let optimisticEventAdded = false;

    setPending(true);

    try {
      txHash = await transferToken(tokenType, address, amount);
      if (!txHash) throw new Error('Transaction submission failed or rejected by user.');

      // ---> Optimistic Update AFTER signing <---
      startTransition(() => {
        addOptimisticUpdate({ type: 'transfer', amount: amount });
        addOptimisticEvent({
          id: txHash as string, // Use txHash which is guaranteed to exist here
          type: 'Transfer',
          amount: amount,
          recipient: address,
          status: 'Pending',
          tokenType: tokenType,
          transactionHash: txHash,
        });
        optimisticEventAdded = true;
      });
      // -----------------------------------------

      await waitForTransactionReceipt(config, { hash: txHash });

      // ---> Refetch AFTER confirmation (High Priority) <---
      if (walletAddress) {
        await fetchTokenBalances(walletAddress);
        await fetchEvents(walletAddress);
      }
      // ------------------------------------
    } catch (error) {
      console.error('[handleTransfer] Error caught:', error);
      startTransition(() => {
        if (optimisticEventAdded && txHash) {
          addOptimisticEvent({
            id: txHash, // txHash is confirmed non-null here
            type: 'Transfer',
            amount: amount,
            recipient: address,
            tokenType: tokenType,
            status: 'Failed',
            transactionHash: txHash!, // Assert non-null
          });
        } else {
          addOptimisticEvent({
            id: tempId,
            type: 'Transfer',
            amount: amount,
            recipient: address,
            tokenType: tokenType,
            status: 'Failed',
            transactionHash: 'failed/rejected',
          });
        }
      });
    } finally {
      // Only reset pending state here
      startTransition(() => {
        setPending(false);
      });
    }
  }

  async function handleApprove(data: ApproveFormData & { tokenType: 'DAI' | 'USDC' }) {
    const { address, allowance, tokenType } = data;
    const tempId = `optimistic-approve-${Date.now()}`;
    let txHash: `0x${string}` | undefined = undefined;
    let optimisticEventAdded = false;

    // Consider a global pending state or specific pending state for approve if needed
    // setApprovePending(true);

    try {
      txHash = await approveToken(tokenType, address, allowance);
      if (!txHash) throw new Error('Transaction submission failed or rejected by user.');

      // ---> Optimistic Update AFTER signing <---
      startTransition(() => {
        addOptimisticEvent({
          id: txHash as string, // Use txHash which is guaranteed to exist here
          type: 'Approve',
          amount: allowance,
          spender: address,
          status: 'Pending',
          tokenType: tokenType,
          transactionHash: txHash,
        });
        optimisticEventAdded = true;
      });
      // -----------------------------------------

      await waitForTransactionReceipt(config, { hash: txHash });

      // ---> Refetch AFTER confirmation (High Priority) <---
      if (walletAddress) {
        // Approve doesn't change balance, only fetch events
        await fetchEvents(walletAddress);
      }
      // ------------------------------------
    } catch (error) {
      console.error('[handleApprove] Error caught:', error);
      startTransition(() => {
        if (optimisticEventAdded && txHash) {
          addOptimisticEvent({
            id: txHash, // txHash is confirmed non-null here
            type: 'Approve',
            amount: allowance,
            spender: address,
            tokenType: tokenType,
            status: 'Failed',
            transactionHash: txHash!, // Assert non-null
          });
        } else {
          addOptimisticEvent({
            id: tempId,
            type: 'Approve',
            amount: allowance,
            spender: address,
            tokenType: tokenType,
            status: 'Failed',
            transactionHash: 'failed/rejected',
          });
        }
      });
    } finally {
      // Only reset pending state (if you add one for approve)
      startTransition(() => {
        // setApprovePending(false);
      });
    }
  }

  // --- Wrapper functions for ActionButton ---
  // These determine the token type and call the correct handler
  // Modify based on how you want to select the token (e.g., state, props)
  // Assuming a simple toggle or separate buttons per token might be needed eventually.
  // For now, let's default to USDC and add a placeholder for DAI logic.
  const handleMintAction = (formData: ActionFormData) => {
    if ('amount' in formData && !('address' in formData)) {
      // Type guard for MintFormData
      // TODO: Determine tokenType based on UI context (e.g., which card's button was clicked)
      const tokenType: 'DAI' | 'USDC' = 'USDC'; // Defaulting to USDC for now
      handleMint({ ...formData, tokenType });
    }
  };

  const handleTransferAction = (formData: ActionFormData) => {
    if ('amount' in formData && 'address' in formData && !('allowance' in formData)) {
      // Type guard for TransferFormData
      const tokenType: 'DAI' | 'USDC' = 'USDC'; // Defaulting to USDC
      handleTransfer({ ...formData, tokenType });
    }
  };

  const handleApproveAction = (formData: ActionFormData) => {
    if ('allowance' in formData && 'address' in formData) {
      // Type guard for ApproveFormData
      const tokenType: 'DAI' | 'USDC' = 'USDC'; // Defaulting to USDC
      handleApprove({ ...formData, tokenType });
    }
  };

  return (
    <>
      {/* Header */}
      <PageHeader title="Token Dashboard" icon={<Wallet className="w-6 h-6 text-gray-900" />} />

      {/* Token Cards - Display optimistic balances */}
      <div className="flex flex-col md:flex-row md:gap-6 relative pt-4">
        {/* DAI Card */}
        <div className="relative w-full md:w-1/2 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:rotate-1">
          <Card className="py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white transition-shadow duration-300 hover:shadow-xl">
            <CardContent className="px-6 py-2 space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-white/70">DAI</p>
                <h2 className="text-2xl font-semibold">DAI</h2>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold tracking-tight flex items-center">
                  {optimisticDaiBalance.balance.toFixed(2)}
                  {isDaiPending && <span className="ml-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>}
                </p>
                <p className="text-base text-white/70">18 decimals</p>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* USDC Card */}
        <div className="relative w-full md:w-1/2 -mt-36 md:mt-0 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:rotate-1">
          <Card className="py-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white transition-shadow duration-300 hover:shadow-xl">
            <CardContent className="px-6 py-2 space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-white/70">USDC</p>
                <h2 className="text-2xl font-semibold">USDC</h2>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold tracking-tight flex items-center">
                  {optimisticUsdcBalance.balance.toFixed(2)}
                  {isUsdcPending && <span className="ml-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>}
                </p>
                <p className="text-base text-white/70">6 decimals</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions - Pass wrapper functions */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <ActionButton
          onFormSubmit={handleMintAction}
          icon={<Plus className="w-6 h-6" />}
          label="Mint"
          disabled={isPending}
        />
        <ActionButton
          onFormSubmit={handleTransferAction}
          icon={<Send className="w-6 h-6" />}
          label="Transfer"
          disabled={isPending}
        />
        <ActionButton
          onFormSubmit={handleApproveAction}
          icon={<History className="w-6 h-6" />}
          label="Approve"
          disabled={isPending}
        />
      </div>

      {/* Recent Transactions - Use optimisticEvents */}
      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optimisticEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
              {optimisticEvents.map((event) => (
                <TableRow
                  key={event.id}
                  className={`transition-opacity duration-300 ${event.status === 'Pending' ? 'opacity-60' : ''} ${
                    event.status === 'Failed' ? 'bg-red-50 line-through' : 'hover:bg-gray-50'
                  }`}
                >
                  <TableCell>
                    {event.type} ({event.tokenType})
                  </TableCell>
                  <TableCell>{event.amount}</TableCell>
                  <TableCell
                    className={
                      event.status === 'Pending'
                        ? 'text-yellow-600'
                        : event.status === 'Success'
                        ? 'text-green-600'
                        : event.status === 'Failed'
                        ? 'text-red-600'
                        : ''
                    }
                  >
                    {event.status}
                    {event.status === 'Pending' && (
                      <span className="ml-2 w-1.5 h-1.5 bg-yellow-400 rounded-full inline-block animate-pulse"></span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

export default TokenDashboard;
