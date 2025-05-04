import React, { useState, useEffect } from 'react';

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
interface FormFields {
  address?: string;
  amount?: string; // Covers mint amount, transfer amount
  allowance?: string; // Covers approve allowance
}

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

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  tokenDecimals = 0, // Default to 0 decimals if not provided
  className,
  iconContainerClassName,
  labelClassName,
  variant = 'outline', // Default variant
  onFormSubmit,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formFields, setFormFields] = useState<FormFields>({});

  // Reset form fields when dialog opens/closes or label changes
  useEffect(
    function resetFormFields() {
      if (!isOpen) {
        setFormFields({});
        // setErrors({});
      }
    },
    [isOpen, label]
  );

  function getStepValue() {
    if (tokenDecimals <= 0) {
      return '1'; // Whole numbers if 0 decimals
    }
    return `0.${'0'.repeat(tokenDecimals - 1)}1`;
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    if (name === 'address') {
      // Allow any input for address for now
      setFormFields((prev) => ({ ...prev, [name]: value }));
      return;
    }

    if (name === 'amount' || name === 'allowance') {
      const decimals = tokenDecimals;
      const processedValue = formatValueOnInputChange(value, decimals);

      // Update state
      setFormFields((prev) => ({ ...prev, [name]: processedValue }));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Basic validation check - ensure required fields are filled
    // This could be enhanced with more specific error messages
    const requiredFields = getRequiredFields(label);
    for (const field of requiredFields) {
      if (!formFields[field as keyof FormFields]) {
        console.error(`Missing required field: ${field}`);
        // Optionally set error state here
        return; // Prevent submission
      }
    }

    let structuredData: ActionFormData;

    switch (label.toLowerCase()) {
      case 'mint':
        if (formFields.amount !== undefined) {
          structuredData = { amount: formFields.amount };
        } else {
          console.error('Mint action missing amount');
          return;
        }
        break;
      case 'transfer':
        if (formFields.address !== undefined && formFields.amount !== undefined) {
          structuredData = { address: formFields.address, amount: formFields.amount };
        } else {
          console.error('Transfer action missing fields');
          return;
        }
        break;
      case 'approve':
        if (formFields.address !== undefined && formFields.allowance !== undefined) {
          structuredData = { address: formFields.address, allowance: formFields.allowance };
        } else {
          console.error('Approve action missing fields');
          return;
        }
        break;
      default:
        console.error('Unknown action type:', label);
        setIsOpen(false);
        return;
    }

    onFormSubmit?.(structuredData);
    setIsOpen(false); // Close the dialog
  }

  // Helper to determine required fields based on action label
  function getRequiredFields(actionLabel: string): string[] {
    switch (actionLabel.toLowerCase()) {
      case 'mint':
        return ['amount'];
      case 'transfer':
        return ['address', 'amount'];
      case 'approve':
        return ['address', 'allowance'];
      default:
        return [];
    }
  }

  function renderFormContent() {
    const stepValue = getStepValue();

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
                  type="text" // Change to text
                  inputMode="decimal" // Hint for mobile keyboards
                  placeholder={`Amount to mint (up to ${tokenDecimals} decimals)`}
                  className="col-span-3"
                  value={formFields.amount || ''} // Controlled input
                  onChange={handleInputChange} // Use change handler
                  step={stepValue} // Set step for number spinners (though type="text")
                  // pattern={amountPattern} // Remove pattern for HTML validation
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
                  value={formFields.address || ''} // Controlled input
                  onChange={handleInputChange} // Use change handler
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
                  type="text" // Change to text
                  inputMode="decimal" // Hint for mobile keyboards
                  placeholder={`Amount to transfer (up to ${tokenDecimals} decimals)`}
                  className="col-span-3"
                  value={formFields.amount || ''} // Controlled input
                  onChange={handleInputChange} // Use change handler
                  step={stepValue} // Set step for number spinners (though type="text")
                  // pattern={amountPattern} // Remove pattern for HTML validation
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
                  value={formFields.address || ''} // Controlled input
                  onChange={handleInputChange} // Use change handler
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
                  type="text" // Change to text
                  inputMode="decimal" // Hint for mobile keyboards
                  placeholder={`Allowance amount (up to ${tokenDecimals} decimals)`}
                  className="col-span-3"
                  value={formFields.allowance || ''} // Controlled input
                  onChange={handleInputChange} // Use change handler
                  step={stepValue} // Set step for number spinners (though type="text")
                  // pattern={amountPattern} // Remove pattern for HTML validation
                  required
                />
              </div>
            </div>
          </>
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
        <form onSubmit={handleSubmit}>
          <>{renderFormContent()}</>

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
