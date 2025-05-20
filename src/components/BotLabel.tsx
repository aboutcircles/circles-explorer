import { Tooltip } from '@nextui-org/react'
import { memo } from 'react'

interface BotLabelProperties {
	className?: string
}

function BotLabelBase({ className = '' }: BotLabelProperties) {
	return (
		<Tooltip content='This avatar could be a bot'>
			<span
				className={`inline-flex items-center rounded-full bg-yellow-50 p-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 ${className}`}
			>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					viewBox='0 0 20 20'
					fill='currentColor'
					className='h-4 w-4 text-yellow-700'
				>
					<path
						fillRule='evenodd'
						d='M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z'
						clipRule='evenodd'
					/>
				</svg>
			</span>
		</Tooltip>
	)
}

export const BotLabel = memo(BotLabelBase)

BotLabelBase.defaultProps = {
	className: ''
}
