// could send logs to log service
export default {
	log(...arguments_: unknown[]): void {
		console.log(...arguments_)
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
