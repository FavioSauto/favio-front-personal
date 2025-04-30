'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Using AlertDialog for modal behavior
import { Button } from '@/components/ui/button';

import { useIsErrorModalOpen, useErrorMessage, useErrorActions } from '@/providers/stores/storeProvider';

function ErrorModal() {
  const isErrorModalOpen = useIsErrorModalOpen();
  const errorMessage = useErrorMessage();
  const { clearError } = useErrorActions();

  if (!isErrorModalOpen || !errorMessage) {
    return null;
  }

  return (
    <AlertDialog open={isErrorModalOpen} onOpenChange={(open: boolean) => !open && clearError()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 dark:text-red-400">Error Occurred</AlertDialogTitle>
          <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={clearError} asChild>
            <Button variant="outline">Close</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ErrorModal;
