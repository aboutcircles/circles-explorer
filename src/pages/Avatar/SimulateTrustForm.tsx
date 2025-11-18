import { Button, Card, Chip, Input } from '@nextui-org/react'
import type { ReactElement } from 'react'
import { useState } from 'react'
import type { Address } from 'viem'
import { isAddress } from 'viem'

import { Loader } from 'components/Loader'
import { useValidateTrust } from 'domains/trust/repository'
import { AvatarAddress } from 'shared/AvatarAddress'

// Constants for danger score thresholds
const LOW_DANGER_THRESHOLD = 0.3
const MEDIUM_DANGER_THRESHOLD = 0.7
const DECIMAL_PLACES = 2

interface SimulateTrustFormProperties {
	address: Address
}

export function SimulateTrustForm({
	address
}: SimulateTrustFormProperties): ReactElement {
	const [truster, setTruster] = useState<string>(address)
	const [trustee, setTrustee] = useState<string>('')
	const [expirationTime, setExpirationTime] = useState<string>('1795027292')

	const mutation = useValidateTrust()

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault()

		if (!isAddress(truster) || !isAddress(trustee)) {
			return
		}

		const expirationTimeNumber = Number.parseInt(expirationTime, 10)
		if (Number.isNaN(expirationTimeNumber)) {
			return
		}

		mutation.mutate({
			truster,
			trustee,
			expiration_time: expirationTimeNumber
		})
	}

	const isTrusterValid = isAddress(truster)
	const isTrusteeValid = isAddress(trustee)
	const isExpirationTimeValid =
		expirationTime !== '' && !Number.isNaN(Number.parseInt(expirationTime, 10))
	const isFormValid = isTrusterValid && isTrusteeValid && isExpirationTimeValid

	return (
		<div className='m-5'>
			<Card className='mb-6 max-w-2xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm'>
				<form onSubmit={handleSubmit} className='space-y-8'>
					<div>
						<Input
							label='Truster Address'
							placeholder='0x...'
							labelPlacement='outside'
							value={truster}
							onValueChange={setTruster}
							variant='bordered'
							size='lg'
							isRequired
							color={truster && !isTrusterValid ? 'danger' : 'default'}
							errorMessage={
								truster && !isTrusterValid
									? 'Please enter a valid Ethereum address'
									: undefined
							}
							classNames={{
								base: 'w-full',
								label: 'text-base font-medium mb-4',
								input: 'text-base',
								inputWrapper: 'h-14 px-4 py-3'
							}}
						/>
					</div>

					<div>
						<Input
							label='Trustee Address'
							placeholder='0x...'
							labelPlacement='outside'
							value={trustee}
							onValueChange={setTrustee}
							variant='bordered'
							size='lg'
							isRequired
							color={trustee && !isTrusteeValid ? 'danger' : 'default'}
							errorMessage={
								trustee && !isTrusteeValid
									? 'Please enter a valid Ethereum address'
									: undefined
							}
							classNames={{
								base: 'w-full',
								label: 'text-base font-medium mb-4',
								input: 'text-base',
								inputWrapper: 'h-14 px-4 py-3'
							}}
						/>
					</div>

					<div>
						<Input
							label='Expiration Time (Unix Timestamp)'
							placeholder='0'
							labelPlacement='outside'
							value={expirationTime}
							onValueChange={setExpirationTime}
							variant='bordered'
							type='number'
							size='lg'
							isRequired
							color={
								expirationTime && !isExpirationTimeValid ? 'danger' : 'default'
							}
							errorMessage={
								expirationTime && !isExpirationTimeValid
									? 'Please enter a valid Unix timestamp'
									: undefined
							}
							classNames={{
								base: 'w-full',
								label: 'text-base font-medium mb-4',
								input: 'text-base',
								inputWrapper: 'h-14 px-4 py-3'
							}}
						/>
					</div>

					<div className='pt-4'>
						<Button
							type='submit'
							color='primary'
							variant='solid'
							size='lg'
							isDisabled={!isFormValid || mutation.isPending}
							className='h-12 w-full text-base font-medium'
						>
							{mutation.isPending
								? 'Validating...'
								: 'Validate Trust Connection'}
						</Button>
					</div>
				</form>
			</Card>

			{mutation.isPending ? (
				<div className='flex justify-center'>
					<Loader />
				</div>
			) : null}

			{mutation.isError ? (
				<Card className='mb-6 max-w-2xl rounded-lg border border-danger bg-white p-6 shadow-sm'>
					<h2 className='mb-2 text-xl font-bold text-danger'>Error</h2>
					<p className='text-danger'>{mutation.error.message}</p>
				</Card>
			) : null}

			{mutation.isSuccess ? (
				<Card className='max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
					<div className='mb-6 flex items-center justify-between'>
						<h2 className='text-2xl font-bold text-gray-900'>
							Validation Result
						</h2>
						<Chip
							color={
								mutation.data.overall_danger_score < LOW_DANGER_THRESHOLD
									? 'success'
									: (mutation.data.overall_danger_score < MEDIUM_DANGER_THRESHOLD
										? 'warning'
										: 'danger')
							}
							variant='flat'
							size='sm'
						>
							Danger Score:{' '}
							{mutation.data.overall_danger_score.toFixed(DECIMAL_PLACES)}
						</Chip>
					</div>

					<div className='mb-6 rounded-md bg-gray-50 p-4'>
						<p className='text-sm text-gray-700'>
							Danger score is an indicator between 0 and 1 that expresses how
							risky a new trust connection is perceived by a trained Machine
							Learning classifier. Danger scores lower than 0.25 are generally
							regarded as safe.
						</p>
					</div>

					<div className='grid gap-6 md:grid-cols-2'>
						{/* Left Column */}
						<div className='space-y-4'>
							<div>
								<div className='block text-sm font-medium text-gray-700'>
									Validation ID
								</div>
								<div className='mt-1 text-sm text-gray-900'>
									{mutation.data.validation_id}
								</div>
							</div>

							<div>
								<div className='block text-sm font-medium text-gray-700'>
									Overall Danger Score
								</div>
								<div className='mt-1 text-sm text-gray-900'>
									{mutation.data.overall_danger_score.toFixed(DECIMAL_PLACES)}
								</div>
							</div>
						</div>

						{/* Right Column */}
						<div className='space-y-4'>
							<div>
								<div className='block text-sm font-medium text-gray-700'>
									Truster
								</div>
								<div className='mt-1'>
									<AvatarAddress address={truster} />
								</div>
							</div>

							<div>
								<div className='block text-sm font-medium text-gray-700'>
									Trustee
								</div>
								<div className='mt-1'>
									<AvatarAddress address={trustee} />
								</div>
							</div>
						</div>
					</div>

					<div className='mt-6 space-y-4'>
						<div>
							<div className='block text-sm font-medium text-gray-700'>
								TL;DR
							</div>
							<div className='mt-1 text-sm text-gray-900'>
								{mutation.data.tldr}
							</div>
						</div>

						<div>
							<div className='block text-sm font-medium text-gray-700'>
								Summary
							</div>
							<div className='mt-1 text-sm text-gray-900'>
								{mutation.data.summary}
							</div>
						</div>
					</div>
				</Card>
			) : null}
		</div>
	)
}
