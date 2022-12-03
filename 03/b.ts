import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

void async function () {
	let sumPriorities = 0
	const group: string[] = []
	for await (const line of rl) {
		group.push(line)
		if (group.length < 3) continue

		const a = new Set(group[0]!.split(''))
		const b = new Set(group[1]!.split(''))
		const c = new Set(group[2]!.split(''))

		let badge: string | null = null
		for (const char of a.values()) {
			if (b.has(char) && c.has(char)) {
				badge = char
				break
			}
		}
		if (!badge) throw new Error('error in my logic')

		sumPriorities += letterToPriority(badge)
		group.length = 0
	}
	console.log({sumPriorities})
}()

function letterToPriority(char: string) {
	const code = char.charCodeAt(0)
	if (code >= 97)
		return code - 97 + 1
	if (code >= 65)
		return code - 65 + 27
	throw new Error('char input is not a-zA-Z')
}