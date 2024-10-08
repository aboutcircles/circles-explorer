import { useCheckbox, Chip, VisuallyHidden, tv } from '@nextui-org/react'

const checkbox = tv({
	slots: {
		base: 'border-default hover:bg-default-200',
		content: 'text-default-500'
	},
	variants: {
		isSelected: {
			true: {
				base: 'border-primary bg-primary hover:bg-primary-500 hover:border-primary-500',
				content: 'text-primary-foreground'
			}
		},
		isFocusVisible: {
			true: {
				base: 'outline-none ring-2 ring-focus ring-offset-2 ring-offset-background'
			}
		}
	}
})

interface FilterCheckBoxProperties {
	label: string
	className: string
	isDefaultSelected: boolean
	handleChange: (value: boolean) => void
}

export function FilterCheckBox({
	label,
	className,
	isDefaultSelected,
	handleChange
}: FilterCheckBoxProperties): React.ReactElement {
	const {
		isSelected,
		isFocusVisible,
		getBaseProps,
		getLabelProps,
		getInputProps
	} = useCheckbox({
		defaultSelected: isDefaultSelected,
		isSelected: isDefaultSelected,
		onValueChange: handleChange,
		size: 'sm'
	})

	const styles = checkbox({ isSelected, isFocusVisible })

	return (
		<div className={className}>
			{/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
			<label {...getBaseProps()}>
				<VisuallyHidden>
					<input {...getInputProps()} />
				</VisuallyHidden>
				{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
				{/* @ts-expect-error */}
				<Chip
					classNames={{
						base: styles.base(),
						content: styles.content()
					}}
					color='primary'
					variant='faded'
					{...getLabelProps()}
				>
					{label}
				</Chip>
			</label>
		</div>
	)
}
