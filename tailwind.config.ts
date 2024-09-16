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
	plugins: [formsPlugin, nextui()]
}

export default config
