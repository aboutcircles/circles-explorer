import type React from 'react'
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
	label: string
	align?: 'center' | 'end' | 'start'
}

type Key = number | string
export type Row = Record<string, number | string>

interface TableProperties extends NextUITableProperties {
	ariaLabel?: string
	columns: Column[]
	rows: Row[]
	renderCell?: (row: Row, columnKey: Key) => React.ReactNode
	isLoading: boolean
	selectedKeys?: string[]
}

const defaultRenderCell = (row: Row, columnKey: Key): React.ReactNode =>
	getKeyValue(row, columnKey) as React.ReactNode

export function Table({
	ariaLabel,
	columns,
	rows,
	renderCell = defaultRenderCell,
	isLoading,
	topContent,
	...rest
}: TableProperties): React.ReactElement {
	return (
		<NextUITable
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
					<TableRow key={item.id}>
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