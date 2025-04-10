import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'

import LoadingOrError from 'components/LoadingOrError'
import { Header } from 'layout/Header'

const MainPage = lazy(async () => import('pages/Main/Main'))
const AvatarPage = lazy(async () => import('pages/Avatar/Avatar'))

export default function App(): ReactElement {
	return (
		<BrowserRouter>
			<Suspense fallback={<LoadingOrError />}>
				<Header />

				<div className='m-auto max-w-[1300px]'>
					<Routes>
						<Route path='/' element={<MainPage />} />
						<Route
							path='/avatar/:address'
							element={<Navigate to='events' replace />}
						/>
						<Route path='/avatar/:address/:tab' element={<AvatarPage />} />
					</Routes>
				</div>
			</Suspense>
		</BrowserRouter>
	)
}
