'use client';

import { useTransition } from 'react';
import { useAccount } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { Send, Plus, History } from 'lucide-react';

import { config } from '@/lib/config';
import {
  useApproveActions,
  useBalanceActions,
  useEventsActions,
  useIsDaiPending,
  useIsUsdcPending,
  useIsWrongNetwork,
  useMintActions,
  useSelectedToken,
  useTransferActions,
} from '@/providers/stores/storeProvider';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  ActionButton,
  ActionFormData,
  ApproveFormData,
  MintFormData,
  TransferFormData,
} from '@/components/shared/ActionButton';

type TokenType = 'DAI' | 'USDC';

export default function ActionButtonsCard() {
  const { address: walletAddress } = useAccount();
  const [isPending, startTransition] = useTransition();

  const isDaiPending = useIsDaiPending();
  const isUsdcPending = useIsUsdcPending();
  const isWrongNetwork = useIsWrongNetwork();
  const selectedToken = useSelectedToken();

  const { approveToken } = useApproveActions();
  const { fetchEvents, resetOptimisticEvents, setOptimisticEvents } = useEventsActions();
  const { fetchTokenBalances, setIsDaiPending, setIsUsdcPending, setOptimisticBalance, resetOptimisticBalance } =
    useBalanceActions();
  const { mintToken } = useMintActions();
  const { transferToken } = useTransferActions();

  async function handleMint(data: MintFormData & { tokenType: TokenType }) {
    const { amount, tokenType } = data;
    const tempId = `optimistic-mint-${tokenType}-${Date.now()}`;
    let txHash: `0x${string}` | undefined = undefined;

    const setPending = tokenType === 'DAI' ? setIsDaiPending : setIsUsdcPending;

    setPending(true);

    try {
      txHash = await mintToken(tokenType, amount);
      if (!txHash) throw new Error('Transaction submission failed or rejected by user.');

      setOptimisticBalance(amount, 'mint');
      setOptimisticEvents({
        amount: amount,
        from: walletAddress as string,
        id: txHash ?? tempId,
        to: walletAddress as string,
        status: 'Pending',
        token: tokenType,
        transactionHash: txHash,
        type: 'Mint',
      });

      await waitForTransactionReceipt(config, { hash: txHash });

      if (walletAddress) {
        await fetchTokenBalances(walletAddress);
        await fetchEvents(walletAddress, false);
      }
    } catch (error) {
      console.error(`[handleMint ${tokenType}] Error caught:`, error);
      resetOptimisticBalance();
      resetOptimisticEvents();
    } finally {
      startTransition(() => {
        setPending(false);
      });
    }
  }

  async function handleTransfer(data: TransferFormData & { tokenType: TokenType }) {
    const { address, amount, tokenType } = data;
    const tempId = `optimistic-transfer-${tokenType}-${Date.now()}`;
    let txHash: `0x${string}` | undefined = undefined;

    const setPending = tokenType === 'DAI' ? setIsDaiPending : setIsUsdcPending;

    setPending(true);

    try {
      txHash = await transferToken(tokenType, address, amount);
      if (!txHash) throw new Error('Transaction submission failed or rejected by user.');

      setOptimisticBalance(amount, 'transfer');
      setOptimisticEvents({
        amount: amount,
        from: walletAddress as string,
        id: txHash ?? tempId,
        to: address,
        status: 'Pending',
        token: tokenType,
        transactionHash: txHash,
        type: 'Transfer',
      });

      await waitForTransactionReceipt(config, { hash: txHash });

      if (walletAddress) {
        await fetchTokenBalances(walletAddress);
        await fetchEvents(walletAddress, false);
      }
    } catch (error) {
      console.error(`[handleTransfer ${tokenType}] Error caught:`, error);
      resetOptimisticBalance();
      resetOptimisticEvents();
    } finally {
      startTransition(() => {
        setPending(false);
      });
    }
  }

  async function handleApprove(data: ApproveFormData & { tokenType: TokenType }) {
    const { address, allowance, tokenType } = data;
    const tempId = `optimistic-approve-${tokenType}-${Date.now()}`;
    let txHash: `0x${string}` | undefined = undefined;

    const setPending = tokenType === 'DAI' ? setIsDaiPending : setIsUsdcPending;

    try {
      txHash = await approveToken(tokenType, address, allowance);
      if (!txHash) throw new Error('Transaction submission failed or rejected by user.');

      setOptimisticEvents({
        amount: allowance,
        from: walletAddress as string,
        id: txHash ?? tempId,
        to: address,
        status: 'Pending',
        token: tokenType,
        transactionHash: txHash,
        type: 'Approve',
      });

      await waitForTransactionReceipt(config, { hash: txHash });

      if (walletAddress) {
        await fetchEvents(walletAddress, false);
      }
    } catch (error) {
      console.error(`[handleApprove ${tokenType}] Error caught:`, error);
      resetOptimisticBalance();
      resetOptimisticEvents();
    } finally {
      startTransition(() => {
        setPending(false);
      });
    }
  }

  // --- Wrapper functions for ActionButton ---
  const handleMintAction = (formData: ActionFormData) => {
    if ('amount' in formData && !('address' in formData)) {
      handleMint({ ...formData, tokenType: selectedToken });
    }
  };

  const handleTransferAction = (formData: ActionFormData) => {
    if ('amount' in formData && 'address' in formData && !('allowance' in formData)) {
      handleTransfer({ ...formData, tokenType: selectedToken });
    }
  };

  const handleApproveAction = (formData: ActionFormData) => {
    if ('allowance' in formData && 'address' in formData) {
      handleApprove({ ...formData, tokenType: selectedToken });
    }
  };

  return (
    <Card className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800/30 w-full gap-4">
      <CardHeader className="flex items-center">
        <CardTitle className="text-base h-full font-semibold text-gray-700 dark:text-gray-300">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-x-2 w-full justify-between">
        {/* Changed to always be 1 column */}
        <ActionButton
          onFormSubmit={handleMintAction}
          icon={<Plus className="w-5 h-5" />}
          label="Mint"
          disabled={isWrongNetwork || isPending || (selectedToken === 'DAI' ? isDaiPending : isUsdcPending)}
          tokenDecimals={selectedToken === 'DAI' ? 18 : 6}
          className="rounded-md w-1/3"
        />
        <ActionButton
          onFormSubmit={handleTransferAction}
          icon={<Send className="w-5 h-5" />}
          label="Transfer"
          disabled={isWrongNetwork || isPending || (selectedToken === 'DAI' ? isDaiPending : isUsdcPending)}
          tokenDecimals={selectedToken === 'DAI' ? 18 : 6}
          className="rounded-md w-1/3"
        />
        <ActionButton
          onFormSubmit={handleApproveAction}
          icon={<History className="w-5 h-5" />}
          label="Approve"
          disabled={isWrongNetwork || isPending || (selectedToken === 'DAI' ? isDaiPending : isUsdcPending)}
          tokenDecimals={selectedToken === 'DAI' ? 18 : 6}
          className="rounded-md w-1/3"
        />
      </CardContent>
    </Card>
  );
}
