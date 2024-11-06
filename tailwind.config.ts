import defaultConfig from 'tailwindcss/defaultConfig'
import formsPlugin from '@tailwindcss/forms'
import { nextui } from '@nextui-org/react'

/** @type {import('tailwindcss/types').Config} */
const config = {
	content: [
		'index.html',
		'src/**/*.tsx',
		'node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'
	],
	theme: {
		fontFamily: {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			sans: ['Inter', ...defaultConfig.theme.fontFamily.sans]
		}
	},
	experimental: { optimizeUniversalDefaults: true },
	darkMode: 'class',
	plugins: [
		formsPlugin,
		nextui({
			addCommonColors: true,
			themes: {
				light: {
					colors: {
						background: '#FFFFFF', // or DEFAULT
						foreground: '#11181C', // or 50 to 900 DEFAULT
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-expect-error
						border: '#D1D5DB',
						icon: '#1F2937',
						primary: {
							foreground: '#FFFFFF',
							DEFAULT: '#38318B'
						},
						secondary: {
							foreground: '#FFFFFF',
							DEFAULT: '#DF6552'
						},

						grayText: 'rgba(31, 41, 55, 1)'
						// ... rest of the colors
					}
				},
				dark: {
					colors: {
						background: '#050b15', // or DEFAULT
						foreground: '#ECEDEE', // or 50 to 900 DEFAULT
						primary: {
							foreground: '#FFFFFF',
							DEFAULT: '#006FEE'
						},
						secondary: {}
					}
				}
			}
		})
	]
}

export default config
