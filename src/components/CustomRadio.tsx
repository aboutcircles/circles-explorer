import type { RadioProps } from '@nextui-org/react'
import { useRadio, VisuallyHidden, cn } from '@nextui-org/react'

export function CustomRadio(properties: RadioProps) {
	const {
		Component,
		children,
		description,
		getBaseProps,
		getWrapperProps,
		getInputProps,
		getLabelProps,
		getLabelWrapperProps,
		getControlProps
	} = useRadio(properties)

	return (
		<Component
			{...getBaseProps()}
			className={cn(
				'group inline-flex flex-row-reverse items-center justify-between hover:bg-content2',
				'max-w-[300px] cursor-pointer gap-4 rounded-lg border-2 border-default p-1',
				'data-[selected=true]:border-primary'
			)}
		>
			<VisuallyHidden>
				<input {...getInputProps()} />
			</VisuallyHidden>
			<span {...getWrapperProps()}>
				<span {...getControlProps()} />
			</span>
			<div {...getLabelWrapperProps()}>
				{children ? <span {...getLabelProps()}>{children}</span> : null}
				{description ? (
					<span className='text-small text-foreground opacity-70'>
						{description}
					</span>
				) : null}
			</div>
		</Component>
	)
}
