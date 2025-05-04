import React, { useState } from 'react';

import { cn, formatValueOnInputChange } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Define specific types for form data fields
// Using string to handle potential large numbers and decimals easily before conversion

export interface MintFormData {
  amount: string;
}

export interface TransferFormData {
  address: string;
  amount: string;
}

export interface ApproveFormData {
  address: string;
  allowance: string;
}

export type ActionFormData = MintFormData | TransferFormData | ApproveFormData;

// Use React.ComponentProps to get the props type of the Button component
type ButtonProps = React.ComponentProps<typeof Button>;

interface ActionButtonProps extends ButtonProps {
  icon: React.ReactNode; // Changed back to ReactNode
  label: string;
  tokenDecimals?: number; // Added prop to specify token decimals
  className?: string;
  iconContainerClassName?: string; // Renamed for clarity
  labelClassName?: string;
  onFormSubmit?: (data: ActionFormData) => void; // Use specific type for form submission
}

// Helper function to get step value based on decimals
function getStepValue(tokenDecimals: number): string {
  if (tokenDecimals <= 0) {
    return '1'; // Whole numbers if 0 decimals
  }
  return `0.${'0'.repeat(tokenDecimals - 1)}1`;
}

// --- Mint Form Component ---
interface MintFormProps {
  tokenDecimals: number;
  onSubmit: (data: MintFormData) => void;
  onClose: () => void;
}

function MintForm({ tokenDecimals, onSubmit, onClose }: MintFormProps) {
  const [amount, setAmount] = useState('');
  const stepValue = getStepValue(tokenDecimals);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const processedValue = formatValueOnInputChange(value, tokenDecimals);
    setAmount(processedValue);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amount) {
      console.error('Missing required field: amount');
      return;
    }
    onSubmit({ amount });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="amount" className="text-right">
            Amount
          </Label>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder={`Amount to mint (up to ${tokenDecimals} decimals)`}
            className="col-span-3"
            value={amount}
            onChange={handleInputChange}
            step={stepValue}
            required
            autoFocus // Focus the first input
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit">Mint</Button>
      </DialogFooter>
    </form>
  );
}

// --- Transfer Form Component ---
interface TransferFormProps {
  tokenDecimals: number;
  onSubmit: (data: TransferFormData) => void;
  onClose: () => void;
}

function TransferForm({ tokenDecimals, onSubmit, onClose }: TransferFormProps) {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const stepValue = getStepValue(tokenDecimals);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'address') {
      setAddress(value);
    } else if (name === 'amount') {
      const processedValue = formatValueOnInputChange(value, tokenDecimals);
      setAmount(processedValue);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address || !amount) {
      console.error('Missing required fields: address or amount');
      return;
    }
    onSubmit({ address, amount });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="address" className="text-right">
            Address
          </Label>
          <Input
            id="address"
            name="address"
            placeholder="Recipient wallet address"
            className="col-span-3"
            value={address}
            onChange={handleInputChange}
            required
            autoFocus // Focus the first input
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="amount" className="text-right">
            Amount
          </Label>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder={`Amount to transfer (up to ${tokenDecimals} decimals)`}
            className="col-span-3"
            value={amount}
            onChange={handleInputChange}
            step={stepValue}
            required
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit">Transfer</Button>
      </DialogFooter>
    </form>
  );
}

// --- Approve Form Component ---
interface ApproveFormProps {
  tokenDecimals: number;
  onSubmit: (data: ApproveFormData) => void;
  onClose: () => void;
}

function ApproveForm({ tokenDecimals, onSubmit, onClose }: ApproveFormProps) {
  const [address, setAddress] = useState('');
  const [allowance, setAllowance] = useState('');
  const stepValue = getStepValue(tokenDecimals);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'address') {
      setAddress(value);
    } else if (name === 'allowance') {
      const processedValue = formatValueOnInputChange(value, tokenDecimals);
      setAllowance(processedValue);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address || !allowance) {
      console.error('Missing required fields: address or allowance');
      return;
    }
    onSubmit({ address, allowance });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="address" className="text-right">
            Spender
          </Label>
          <Input
            id="address"
            name="address"
            placeholder="Spender wallet address"
            className="col-span-3"
            value={address}
            onChange={handleInputChange}
            required
            autoFocus // Focus the first input
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="allowance" className="text-right">
            Allowance
          </Label>
          <Input
            id="allowance"
            name="allowance"
            type="text"
            inputMode="decimal"
            placeholder={`Allowance amount (up to ${tokenDecimals} decimals)`}
            className="col-span-3"
            value={allowance}
            onChange={handleInputChange}
            step={stepValue}
            required
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit">Approve</Button>
      </DialogFooter>
    </form>
  );
}

// --- Main ActionButton Component ---
export function ActionButton({
  icon,
  label,
  tokenDecimals = 0, // Default to 0 decimals if not provided
  className,
  iconContainerClassName,
  labelClassName,
  variant = 'outline', // Default variant
  onFormSubmit,
  ...props
}: ActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFormSubmitWrapper = (data: ActionFormData) => {
    onFormSubmit?.(data);
    setIsOpen(false); // Close the dialog on successful submission
  };

  const handleDialogClose = () => {
    setIsOpen(false);
  };

  function renderForm() {
    switch (label.toLowerCase()) {
      case 'mint':
        return (
          <MintForm
            key={label} // Reset form state when label changes
            tokenDecimals={tokenDecimals}
            onSubmit={handleFormSubmitWrapper as (data: MintFormData) => void}
            onClose={handleDialogClose}
          />
        );
      case 'transfer':
        return (
          <TransferForm
            key={label}
            tokenDecimals={tokenDecimals}
            onSubmit={handleFormSubmitWrapper as (data: TransferFormData) => void}
            onClose={handleDialogClose}
          />
        );
      case 'approve':
        return (
          <ApproveForm
            key={label}
            tokenDecimals={tokenDecimals}
            onSubmit={handleFormSubmitWrapper as (data: ApproveFormData) => void}
            onClose={handleDialogClose}
          />
        );
      default:
        return <p>No action defined for this button.</p>;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          className={cn(
            'flex flex-col items-center justify-center gap-2 h-24 w-24 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 cursor-pointer', // Added w-24 for consistent size
            variant === 'outline' && 'hover:bg-indigo-50',
            className
          )}
          {...props}
        >
          <div className={cn('transition-transform group-hover:scale-110 [&_svg]:mr-0', iconContainerClassName)}>
            {icon}
          </div>
          <span className={cn(labelClassName)}>{label}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>{`Enter the details below to ${label.toLowerCase()} tokens.`}</DialogDescription>
        </DialogHeader>
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
}
