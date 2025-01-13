import type { RadioProps } from '@nextui-org/react'
import { cn, useRadio, VisuallyHidden } from '@nextui-org/react'

export function CustomRadio(properties: RadioProps) {
	const {
		Component,
		children,
		description,
		getBaseProps,
		getInputProps,
		getLabelProps,
		getLabelWrapperProps
	} = useRadio(properties)

	return (
		<Component
			{...getBaseProps()}
			className={cn(
				'group inline-flex items-center',
				'cursor-pointer gap-0 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5',
				'hover:bg-gray-100',
				'data-[selected=true]:bg-[#312E81] data-[selected=true]:text-white'
			)}
		>
			<VisuallyHidden>
				<input {...getInputProps()} />
			</VisuallyHidden>

			<div
				{...getLabelWrapperProps()}
				className='text-bold flex justify-center gap-0'
			>
				{children ? (
					<span {...getLabelProps()} className='text-sm font-medium'>
						{children}
					</span>
				) : null}
				{description ? (
					<span className='text-small text-foreground opacity-70'>
						{description}
					</span>
				) : null}
			</div>
		</Component>
	)
}
