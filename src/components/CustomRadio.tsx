import type { RadioProps } from '@nextui-org/react'
import { useRadio, VisuallyHidden, cn } from '@nextui-org/react'

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
				'group inline-flex flex-row-reverse items-center hover:bg-content2',
				'max-w-[300px] cursor-pointer gap-0 rounded-lg border-1 border-default p-1',
				'data-[selected=true]:border-primary-200 data-[selected=true]:bg-primary-100'
			)}
		>
			<VisuallyHidden>
				<input {...getInputProps()} />
			</VisuallyHidden>

			<div
				{...getLabelWrapperProps()}
				className='text-bold flex w-[52px] justify-center gap-0'
			>
				{children ? (
					<span {...getLabelProps()} className='text-bold'>
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
