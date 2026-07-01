# Plan: Refactor Pessoas page — data-table pattern

## TL;DR
Refactor `page.client.tsx` into 4 files following the shadcn data-table pattern:
`page.tsx` (Server — data), `page.client.tsx` (Client — state), `columns.tsx` (ColumnDef<Person>), `data-table.tsx` (TanStack Table component).

## Files

- `src/app/(app)/(pessoas)/pessoas/page.tsx` — MODIFY: move `people` array here as simulated fetch, render `<PersonPageClient data={people} />`
- `src/app/(app)/(pessoas)/pessoas/page.client.tsx` — REPLACE: orchestrates state + renders NavTabs, Header, PersonDataTable, dialogs
- `src/app/(app)/(pessoas)/pessoas/columns.tsx` — CREATE: `Person` type + `ColumnDef<Person>[]`
- `src/app/(app)/(pessoas)/pessoas/data-table.tsx` — CREATE: `PersonDataTable` component

## State split

**page.client.tsx manages:**
- `isPersonFormOpen` + `selectedPerson` (Person | null)
- `isDeleteModalOpen` + `peopleToDelete` + `isDeleting`
- `searchValue` → passed as prop to DataTable

**data-table.tsx manages (internal TanStack state):**
- `sorting: SortingState`
- `rowSelection: Record<string,boolean>`
- `pagination: PaginationState` (pageIndex, pageSize=10)

## columns.tsx design
- Declares `TableMeta` augmentation: `{ onEdit: (p: Person) => void; onDelete: (pp: Person[]) => void }`
- Column 0: "select" — checkbox header (toggleAllPageRows) + checkbox cell (toggleSelected)
- Column 1: "name" (sortable) — header conditionally shows "Nome" or [Limpar seleção | Excluir N] when rows selected. Uses `table.getFilteredSelectedRowModel()` and `table.options.meta.onDelete()`
- Columns 2–5: phone, email, org, created_at — sortable headers (icon toggle asc/desc), `max-md:hidden`, icons (Call, Mail, Domain) with opacity-30 when null
- Column 6: actions — DropdownMenu with Edit (→ meta.onEdit) and Delete (→ meta.onDelete([row.original]))

## data-table.tsx design
- Props: `data: Person[]`, `searchValue: string`, `onEdit: (p: Person) => void`, `onDelete: (pp: Person[]) => void`
- Custom `globalFilterFn` searches name, phone, email, organization_name
- Renders `<Table containerClassName="flex-1 overflow-auto">` + `<Pagination>` with functional click handlers
- Pagination uses `table.setPageIndex()` / `table.previousPage()` / `table.nextPage()`, shows page numbers with ellipsis

## Sorting
- `ArrowUpward` icon for asc, `ArrowDownward` for desc, `UnfoldMore` (or similar) for unsorted — all from `@material-symbols-svg/react/rounded/w600`
- Clicking a sortable `TableHead` calls `column.toggleSorting(column.getIsSorted() === "asc")`

## Pagination display
- Always show: first page, last page, current page ± 1, with PaginationEllipsis between gaps
- Previous/Next use `onClick` on existing `PaginationPrevious`/`PaginationNext` (they extend `<a>`)

## Decisions
- `data-table.tsx` is NOT a generic `DataTable<T>` — it's `PersonDataTable` since the header has Person-specific selection behavior
- `page.tsx` passes data as a serializable prop (array of plain objects — safe for RSC)
- No column visibility, no column reordering (per requirements)
- PersonForm receives `mode="edit"` + person as `defaultValues` when editing (form mapping already broken, not to be fixed)
