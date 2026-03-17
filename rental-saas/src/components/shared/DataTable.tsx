import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, SlidersHorizontal, Table2 } from "lucide-react"
import { useMemo, useState } from "react"
import { EmptyState } from "./EmptyState"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Skeleton } from "../ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  searchKey?: string
  searchPlaceholder?: string
  getRowClassName?: (row: TData) => string | undefined
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  searchKey,
  searchPlaceholder = "Search...",
  getRowClassName,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [showColumns, setShowColumns] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    state: { columnVisibility, sorting },
  })

  const empty = useMemo(() => !loading && table.getRowModel().rows.length === 0, [loading, table])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {searchKey && (
          <Input
            className="max-w-sm"
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
          />
        )}

        <div className="relative ml-auto">
          <Button variant="outline" onClick={() => setShowColumns((prev) => !prev)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Columns
          </Button>
          {showColumns && (
            <div className="absolute right-0 z-10 mt-2 min-w-48 rounded-md border bg-popover p-2 shadow-md">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <label key={column.id} className="flex items-center gap-2 rounded p-1 text-sm hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={(event) => column.toggleVisibility(event.target.checked)}
                    />
                    <span>{column.id}</span>
                  </label>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sort = header.column.getIsSorted()

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={canSort ? "inline-flex items-center gap-1" : "inline-flex"}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && sort === "asc" && <ArrowUp className="h-3 w-3" />}
                          {canSort && sort === "desc" && <ArrowDown className="h-3 w-3" />}
                        </button>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`}>
                    {columns.map((_, col) => (
                      <TableCell key={`cell-${col}`}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className={getRowClassName?.(row.original)}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {empty && (
        <EmptyState
          icon={Table2}
          title="No records found"
          description="There is no data available yet. Try adjusting your filters or adding new entries."
        />
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </span>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
