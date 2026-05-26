'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
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
import { MacroFillTrack } from '@/components/macro-fill-track';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  emptyState?: ReactNode;
  searchPlaceholder?: string;
  /** When set with `onSearchChange`, filter text is controlled by the parent (e.g. mobile search above tabs). */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

type TableMeta = {
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
  useInlineDeleteConfirm: boolean;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

function macroMetricLabel(label: string): string {
  const map: Record<string, string> = {
    Protein: 'PROT',
    Carbs: 'CARB',
    Fats: 'FATS',
    Fat: 'FATS',
  };
  return map[label] ?? label.toUpperCase();
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ChevronUp className="h-3 w-3 shrink-0" />;
  if (sorted === 'desc') return <ChevronDown className="h-3 w-3 shrink-0" />;
  return <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-40" />;
}

function NutritionMobileCard<T>({
  item,
  config,
  meta,
  rowTestId,
}: {
  item: T;
  config: NutritionTableConfig<T>;
  meta: TableMeta;
  rowTestId?: string;
}) {
  const id = config.getId(item);
  const name = config.getItemName(item);
  const subtitle = config.getItemSubtitle(item);
  const thumb = config.getThumbnail(item);
  const deleteTestId = config.actionTestIdPrefix
    ? `delete-${config.actionTestIdPrefix}-${id}`
    : `delete-${id}`;
  const confirmTestId = config.actionTestIdPrefix
    ? `confirm-delete-${config.actionTestIdPrefix}-${id}`
    : `confirm-delete-${id}`;

  const editHref = config.getEditHref(item);
  const useInlineDeleteConfirm = meta.useInlineDeleteConfirm;

  return (
    <article
      data-testid={rowTestId}
      className="flex items-stretch gap-3 rounded-[1.75rem] border border-border/70 bg-card px-3.5 py-3 shadow-sm"
    >
      <Link
        href={editHref}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-4xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="size-16 shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-secondary shadow-md">
          {thumb ? (
            <Image
              src={thumb}
              alt={name}
              width={52}
              height={52}
              className="h-full w-full object-cover"
              sizes="52px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 self-stretch">
          <div className="flex h-full flex-col justify-center gap-2">
            <div className="min-w-0 space-y-1">
              <h3 className="truncate font-headline text-[0.95rem] font-bold leading-tight text-foreground">
                {name}
              </h3>
              {subtitle ? (
                <p className="truncate text-[11px] leading-tight text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm leading-none text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">
                {Math.round(config.getEnergy(item))} kcal
              </span>
              <span className="text-border">|</span>
              <span>
                {config.extraCol.label}:{' '}
                <span className="font-mono tabular-nums text-foreground">{config.extraCol.getValue(item)}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {config.macros.map((macro) => {
                const val = macro.getValue(item);
                return (
                  <div key={macro.label} className="px-1 py-1.5">
                    <span className={`block text-[11px] font-bold uppercase tracking-[0.16em] ${macro.text}`}>
                      {macroMetricLabel(macro.label)}
                    </span>
                    <span className={`mt-1 block font-mono text-lg font-bold tabular-nums ${macro.text}`}>
                      {val.toFixed(1)}g
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Link>

      <div className="flex shrink-0 items-center self-stretch">
        {useInlineDeleteConfirm && meta.confirmDelete === id ? (
          <div className="flex flex-col gap-1">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                config.onDelete(id);
                meta.setConfirmDelete(null);
              }}
              className="h-auto rounded-lg px-2 py-1 text-[10px]"
              data-testid={confirmTestId}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => meta.setConfirmDelete(null)}
              className="h-auto rounded-lg px-2 py-1 text-[10px]"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 self-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => meta.setConfirmDelete(id)}
              aria-label={`Delete ${name}`}
              data-testid={deleteTestId}
            >
              <Trash2 className="h-4.5 w-4.5" strokeWidth={1.75} />
            </Button>

            {!useInlineDeleteConfirm && (
              <AlertDialog open={meta.confirmDelete === id} onOpenChange={(open) => { if (!open) meta.setConfirmDelete(null); }}>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete item?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {name}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      data-testid={confirmTestId}
                      onClick={() => {
                        config.onDelete(id);
                        meta.setConfirmDelete(null);
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}
      </div>
    </article>
  );
}

export function NutritionItemsTable<T>({
  items,
  config,
  isLoading,
  emptyTitle = 'No items yet',
  emptyDescription = 'Add your first entry to get started.',
  emptyState,
  searchPlaceholder = 'Filter by name...',
  searchValue,
  onSearchChange,
}: NutritionItemsTableProps<T>) {
  const router = useRouter();
  const [internalSearch, setInternalSearch] = useState('');
  // IMPORTANT for Playwright: avoid rendering both card + table variants at once.
  // Hidden duplicates still exist in the DOM and cause strict-mode locator failures.
  // Desktop-only table starts at lg; tablet and smaller use cards.
  const [isDesktop, setIsDesktop] = useState(true);
  const [useInlineDeleteConfirm, setUseInlineDeleteConfirm] = useState(false);
  const isSearchControlled = onSearchChange !== undefined;
  const search = isSearchControlled ? (searchValue ?? '') : internalSearch;
  const setSearch = (value: string) => {
    if (isSearchControlled) onSearchChange(value);
    else setInternalSearch(value);
  };

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setUseInlineDeleteConfirm(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [search]);

  useEffect(() => {
    setConfirmDelete(null);
  }, [useInlineDeleteConfirm]);

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
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-lg overflow-hidden shrink-0 border border-border/30 bg-secondary">
              {thumb ? (
                <Image src={thumb} alt={name} width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="font-headline font-bold text-foreground block text-sm truncate">{name}</span>
              {subtitle && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-tight truncate block max-w-[220px]">{subtitle}</span>
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
            <MacroFillTrack
              className="w-12 shrink-0"
              heightClassName="h-1.5"
              percent={barPct}
              fillClassName={macro.fill}
              trackClassName="bg-black/10"
              aria-hidden
            />
          </div>
        );
      },
    })),
    {
      id: 'extra',
      header: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-center cursor-default">{config.extraCol.label}</div>
          </TooltipTrigger>
          <TooltipContent className="font-semibold text-background bg-foreground">
            Ingredients
          </TooltipContent>
        </Tooltip>
      ),
      accessorFn: (row) => parseFloat(config.extraCol.getValue(row)) || 0,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="font-mono text-sm text-muted-foreground tabular-nums">
            {config.extraCol.getValue(row.original)}
          </span>
        </div>
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
            {meta.useInlineDeleteConfirm && meta.confirmDelete === id ? (
              <div className="flex gap-1">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { config.onDelete(id); meta.setConfirmDelete(null); }}
                  className="text-xs h-auto py-1.5 px-2.5 rounded-lg"
                  data-testid={confirmTestId}
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => meta.setConfirmDelete(null)}
                  className="text-xs h-auto py-1.5 px-2.5 rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
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

                {!meta.useInlineDeleteConfirm && (
                  <AlertDialog open={meta.confirmDelete === id} onOpenChange={(open) => { if (!open) meta.setConfirmDelete(null); }}>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete item?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {name}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          data-testid={confirmTestId}
                          onClick={() => {
                            config.onDelete(id);
                            meta.setConfirmDelete(null);
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];

  // TanStack Table returns unstable function refs; React Compiler skips memoization (expected).
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable API is incompatible with compiler memoization heuristics
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
    meta: { confirmDelete, setConfirmDelete, useInlineDeleteConfirm },
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

  const itemsViewBadge = (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border shrink-0">
      <span className="size-2 rounded-full bg-primary shrink-0" />
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
        {filteredCount} {filteredCount === 1 ? 'Item' : 'Items'} View
      </span>
    </div>
  );

  const resetFilterButton =
    sorting.length > 0 || search.length > 0 ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSorting([]);
          setSearch('');
        }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </Button>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Controls: mobile = search when not controlled + optional reset (item count badge is md+ only); md+ = single row */}
      {isDesktop ? (
        <div className="flex flex-wrap items-center gap-4">
          {itemsViewBadge}
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none z-10" />
            <Input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder={searchPlaceholder}
              className="pl-10 w-full"
            />
          </div>
          <div className="ml-auto">{resetFilterButton}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {!isSearchControlled && (
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none z-10" />
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                placeholder={searchPlaceholder}
                className="pl-10 w-full"
              />
            </div>
          )}
          {resetFilterButton ? (
            <div className="flex justify-end">{resetFilterButton}</div>
          ) : null}
        </div>
      )}

      {/* Table card — table on md+, stacked cards below */}
      <div className="bg-background rounded-lg overflow-hidden border border-border">
        {isDesktop ? (
        <div className="overflow-x-auto">
          <Table className="border-collapse w-full">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-1 h-auto p-0 select-none hover:bg-transparent hover:text-foreground transition-colors font-extrabold uppercase tracking-[0.15em] text-[11px]"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <SortIcon sorted={sorted} />
                          </Button>
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
                  <TableCell
                    colSpan={columns.length}
                    className={emptyState ? 'px-6 py-10' : 'px-6 py-20 text-center'}
                  >
                    {emptyState ?? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                          <UtensilsCrossed className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                        <p className="text-base font-bold text-foreground">{emptyTitle}</p>
                        <p className="text-sm text-muted-foreground max-w-xs">{emptyDescription}</p>
                      </div>
                    )}
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
        </div>) : (
        <div className="p-3 space-y-3">
          {table.getRowModel().rows.length === 0 ? (
            <div className={emptyState ? 'py-6 px-1' : 'py-14 px-4 text-center'}>
              {emptyState ?? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                    <UtensilsCrossed className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-base font-bold text-foreground">{emptyTitle}</p>
                  <p className="text-sm text-muted-foreground max-w-xs">{emptyDescription}</p>
                </div>
              )}
            </div>
          ) : (
            table.getRowModel().rows.map((row) => {
              const rowTestId = config.rowTestIdPrefix
                ? `${config.rowTestIdPrefix}-${config.getId(row.original)}`
                : undefined;
              return (
                <NutritionMobileCard
                  key={row.id}
                  item={row.original}
                  config={config}
                  meta={{ confirmDelete, setConfirmDelete, useInlineDeleteConfirm }}
                  rowTestId={rowTestId}
                />
              );
            })
          )}
        </div>)}

        {/* Footer / Pagination */}
        <div className="flex flex-col gap-4 px-6 py-4 bg-muted border-t border-border/15 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <div className="hidden items-center gap-2 md:flex">
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
            <span className="text-xs font-semibold text-muted-foreground text-center md:text-left">
              Showing{' '}
              <span className="text-foreground font-bold">{start}–{end}</span>
              {' '}of{' '}
              <span className="text-foreground font-bold">{filteredCount}</span>
              {' '}entries
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end md:gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <div className="hidden items-center gap-1 md:flex">
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
