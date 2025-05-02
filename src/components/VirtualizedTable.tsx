import { Spinner } from '@nextui-org/react'
import {
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	useReactTable,
	type ColumnDef,
	type ExpandedState
} from '@tanstack/react-table'
import type { ReactElement } from 'react'
import { Fragment, useMemo, useRef, useState } from 'react'

import { useVirtualScroll } from 'hooks/useVirtualScroll'
import { TableCell } from './TableCell'

// Constants for table virtualization
const ROW_HEIGHT = 56
const TABLE_MIN_OVERSCAN = 50
const TABLE_MAX_OVERSCAN = 100
const TABLE_CONTAINER_HEIGHT = 600

const estimateSize = () => ROW_HEIGHT

export interface Column {
	key: string
	label: JSX.Element | string
	align?: 'center' | 'end' | 'start'
}

export type Key = number | string
export type Row = Record<string, number | string> & {
	isExpandable?: boolean
	subEvents?: Row[]
}

interface TableProperties {
	ariaLabel: string
	columns: Column[]
	rows: Row[]
	renderCell: (row: Row, columnKey: Key) => ReactElement | number | string
	isLoading: boolean
	topContent?: ReactElement
	bottomContent?: ReactElement
	onLoadMore?: () => void
}

export function VirtualizedTable({
	ariaLabel,
	columns,
	rows,
	renderCell,
	isLoading,
	topContent,
	bottomContent,
	onLoadMore
}: TableProperties): ReactElement {
	const tableContainerReference = useRef<HTMLDivElement>(null)

	// Memoize data and column definitions
	const [expanded, setExpanded] = useState<ExpandedState>({})

	const tableColumns = useMemo<ColumnDef<Row>[]>(
		() =>
			columns.map((col) => ({
				id: col.key,
				header: () => col.label,
				accessorKey: col.key,
				cell: ({ row }) => row.original[col.key]
			})),
		[columns]
	)

	const table = useReactTable<Row>({
		data: rows,
		columns: tableColumns,
		state: {
			expanded
		},
		onExpandedChange: setExpanded,
		getSubRows: (row) => row.subEvents,
		getRowCanExpand: (row) => Boolean(row.original.isExpandable),
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel()
	})

	const { rows: tableRows } = table.getRowModel()

	const { virtualItems, paddingTop, paddingBottom } = useVirtualScroll({
		containerRef: tableContainerReference,
		itemCount: tableRows.length,
		estimateSize,
		overscanConfig: {
			min: TABLE_MIN_OVERSCAN,
			max: TABLE_MAX_OVERSCAN
		},
		onReachEnd: onLoadMore
	})

	return (
		<div className='w-full'>
			{topContent}

			<div
				ref={tableContainerReference}
				className='relative mt-4 w-full overflow-auto'
				style={{ height: `${TABLE_CONTAINER_HEIGHT}px` }}
				role='region'
				aria-label={`${String(ariaLabel)} scrollable content`}
			>
				<table
					className='w-full table-auto border-collapse'
					role='grid'
					aria-label={ariaLabel}
				>
					<thead className='sticky top-0 z-20 border-b border-gray-200 bg-gray-50'>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className='bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-600'
										style={{
											width: header.getSize(),
											textAlign:
												columns.find((col) => col.key === header.id)?.align ??
												'left'
										}}
									>
										{flexRender(
											header.column.columnDef.header,
											header.getContext()
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{paddingTop > 0 && (
							<tr>
								<td
									style={{ height: `${paddingTop}px` }}
									aria-hidden='true'
									colSpan={columns.length}
								/>
							</tr>
						)}
						{(() => {
							if (isLoading) {
								return (
									<tr>
										<td
											colSpan={columns.length}
											className='h-[600px] text-center'
											aria-label='Loading data'
										>
											<Spinner label='Loading...' aria-hidden='true' />
										</td>
									</tr>
								)
							}

							if (virtualItems.length === 0) {
								return (
									<tr>
										<td
											colSpan={columns.length}
											className='h-[600px] text-center'
											aria-label='No data available'
										>
											No rows to display.
										</td>
									</tr>
								)
							}

							return virtualItems.map((virtualRow) => {
								const row = tableRows[virtualRow.index]
								return (
									<Fragment key={row.id}>
										<tr
											className={`animate-fade-in ${row.original.isExpandable ? 'cursor-pointer' : ''} border-b border-gray-100 transition-opacity duration-500 ease-in-out hover:bg-gray-50`}
											onClick={() =>
												row.original.isExpandable && row.toggleExpanded()
											}
										>
											{row.getVisibleCells().map((cell) => {
												const columnLabel = String(
													columns.find((col) => col.key === cell.column.id)
														?.label ?? ''
												)
												return (
													<td
														key={cell.id}
														className='px-4 py-2.5'
														style={{
															textAlign:
																columns.find(
																	(col) => col.key === cell.column.id
																)?.align ?? 'left'
														}}
														role='gridcell'
														aria-label={`${columnLabel} value`}
													>
														<TableCell
															row={row.original}
															columnKey={cell.column.id}
															cellRenderer={renderCell}
														/>
													</td>
												)
											})}
										</tr>
										{row.getIsExpanded() && row.original.subEvents ? (
											<>
												{row.original.subEvents.map((subEvent) => (
													<tr
														key={`${row.id}-sub-${subEvent.key}`}
														className='border-b border-gray-100 bg-gray-50'
													>
														{columns.map((col) => (
															<td
																aria-label='Sub-row value'
																key={`${row.id}-sub-${subEvent.key}-${col.key}`}
																className='px-4 py-2.5'
																style={{
																	textAlign: col.align ?? 'left'
																}}
															>
																<TableCell
																	row={subEvent}
																	columnKey={col.key}
																	cellRenderer={renderCell}
																/>
															</td>
														))}
													</tr>
												))}
											</>
										) : null}
									</Fragment>
								)
							})
						})()}
						{paddingBottom > 0 && (
							<tr>
								<td
									style={{ height: `${paddingBottom}px` }}
									aria-hidden='true'
									colSpan={columns.length}
								/>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{bottomContent}
		</div>
	)
}

VirtualizedTable.defaultProps = {
	bottomContent: undefined,
	onLoadMore: undefined,
	topContent: undefined
}
