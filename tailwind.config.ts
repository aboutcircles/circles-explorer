// eslint-disable-next-line import/no-extraneous-dependencies
import defaultConfig from 'tailwindcss/defaultConfig'
// eslint-disable-next-line import/no-extraneous-dependencies
import formsPlugin from '@tailwindcss/forms'

/** @type {import('tailwindcss/types').Config} */
const config = {
	content: ['index.html', 'src/**/*.tsx'],
	theme: {
		fontFamily: {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			sans: ['Inter', ...defaultConfig.theme.fontFamily.sans]
		}
	},
	experimental: { optimizeUniversalDefaults: true },
	plugins: [formsPlugin]
}

export default config
