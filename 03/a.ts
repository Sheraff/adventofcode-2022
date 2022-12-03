import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

void async function () {
	let sumPriorities = 0
	for await (const line of rl) {
		const half = line.slice(line.length / 2)
		let i = 0
		for (; i < half.length; i++) {
			if (half.includes(line[i]!)) break
		}
		const priority = letterToPriority(line[i]!)
		sumPriorities += priority
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
