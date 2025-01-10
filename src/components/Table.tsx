import { useRef } from 'react'
import type React from 'react'
// import { useVirtualizer } from '@tanstack/react-virtual'
import type { TableProps as NextUITableProperties } from '@nextui-org/react'
import {
	Table as NextUITable,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	getKeyValue,
	Spinner
} from '@nextui-org/react'

export interface Column {
	key: string
	label: JSX.Element | string
	align?: 'center' | 'end' | 'start'
}

export type Key = number | string
export type Row = Record<string, number | string>

type RenderCellReturnType = JSX.Element | number | string

interface TableProperties extends NextUITableProperties {
	ariaLabel?: string
	columns: Column[]
	rows: Row[]
	renderCell?: (row: Row, columnKey: Key) => RenderCellReturnType
	isLoading: boolean
	selectedKeys?: string[]
}

const defaultRenderCell = (row: Row, columnKey: Key): RenderCellReturnType =>
	getKeyValue(row, columnKey)

export function Table({
	ariaLabel,
	columns,
	rows,
	renderCell = defaultRenderCell,
	isLoading,
	topContent,
	...rest
}: TableProperties): React.ReactElement {
	// The scrollable element for your list
	const parentReference = useRef(null)

	// The virtualizer
	// const rowVirtualizer = useVirtualizer({
	// 	count: 10_000,
	// 	getScrollElement: () => parentReference.current,
	// 	estimateSize: () => 56
	// })

	return (
		<NextUITable
			ref={parentReference}
			isStriped
			color='primary'
			aria-label={ariaLabel ?? 'Table'}
			topContent={topContent}
			{...rest}
		>
			<TableHeader columns={columns}>
				{(column) => (
					<TableColumn key={column.key} align={column.align}>
						{column.label}
					</TableColumn>
				)}
			</TableHeader>
			<TableBody
				items={rows}
				isLoading={isLoading}
				loadingContent={<Spinner label='Loading...' />}
				emptyContent='No rows to display.'
			>
				{(item) => (
					<TableRow
						key={item.key}
						className='animate-fade-in border-b-1 transition-opacity duration-500 ease-in-out'
					>
						{(columnKey) => (
							<TableCell>{renderCell(item, columnKey)}</TableCell>
						)}
					</TableRow>
				)}
			</TableBody>
		</NextUITable>
	)
}

Table.defaultProps = {
	ariaLabel: '',
	renderCell: defaultRenderCell,
	selectedKeys: []
}
