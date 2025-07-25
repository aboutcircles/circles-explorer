import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import LoadingOrError from 'components/LoadingOrError'
import { Header } from 'layout/Header'

const MainPage = lazy(async () => import('pages/Main/Main'))
const AvatarPage = lazy(async () => import('pages/Avatar/Avatar'))
const TransactionPage = lazy(
	async () => import('pages/Transaction/Transaction')
)

export default function App(): ReactElement {
	return (
		<BrowserRouter>
			<Suspense fallback={<LoadingOrError />}>
				<Header />

				<div className='m-auto max-w-[1350px]'>
					<Routes>
						<Route path='/' element={<MainPage />} />
						<Route
							path='/avatar/:address'
							element={<Navigate to='events' replace />}
						/>
						<Route path='/avatar/:address/:tab' element={<AvatarPage />} />
						<Route path='/tx/:txHash' element={<TransactionPage />} />
					</Routes>
				</div>
			</Suspense>
		</BrowserRouter>
	)
}
