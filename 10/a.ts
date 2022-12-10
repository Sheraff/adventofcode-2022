import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

const INTERESTING_CYCLES = [20, 60, 100, 140, 180, 220]

const OPERATIONS = {
	noop: 1,
	addx: 2,
} as const

void async function () {
	let cycle = 0
	let register = 1
	let sum = 0
	for await (const line of rl) {
		const parts = line.split(" ")
		const operation = parts[0] as keyof typeof OPERATIONS
		cycle += OPERATIONS[operation]

		if (cycle >= INTERESTING_CYCLES[0]!) {
			const mul = INTERESTING_CYCLES.shift()
			sum += register * mul!
			if (INTERESTING_CYCLES.length === 0) {
				break
			}
		}

		if (operation === "addx") {
			const value = Number(parts[1])
			register += value
		}
	}
	console.log({sum})
}()

