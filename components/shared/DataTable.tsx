'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  TableOptions,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  noResultsMessage?: string | React.ReactNode;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  isLoading?: boolean;
  // Add other potential props like filtering, sorting state etc. if needed
}

export function DataTable<TData, TValue>({
  columns,
  data,
  noResultsMessage = 'No results found.',
  columnFilters,
  onColumnFiltersChange,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10, // Default page size
  });

  const tableOptions: TableOptions<TData> = {
    data,
    columns,
    state: {
      pagination,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onColumnFiltersChange: onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: false, // Use client-side pagination
  };

  const table = useReactTable(tableOptions);

  return (
    <div className="w-full min-h-[490px]">
      <div className="rounded-md border border-gray-200 dark:border-gray-700 flex flex-col h-full">
        <div className="flex-grow overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b-gray-200 dark:border-b-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="text-xs text-gray-500 uppercase dark:text-gray-400">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500 dark:text-gray-400">
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="transition-colors duration-150 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <TableCell key={cell.id} className="py-3 text-gray-700 dark:text-gray-300">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-0">
                  <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500 dark:text-gray-400">
                    {noResultsMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {!isLoading && table.getPageCount() > 1 && (
          <div className="flex items-center justify-end space-x-2 py-3 px-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
