import { Spinner } from '@nextui-org/react'
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
	type ColumnDef
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ReactElement } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { TableCell } from './TableCell'
import { MILLISECONDS_IN_A_SECOND } from '../constants/time'

const ROW_HEIGHT = 56
const MIN_OVERSCAN_COUNT = 5
const MAX_OVERSCAN_COUNT = 10
const SCROLL_SPEED_THRESHOLD = 100 // pixels per second
const LAST_ELEMENT_INDEX = -1

export interface Column {
	key: string
	label: JSX.Element | string
	align?: 'center' | 'end' | 'start'
}

export type Key = number | string
export type Row = Record<string, number | string>

interface TableProperties {
	ariaLabel: string
	columns: Column[]
	rows: Row[]
	renderCell: (row: Row, columnKey: Key) => ReactElement | number | string
	isLoading: boolean
	topContent?: ReactElement
	bottomContent?: ReactElement
}

export function VirtualizedTable({
	ariaLabel,
	columns,
	rows,
	renderCell,
	isLoading,
	topContent,
	bottomContent
}: TableProperties): ReactElement {
	const tableContainerReference = useRef<HTMLDivElement>(null)
	const [overscanCount, setOverscanCount] = useState(MIN_OVERSCAN_COUNT)
	const lastScrollTime = useRef<{ time: number; position: number }>({
		time: 0,
		position: 0
	})

	// Memoize data and column definitions
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

	// Dynamic overscan based on scroll speed
	const handleScroll = useCallback((event: Event) => {
		const target = event.target as HTMLDivElement
		const currentTime = performance.now()
		const currentPosition = target.scrollTop

		if (lastScrollTime.current.time) {
			const timeDiff = currentTime - lastScrollTime.current.time
			const positionDiff = Math.abs(
				currentPosition - lastScrollTime.current.position
			)
			const scrollSpeed = (positionDiff / timeDiff) * MILLISECONDS_IN_A_SECOND

			setOverscanCount(
				scrollSpeed > SCROLL_SPEED_THRESHOLD
					? MAX_OVERSCAN_COUNT
					: MIN_OVERSCAN_COUNT
			)
		}

		lastScrollTime.current = { time: currentTime, position: currentPosition }
	}, [])

	useEffect(() => {
		const element = tableContainerReference.current
		if (!element) {
			return void 0
		}

		element.addEventListener('scroll', handleScroll)
		return () => element.removeEventListener('scroll', handleScroll)
	}, [handleScroll])

	const table = useReactTable({
		data: rows,
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel()
	})

	const { rows: tableRows } = table.getRowModel()

	const rowVirtualizer = useVirtualizer({
		count: tableRows.length,
		getScrollElement: () => tableContainerReference.current,
		estimateSize: useCallback(() => ROW_HEIGHT, []),
		overscan: overscanCount
	})

	const virtualRows = rowVirtualizer.getVirtualItems()
	const totalSize = rowVirtualizer.getTotalSize()
	const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0
	const paddingBottom =
		virtualRows.length > 0
			? totalSize - (virtualRows.at(LAST_ELEMENT_INDEX)?.end ?? 0)
			: 0

	return (
		<div className='w-full'>
			{topContent}

			<div
				ref={tableContainerReference}
				className='relative mt-4 w-full overflow-auto'
				style={{ height: '600px' }} // Adjust based on your needs
				role='region'
				aria-label={`${String(ariaLabel)} scrollable content`}
			>
				<table
					className='w-full table-auto border-collapse'
					role='grid'
					aria-label={ariaLabel}
				>
					<thead className='sticky top-0 z-50 border-b border-gray-200 bg-gray-50'>
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

							if (virtualRows.length === 0) {
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

							return virtualRows.map((virtualRow) => {
								const row = tableRows[virtualRow.index]
								return (
									<tr
										key={row.id}
										className='animate-fade-in border-b border-gray-100 transition-opacity duration-500 ease-in-out hover:bg-gray-50'
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
															columns.find((col) => col.key === cell.column.id)
																?.align ?? 'left'
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
	topContent: undefined
}
