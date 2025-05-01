import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Assuming you have a utility for class names
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
  className?: string;
  iconContainerClassName?: string; // Renamed for clarity
  labelClassName?: string;
  onFormSubmit?: (data: ActionFormData) => void; // Use specific type for form submission
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  className,
  iconContainerClassName,
  labelClassName,
  variant = 'outline', // Default variant
  onFormSubmit,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // Convert FormData to a plain object
    const rawData = Object.fromEntries(formData.entries());

    let structuredData: ActionFormData;

    // Structure the data based on the action type (label)
    switch (label.toLowerCase()) {
      case 'mint':
        structuredData = { amount: rawData.amount as string };
        break;
      case 'transfer':
        structuredData = {
          address: rawData.address as string,
          amount: rawData.amount as string,
        };
        break;
      case 'approve':
        structuredData = {
          address: rawData.address as string,
          allowance: rawData.allowance as string,
        };
        break;
      default:
        console.error('Unknown action type:', label);
        setIsOpen(false);
        return;
    }

    onFormSubmit?.(structuredData);
    setIsOpen(false); // Close the dialog
  };

  const renderFormContent = () => {
    switch (label.toLowerCase()) {
      case 'mint':
        return (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="Amount to mint"
                  className="col-span-3"
                  required
                />
              </div>
            </div>
          </>
        );
      case 'transfer':
        return (
          <>
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
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="Amount to transfer"
                  className="col-span-3"
                  required
                />
              </div>
            </div>
          </>
        );
      case 'approve':
        return (
          <>
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
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="allowance" className="text-right">
                  Allowance
                </Label>
                <Input
                  id="allowance"
                  name="allowance"
                  type="number"
                  placeholder="Allowance amount"
                  className="col-span-3"
                  required
                />
              </div>
            </div>
          </>
        );
      default:
        return <p>No action defined for this button.</p>;
    }
  };

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
          <div className={cn('transition-transform group-hover:scale-110', iconContainerClassName)}>{icon}</div>
          <span className={cn(labelClassName)}>{label}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>{`Enter the details below to ${label.toLowerCase()} tokens.`}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {renderFormContent()}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">{label}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
