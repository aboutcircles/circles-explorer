import { Card } from '@nextui-org/react'
import { memo } from 'react'

interface BotWarningBannerProperties {
	className?: string
}

function BotWarningBannerBase({ className = '' }: BotWarningBannerProperties) {
	return (
		<Card
			className={`mb-4 w-full bg-yellow-50 p-3 text-center ${className}`}
			radius='sm'
		>
			<div className='flex items-center justify-center gap-2'>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					viewBox='0 0 20 20'
					fill='currentColor'
					className='h-5 w-5 text-yellow-700'
				>
					<path
						fillRule='evenodd'
						d='M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z'
						clipRule='evenodd'
					/>
				</svg>
				<span className='text-sm font-medium text-yellow-800'>
					This avatar could be a bot
				</span>
			</div>
		</Card>
	)
}

export const BotWarningBanner = memo(BotWarningBannerBase)

BotWarningBannerBase.defaultProps = {
	className: ''
}
