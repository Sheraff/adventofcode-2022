import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

const OPERATION_DURATION = {
	noop: 1,
	addx: 2,
} as const

void async function () {
	let cycle = 0
	let register = 0
	const crt: string[][] = []
	for await (const line of rl) {
		const parts = line.split(" ")
		const operation = parts[0] as keyof typeof OPERATION_DURATION
		const duration = OPERATION_DURATION[operation]

		for (let i = 0; i < duration; i++) {
			if (cycle % 40 === 0) {
				crt.push([])
			}
			const nextPixel = crt.at(-1)!.length
			const char = nextPixel >= register && nextPixel < register + 3
				? "█"
				: " "
			crt.at(-1)!.push(char)
			cycle++
		}

		if (operation === "addx") {
			const value = Number(parts[1])
			register += value
		}
	}
	const display = crt.map(line => line.join("")).join("\n")
	console.log(display)
}()
