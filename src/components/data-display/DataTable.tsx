"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type PaginationState,
  type RowData,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Download,
  SlidersHorizontal,
  Table2,
  View,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type DataTableDensity = "comfortable" | "compact";

export type DataTableCsvOptions<TData> = {
  filename?: string;
  getCellValue?: (row: TData, columnId: string) => unknown;
};

export type DataTableProps<TData> = {
  columns: Array<ColumnDef<TData, unknown>>;
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  searchPlaceholder?: string;
  initialSearch?: string;
  searchFn?: (row: TData, query: string) => boolean;
  enableRowSelection?: boolean;
  initialSorting?: SortingState;
  initialDensity?: DataTableDensity;
  initialPageSize?: number;
  csv?: DataTableCsvOptions<TData>;
  className?: string;
};

function escapeCsvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  const needsQuotes = /[",\n\r]/.test(text);
  const escaped = text.replaceAll('"', '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function downloadTextFile(filename: string, text: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function defaultSearchFn<TData>(row: TData, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return JSON.stringify(row).toLowerCase().includes(q);
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    csvHeader?: string;
    csvExport?: boolean;
  }
}

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  searchPlaceholder = "Filter…",
  initialSearch = "",
  searchFn = defaultSearchFn,
  enableRowSelection = true,
  initialSorting = [],
  initialDensity = "comfortable",
  initialPageSize = 20,
  csv,
  className,
}: DataTableProps<TData>) {
  const [search, setSearch] = useState(initialSearch);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [density, setDensity] = useState<DataTableDensity>(initialDensity);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const filteredData = useMemo(() => {
    const q = search.trim();
    if (!q) return data;
    return data.filter((row) => searchFn(row, q));
  }, [data, search, searchFn]);

  const selectionColumn = useMemo<ColumnDef<TData, unknown>>(
    () => ({
      id: "select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          aria-label="Select row"
        />
      ),
    }),
    [],
  );

  const resolvedColumns = useMemo(
    () => (enableRowSelection ? [selectionColumn, ...columns] : columns),
    [columns, enableRowSelection, selectionColumn],
  );

  const table = useReactTable({
    data: filteredData,
    columns: resolvedColumns,
    getRowId,
    state: {
      sorting,
      pagination,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const tableHeaders = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  const densityCellClassName = density === "compact" ? "py-2" : "py-3";
  const densityHeadClassName = density === "compact" ? "h-10" : "h-12";

  function exportCsv() {
    const visibleCols = table
      .getVisibleLeafColumns()
      .filter((col) => col.id !== "select" && col.columnDef.meta?.csvExport !== false);
    const selected = table.getSelectedRowModel().rows;
    const exportRows = selected.length > 0 ? selected : table.getPrePaginationRowModel().rows;

    const headerLine = visibleCols
      .map((col) => escapeCsvCell(col.columnDef.meta?.csvHeader ?? (typeof col.columnDef.header === "string" ? col.columnDef.header : col.id)))
      .join(",");

    const lines = exportRows.map((row) => {
      const original = row.original as TData;
      return visibleCols
        .map((col) => {
          const value =
            csv?.getCellValue?.(original, col.id) ??
            (row.getValue(col.id) as unknown);
          return escapeCsvCell(value);
        })
        .join(",");
    });

    const output = [headerLine, ...lines].join("\n");
    downloadTextFile(csv?.filename ?? "export.csv", output, "text/csv;charset=utf-8");
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Filter table"
              className="h-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <View className="h-4 w-4" aria-hidden="true" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllLeafColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={(value) => col.toggleVisibility(Boolean(value))}
                    >
                      {col.columnDef.meta?.csvHeader ?? col.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Density
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Row density</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={density} onValueChange={(v) => setDensity(v as DataTableDensity)}>
                  <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {csv ? (
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Export CSV
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground lg:justify-end">
          <div className="inline-flex items-center gap-2">
            <Table2 className="h-4 w-4" aria-hidden="true" />
            <span className="tabular-nums">
              {table.getPrePaginationRowModel().rows.length} row
              {table.getPrePaginationRowModel().rows.length === 1 ? "" : "s"}
            </span>
            {enableRowSelection ? (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="tabular-nums">
                  {table.getSelectedRowModel().rows.length} selected
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card/60 shadow-sm backdrop-blur">
        <Table>
          <TableHeader>
            {tableHeaders.map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortState = header.column.getIsSorted();
                  const SortIcon =
                    sortState === "asc" ? ArrowUp : sortState === "desc" ? ArrowDown : ChevronsUpDown;

                  return (
                    <TableHead key={header.id} className={cn(densityHeadClassName, "whitespace-nowrap")}>
                      {header.isPlaceholder ? null : canSort ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="-ml-2 h-8 gap-2 px-2"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="py-10 text-center text-muted-foreground">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={densityCellClassName}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Page <span className="tabular-nums">{table.getState().pagination.pageIndex + 1}</span> of{" "}
          <span className="tabular-nums">{table.getPageCount()}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                {table.getState().pagination.pageSize} / page
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Page size</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(v) => table.setPageSize(Number(v))}
              >
                {[10, 20, 50, 100].map((size) => (
                  <DropdownMenuRadioItem key={size} value={String(size)}>
                    {size}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
