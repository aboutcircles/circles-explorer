import App from 'App'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextUIProvider } from '@nextui-org/react'
import { CirclesSdkProvider } from 'providers/CirclesSdkProvider'
import { registerSW } from 'virtual:pwa-register'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { http, createConfig, WagmiProvider } from 'wagmi'
import { gnosis, gnosisChiado } from 'wagmi/chains'

import './index.css'

dayjs.extend(relativeTime)
registerSW()

export const config = createConfig({
	chains: [gnosis, gnosisChiado],
	transports: {
		[gnosis.id]: http(),
		[gnosisChiado.id]: http()
	}
})

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
			<WagmiProvider config={config}>
				<CirclesSdkProvider>
					<QueryClientProvider client={queryClient}>
						<NextUIProvider>
							<App />
						</NextUIProvider>
					</QueryClientProvider>
				</CirclesSdkProvider>
			</WagmiProvider>
		</StrictMode>
	)
}
