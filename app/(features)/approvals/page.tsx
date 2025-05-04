'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { isAddress } from 'viem';
import { formatUnits } from 'ethers'; // Using ethers v6's formatUnits

import { TOKENS, ERC20_ABI as importedErc20Abi } from '@/lib/contractsAbi';
import { useSelectedToken } from '@/providers/stores/storeProvider';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// Simple component to display allowance details using Card
function AllowanceDisplayCard({
  title,
  tokenAddress,
  otherPartyAddress,
  amount,
  spenderAddress, // Used to determine label ("Spender" or "Owner")
  tokenSymbol,
}: {
  title: string;
  tokenAddress: string;
  otherPartyAddress: string;
  amount: string | null;
  spenderAddress: string;
  tokenSymbol: string;
}) {
  // Show skeleton if amount is null (still loading/not checked) and addresses are present
  const isLoading = amount === null && tokenAddress && otherPartyAddress;
  // Show nothing if addresses are missing (initial state)
  if (!tokenAddress || !otherPartyAddress) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Token:</span>
          {isLoading ? (
            <Skeleton className="h-4 w-[150px]" />
          ) : (
            <span className="font-mono break-all">
              {tokenAddress} ({tokenSymbol})
            </span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{otherPartyAddress === spenderAddress ? 'Spender:' : 'Owner:'}</span>
          {isLoading ? (
            <Skeleton className="h-4 w-[200px]" />
          ) : (
            <span className="font-mono break-all">{otherPartyAddress}</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount:</span>
          {isLoading ? (
            <Skeleton className="h-4 w-[100px]" />
          ) : (
            <span className="font-semibold">{amount ?? 'Not available'}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const { address: userAddress } = useAccount();
  const selectedToken = useSelectedToken();

  // Derive token info from selected symbol
  const selectedTokenInfo = TOKENS[selectedToken];
  const tokenAddress = selectedTokenInfo.address as `0x${string}`;
  const tokenDecimals = selectedTokenInfo.decimals; // Get decimals directly

  // State for inputs
  const [spenderAddress, setSpenderAddress] = useState<`0x${string}` | ''>('');
  const [ownerAddress, setOwnerAddress] = useState<`0x${string}` | ''>('');

  // State for results
  const [approvalResult, setApprovalResult] = useState<string | null>(null);
  const [allowanceResult, setAllowanceResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep track of addresses used for the last successful fetch
  const [lastCheckedSpender, setLastCheckedSpender] = useState<`0x${string}` | ''>('');
  const [lastCheckedOwner, setLastCheckedOwner] = useState<`0x${string}` | ''>('');
  const [lastCheckedTokenAddress, setLastCheckedTokenAddress] = useState<`0x${string}` | ''>(''); // Track address used

  // Derived states for enabling reads
  const isSpenderValid = spenderAddress && isAddress(spenderAddress);
  const isOwnerValid = ownerAddress && isAddress(ownerAddress);

  // --- Read Approval (User -> Spender) ---
  const {
    data: approvalData,
    error: errorApproval,
    refetch: refetchApproval,
    isFetching: isFetchingApproval, // Use isFetching for loading state
  } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: importedErc20Abi,
    functionName: 'allowance',
    args: userAddress && isSpenderValid ? [userAddress, spenderAddress] : undefined,
    query: {
      enabled: !!userAddress && !!isSpenderValid && !!tokenAddress,
    },
  });

  // --- Read Allowance (Owner -> User) ---
  const {
    data: allowanceData,
    error: errorAllowance,
    refetch: refetchAllowance,
    isFetching: isFetchingAllowance, // Use isFetching for loading state
  } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: importedErc20Abi,
    functionName: 'allowance',
    args: userAddress && isOwnerValid ? [ownerAddress, userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!isOwnerValid && !!tokenAddress,
    },
  });

  // Effect to update approval result string when data changes
  useEffect(
    function updateApprovalResult() {
      if (approvalData !== undefined && tokenDecimals !== undefined && lastCheckedSpender && lastCheckedTokenAddress) {
        setApprovalResult(formatUnits(approvalData as bigint, tokenDecimals));
        setErrorMessage(null);
      } else if (!isFetchingApproval) {
        // Prevent resetting result during fetch
        setApprovalResult(null);
      }
      if (errorApproval) {
        setErrorMessage(`Error fetching approval: ${errorApproval.shortMessage || errorApproval.message}`);
        setApprovalResult(null);
        // Don't clear lastCheckedSpender here, keep it for the display card
      }
    },
    [approvalData, tokenDecimals, errorApproval, lastCheckedSpender, lastCheckedTokenAddress, isFetchingApproval]
  );

  // Effect to update allowance result string when data changes
  useEffect(
    function updateAllowanceResult() {
      if (allowanceData !== undefined && tokenDecimals !== undefined && lastCheckedOwner && lastCheckedTokenAddress) {
        setAllowanceResult(formatUnits(allowanceData as bigint, tokenDecimals));
        setErrorMessage(null);
      } else if (!isFetchingAllowance) {
        // Prevent resetting result during fetch
        setAllowanceResult(null);
      }
      if (errorAllowance) {
        setErrorMessage(`Error fetching allowance: ${errorAllowance.shortMessage || errorAllowance.message}`);
        setAllowanceResult(null);
        // Don't clear lastCheckedOwner here, keep it for the display card
      }
    },
    [allowanceData, tokenDecimals, errorAllowance, lastCheckedOwner, lastCheckedTokenAddress, isFetchingAllowance]
  );

  async function handleCheckApproval() {
    setApprovalResult(null); // Clear previous *numeric* result immediately
    setErrorMessage(null);
    // Set the addresses that we INTEND to check
    setLastCheckedTokenAddress(tokenAddress as `0x${string}`);
    setLastCheckedSpender(spenderAddress);

    if (userAddress && tokenAddress && isSpenderValid) {
      await refetchApproval(); // Refetch will update approvalData/errorApproval -> useEffect handles result
    } else {
      setErrorMessage('Please ensure a valid token is selected and provide a valid spender address.');
      // Clear the intended check addresses if the input is invalid
      setLastCheckedTokenAddress('');
      setLastCheckedSpender('');
    }
  }

  async function handleCheckAllowance() {
    setAllowanceResult(null); // Clear previous *numeric* result immediately
    setErrorMessage(null);
    // Set the addresses that we INTEND to check
    setLastCheckedTokenAddress(tokenAddress as `0x${string}`);
    setLastCheckedOwner(ownerAddress);

    if (userAddress && tokenAddress && isOwnerValid) {
      await refetchAllowance(); // Refetch will update allowanceData/errorAllowance -> useEffect handles result
    } else {
      setErrorMessage('Please ensure a valid token is selected and provide a valid owner address.');
      // Clear the intended check addresses if the input is invalid
      setLastCheckedTokenAddress('');
      setLastCheckedOwner('');
    }
  }

  // Clear results and inputs when token changes
  useEffect(
    function clearResultsAndInputs() {
      setApprovalResult(null);
      setAllowanceResult(null);
      setErrorMessage(null);
      setLastCheckedSpender('');
      setLastCheckedOwner('');
      setLastCheckedTokenAddress('');
      setSpenderAddress(''); // Clear spender/owner inputs too
      setOwnerAddress('');
    },
    [selectedToken]
  );

  if (!userAddress) {
    return <div className="p-4 text-center">Please connect your wallet.</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Approvals & Allowances</h1>
        <p className="text-muted-foreground break-all">
          Connected Address: <span className="font-mono text-sm">{userAddress}</span>
        </p>
      </header>

      <Card className="mb-6 gap-y-2">
        <CardHeader>
          <CardTitle className="text-lg">Token Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-[auto_1fr] gap-x-2 md:items-center">
            <Label htmlFor="token-select" className="text-sm font-medium">
              Selected Token Address:
            </Label>
            <div className="text-xs text-muted-foreground break-all">
              <span className="font-mono">{tokenAddress}</span>
              <span className="ml-2">(Decimals: {tokenDecimals})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <Badge
          variant="destructive"
          className="mb-4 block w-full text-center text-sm p-2 whitespace-normal break-words"
        >
          {errorMessage}
        </Badge>
      )}

      {/* Section 1: Approvals Granted By User */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Approvals You Granted</CardTitle>
          <CardDescription>
            Check the spending allowance you granted to a specific address for {selectedTokenInfo.symbol}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Label htmlFor="spender-address" className="sm:w-[120px] flex-shrink-0 mt-2 sm:mt-0">
              Spender Address:
            </Label>
            <Input
              id="spender-address"
              type="text"
              value={spenderAddress}
              onChange={(e) => setSpenderAddress(e.target.value as `0x${string}`)}
              placeholder="0x... (address you approved)"
              className="flex-grow font-mono text-sm"
            />
            <Button
              onClick={handleCheckApproval}
              disabled={!isSpenderValid || isFetchingApproval}
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              {isFetchingApproval ? 'Checking...' : 'Check Approval'}
            </Button>
          </div>
          {/* Display Approval Result Card - Conditionally rendered inside AllowanceDisplayCard */}
          <AllowanceDisplayCard
            title={`Approval Status for ${selectedTokenInfo.symbol}`}
            tokenAddress={lastCheckedTokenAddress}
            otherPartyAddress={lastCheckedSpender}
            amount={approvalResult} // Pass the fetched result or null
            spenderAddress={lastCheckedSpender} // Pass the spender we checked
            tokenSymbol={selectedTokenInfo.symbol}
          />
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Section 2: Allowances Received By User */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Allowances You Received</CardTitle>
          <CardDescription>
            Check the spending allowance granted to you by a specific address for {selectedTokenInfo.symbol}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Label htmlFor="owner-address" className="sm:w-[120px] flex-shrink-0 mt-2 sm:mt-0">
              Owner Address:
            </Label>
            <Input
              id="owner-address"
              type="text"
              value={ownerAddress}
              onChange={(e) => setOwnerAddress(e.target.value as `0x${string}`)}
              placeholder="0x... (address that approved you)"
              className="flex-grow font-mono text-sm"
            />
            <Button
              onClick={handleCheckAllowance}
              disabled={!isOwnerValid || isFetchingAllowance}
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              {isFetchingAllowance ? 'Checking...' : 'Check Allowance'}
            </Button>
          </div>
          {/* Display Allowance Result Card - Conditionally rendered inside AllowanceDisplayCard */}
          <AllowanceDisplayCard
            title={`Allowance Status for ${selectedTokenInfo.symbol}`}
            tokenAddress={lastCheckedTokenAddress}
            otherPartyAddress={lastCheckedOwner}
            amount={allowanceResult} // Pass the fetched result or null
            // Pass the user's address as the spender here, since we are checking Owner -> User allowance
            spenderAddress={userAddress ?? ''} // User is the spender in this context
            tokenSymbol={selectedTokenInfo.symbol}
          />
        </CardContent>
      </Card>
    </div>
  );
}
