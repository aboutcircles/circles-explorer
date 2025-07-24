import { Tab, Tabs } from '@nextui-org/react'
import type { ReactElement } from 'react'
import { useParams } from 'react-router-dom'

import LoadingOrError from 'components/LoadingOrError'
import useBreakpoint from 'hooks/useBreakpoint'
import { useTransactionEvents } from 'hooks/useTransactionEvents'

import { TransactionEventCards } from './TransactionEventCards'
import { TransactionEventsTable } from './TransactionEventsTable'
import { TransactionHeader } from './TransactionHeader'

export default function Transaction(): ReactElement {
	const { txHash } = useParams<{ txHash: string }>()
	const { transactionData, isLoading } = useTransactionEvents(txHash ?? '')
	const { isSmScreen } = useBreakpoint()

	if (isLoading) {
		return <LoadingOrError />
	}

	if (!transactionData) {
		return (
			<div className='flex min-h-[400px] items-center justify-center'>
				<div className='text-center'>
					<h2 className='mb-2 text-xl font-semibold'>Transaction Not Found</h2>
					<p className='text-gray-600'>
						No events found for transaction hash: {txHash}
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className='mx-auto max-w-7xl px-4 py-6'>
			<TransactionHeader metadata={transactionData.metadata} />

			<div className='mt-8'>
				<Tabs
					aria-label='Transaction details'
					variant='underlined'
					classNames={{
						tabList:
							'gap-6 w-full relative rounded-none p-0 border-b border-divider',
						cursor: 'w-full bg-primary',
						tab: 'max-w-fit px-0 h-12',
						tabContent: 'group-data-[selected=true]:text-primary'
					}}
				>
					<Tab key='events' title='Events'>
						<div className='mt-6'>
							{isSmScreen ? (
								<TransactionEventCards events={transactionData.events} />
							) : (
								<TransactionEventsTable events={transactionData.events} />
							)}
						</div>
					</Tab>

					<Tab key='sankey' title='Flow Diagram'>
						<div className='mt-6'>
							<div className='flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300'>
								<div className='text-center'>
									<h3 className='mb-2 text-lg font-medium text-gray-900'>
										Sankey Diagram
									</h3>
									<p className='text-gray-500'>Coming soon...</p>
								</div>
							</div>
						</div>
					</Tab>

					<Tab key='trust-graph' title='Trust Graph'>
						<div className='mt-6'>
							<div className='flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300'>
								<div className='text-center'>
									<h3 className='mb-2 text-lg font-medium text-gray-900'>
										Trust Graph
									</h3>
									<p className='text-gray-500'>Coming soon...</p>
								</div>
							</div>
						</div>
					</Tab>
				</Tabs>
			</div>
		</div>
	)
}
