import type { ReactElement } from 'react'
import { memo } from 'react'
import type { Key, Row } from './VirtualizedTable'

interface TableCellProperties {
	row: Row
	columnKey: string
	cellRenderer: (row: Row, columnKey: Key) => ReactElement | number | string
}

function TableCellComponent({
	row,
	columnKey,
	cellRenderer
}: TableCellProperties): ReactElement | number | string {
	return cellRenderer(row, columnKey)
}

export const TableCell = memo(TableCellComponent)
