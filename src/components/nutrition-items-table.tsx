'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Loader2,
  UtensilsCrossed,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface MacroColConfig<T> {
  label: string;
  unit: string;
  getValue: (item: T) => number;
  getBarWidth: (item: T) => number;
  bg: string;
  text: string;
  fill: string;
}

export interface NutritionTableConfig<T> {
  getId: (item: T) => string;
  getItemName: (item: T) => string;
  getItemSubtitle: (item: T) => string | null;
  getThumbnail: (item: T) => string | null;
  getEnergy: (item: T) => number;
  macros: [MacroColConfig<T>, MacroColConfig<T>, MacroColConfig<T>];
  extraCol: { label: string; getValue: (item: T) => string };
  getEditHref: (item: T) => string;
  onDelete: (id: string) => void;
  /** Prefix for row testid: `${rowTestIdPrefix}-${id}` */
  rowTestIdPrefix?: string;
  /** Prefix for action testids: `delete-${prefix}-${id}` */
  actionTestIdPrefix?: string;
}

interface NutritionItemsTableProps<T> {
  items: T[];
  config: NutritionTableConfig<T>;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
}

type TableMeta = {
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ChevronUp className="h-3 w-3 shrink-0" />;
  if (sorted === 'desc') return <ChevronDown className="h-3 w-3 shrink-0" />;
  return <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-40" />;
}

export function NutritionItemsTable<T>({
  items,
  config,
  isLoading,
  emptyTitle = 'No items yet',
  emptyDescription = 'Add your first entry to get started.',
  searchPlaceholder = 'Filter by name...',
}: NutritionItemsTableProps<T>) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const columns: ColumnDef<T>[] = [
    {
      id: 'name',
      header: 'Item Name',
      accessorFn: (row) => config.getItemName(row),
      cell: ({ row }) => {
        const item = row.original;
        const name = config.getItemName(item);
        const subtitle = config.getItemSubtitle(item);
        const thumb = config.getThumbnail(item);
        return (
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg overflow-hidden shrink-0 border border-border/30 bg-secondary">
              {thumb ? (
                <Image src={thumb} alt="" width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div>
              <span className="font-headline font-bold text-foreground block text-sm">{name}</span>
              {subtitle && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{subtitle}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'energy',
      header: () => <div className="text-right">Energy (kcal)</div>,
      accessorFn: (row) => config.getEnergy(row),
      cell: ({ row }) => (
        <div className="text-right font-mono text-sm font-semibold text-foreground tabular-nums">
          {Math.round(config.getEnergy(row.original))}
        </div>
      ),
    },
    ...config.macros.map((macro): ColumnDef<T> => ({
      id: `macro-${macro.label.toLowerCase()}`,
      header: () => (
        <span className="flex items-center gap-1">
          {macro.label}
          <span className="text-[10px] lowercase font-medium opacity-70">{macro.unit}</span>
        </span>
      ),
      accessorFn: (row) => macro.getValue(row),
      cell: ({ row }) => {
        const val = macro.getValue(row.original);
        const barPct = macro.getBarWidth(row.original);
        return (
          <div className="flex items-center justify-between gap-2">
            <span className={`font-mono text-sm font-bold tabular-nums ${macro.text}`}>
              {val.toFixed(1)}g
            </span>
            <div className="w-12 h-1.5 rounded-full overflow-hidden bg-black/10 shrink-0">
              <div className={`h-full rounded-full ${macro.fill}`} style={{ width: `${barPct}%` }} />
            </div>
          </div>
        );
      },
    })),
    {
      id: 'extra',
      header: config.extraCol.label,
      accessorFn: (row) => parseFloat(config.extraCol.getValue(row)) || 0,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground tabular-nums">
          {config.extraCol.getValue(row.original)}
        </span>
      ),
    },
    {
      id: 'actions',
      enableSorting: false,
      header: () => <div className="text-center min-w-30">Actions</div>,
      cell: ({ row, table: t }) => {
        const item = row.original;
        const id = config.getId(item);
        const name = config.getItemName(item);
        const meta = t.options.meta as TableMeta;
        const deleteTestId = config.actionTestIdPrefix
          ? `delete-${config.actionTestIdPrefix}-${id}`
          : `delete-${id}`;
        const confirmTestId = config.actionTestIdPrefix
          ? `confirm-delete-${config.actionTestIdPrefix}-${id}`
          : `confirm-delete-${id}`;

        return (
          <div className="flex justify-center items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <Link href={config.getEditHref(item)} aria-label={`Edit ${name}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            {meta.confirmDelete === id ? (
              <div className="flex gap-1">
                <button
                  onClick={() => { config.onDelete(id); meta.setConfirmDelete(null); }}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all"
                  data-testid={confirmTestId}
                >
                  Delete
                </button>
                <button
                  onClick={() => meta.setConfirmDelete(null)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => meta.setConfirmDelete(id)}
                aria-label={`Delete ${name}`}
                data-testid={deleteTestId}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: items,
    columns,
    state: {
      globalFilter: search,
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue?.trim()) return true;
      return config.getItemName(row.original).toLowerCase().includes(filterValue.toLowerCase());
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: { confirmDelete, setConfirmDelete },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const start = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, filteredCount);
  const totalPages = table.getPageCount();

  function getPageButtons(): (number | 'ellipsis')[] {
    const current = pageIndex + 1;
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 'ellipsis', totalPages];
    if (current >= totalPages - 2) return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', totalPages];
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border">
          <span className="size-2 rounded-full bg-primary shrink-0" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            {filteredCount} {filteredCount === 1 ? 'Item' : 'Items'} View
          </span>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <Input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            placeholder={searchPlaceholder}
            className="pl-10"
          />
        </div>
        <div className="ml-auto">
          {(sorting.length > 0 || search.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSorting([]);
                setSearch('');
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-background rounded-lg overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <Table className="min-w-225 border-collapse">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted hover:bg-muted border-0">
                  {headerGroup.headers.map((header) => {
                    const macro = config.macros.find(
                      (m) => `macro-${m.label.toLowerCase()}` === header.column.id
                    );
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead
                        key={header.id}
                        className={`px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.15em] ${
                          macro ? `${macro.text} ${macro.bg}` : 'text-muted-foreground'
                        }`}
                      >
                        {canSort ? (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-1 cursor-pointer select-none hover:opacity-80 transition-opacity"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <SortIcon sorted={sorted} />
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="divide-y divide-border/15">
              {table.getRowModel().rows.length === 0 ? (
                <TableRow className="hover:bg-transparent border-0">
                  <TableCell colSpan={columns.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                        <UtensilsCrossed className="h-7 w-7 text-muted-foreground/40" />
                      </div>
                      <p className="text-base font-bold text-foreground">{emptyTitle}</p>
                      <p className="text-sm text-muted-foreground max-w-xs">{emptyDescription}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const rowTestId = config.rowTestIdPrefix
                    ? `${config.rowTestIdPrefix}-${config.getId(row.original)}`
                    : undefined;
                  return (
                    <TableRow
                      key={row.id}
                      data-testid={rowTestId}
                      className="group hover:bg-muted/40 transition-colors duration-150 cursor-pointer"
                      onClick={() => router.push(config.getEditHref(row.original))}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const macro = config.macros.find(
                          (m) => `macro-${m.label.toLowerCase()}` === cell.column.id
                        );
                        return (
                          <TableCell
                            key={cell.id}
                            className={`px-6 py-4 ${macro ? macro.bg : ''}`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-muted gap-4 border-t border-border/15">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                Rows per page
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  table.setPageSize(Number(v));
                  table.setPageIndex(0);
                }}
              >
                <SelectTrigger className="w-16 h-8 text-sm font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              Showing{' '}
              <span className="text-foreground font-bold">{start}–{end}</span>
              {' '}of{' '}
              <span className="text-foreground font-bold">{filteredCount}</span>
              {' '}entries
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <div className="flex items-center gap-1">
                {getPageButtons().map((btn, i) =>
                  btn === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="flex items-center justify-center w-8 h-8 text-muted-foreground/50 font-bold text-sm"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={btn}
                      variant={btn === pageIndex + 1 ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => table.setPageIndex(btn - 1)}
                      className="h-8 w-8"
                    >
                      {btn}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
