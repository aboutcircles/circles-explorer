// could send logs to log service
export default {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	log(...arguments_: unknown[]): void {
		if (import.meta.env.VITE_LOG_LEVEL === 'info') {
			console.log(...arguments_)
		}
	},
	error(...arguments_: unknown[]): void {
		console.error(...arguments_)
	},
	critical(error: string, scope: string): void {
		console.error(error, scope)
	},
	warn(...arguments_: unknown[]): void {
		console.warn(...arguments_)
	}
}
