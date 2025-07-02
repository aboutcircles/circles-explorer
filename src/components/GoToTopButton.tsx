import { useCallback, useEffect, useState } from 'react'

const DEFAULT_THRESHOLD = 200
const SCROLL_DEBOUNCE_DELAY = 100

interface GoToTopButtonProperties {
	className: string
	threshold: number
}

const scrollToTop = () => {
	window.scrollTo({
		top: 0,
		behavior: 'smooth'
	})
}

export function GoToTopButton({
	className = '',
	threshold = DEFAULT_THRESHOLD
}: GoToTopButtonProperties) {
	const [isVisible, setIsVisible] = useState(false)

	const toggleVisibility = useCallback(() => {
		if (window.pageYOffset > threshold) {
			setIsVisible(true)
		} else {
			setIsVisible(false)
		}
	}, [threshold])

	useEffect(() => {
		let timeoutId: NodeJS.Timeout

		const handleScroll = () => {
			// Clear existing timeout to debounce scroll events
			clearTimeout(timeoutId)

			timeoutId = setTimeout(toggleVisibility, SCROLL_DEBOUNCE_DELAY)
		}

		window.addEventListener('scroll', handleScroll)

		return () => {
			window.removeEventListener('scroll', handleScroll)
			clearTimeout(timeoutId)
		}
	}, [toggleVisibility])

	if (!isVisible) {
		return null
	}

	return (
		<button
			type='button'
			onClick={scrollToTop}
			className={`
				animate-fade-in fixed bottom-6 right-6
				z-50 flex 
				h-12 w-12 
				transform items-center 
				justify-center rounded-full bg-blue-600
				text-white shadow-lg
				transition-all duration-300 ease-in-out
				hover:scale-110 hover:bg-blue-700
				hover:shadow-xl
				focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
				${className}
			`}
			aria-label='Go to top'
			title='Go to top'
		>
			<svg
				className='h-6 w-6'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
				xmlns='http://www.w3.org/2000/svg'
			>
				<path
					strokeLinecap='round'
					strokeLinejoin='round'
					strokeWidth={2}
					d='M5 10l7-7m0 0l7 7m-7-7v18'
				/>
			</svg>
		</button>
	)
}
