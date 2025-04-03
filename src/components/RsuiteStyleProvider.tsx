import type { ReactNode } from 'react'
import 'rsuite/dist/rsuite-no-reset.min.css'

/**
 * Provides RSuite styling and imports the necessary CSS
 */
function RsuiteStyleProvider({
	children
}: {
	children: ReactNode
}): JSX.Element {
	return (
		<div className='rsuite-provider'>
			{/* Add custom styles for RSuite components */}
			<style>
				{`
				.rs-checkbox-label {
					font-weight: normal;
				}
				
				.rs-picker-tag .rs-picker-search-input>input {
					outline: none;
					border: none;
					--tw-ring-color: none;
				}
				
				.rs-picker-popup {
					z-index: 51;
				}
				`}
			</style>
			{children}
		</div>
	)
}

export default RsuiteStyleProvider
