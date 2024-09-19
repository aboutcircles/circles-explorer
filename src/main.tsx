import App from 'App'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextUIProvider } from '@nextui-org/react'
import { CirclesSdkProvider } from 'providers/CirclesSdkProvider'
import { registerSW } from 'virtual:pwa-register'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import './index.css'

dayjs.extend(relativeTime)
registerSW()

const MAX_RETRIES = 1
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: Number.POSITIVE_INFINITY,
			retry: MAX_RETRIES
		}
	}
})

const container = document.querySelector('#root')
if (container) {
	const root = createRoot(container)
	root.render(
		<StrictMode>
			<CirclesSdkProvider>
				<QueryClientProvider client={queryClient}>
					<NextUIProvider>
						<App />
					</NextUIProvider>
				</QueryClientProvider>
			</CirclesSdkProvider>
		</StrictMode>
	)
}
