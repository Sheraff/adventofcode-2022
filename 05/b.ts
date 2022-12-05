import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

void async function () {
	let mode: "stack" | "move" | "skip" = "stack"
	const stacks: string[][] = []
	for await (const line of rl) {
		if (mode === "stack") {
			for (let i = 1, j = 0; i < line.length; i += 4, j++) {
				const char = line[i]
				if (stacks[j] === undefined) {
					stacks[j] = []
				}
				if (char !== " " && !isNaN(Number(char))) {
					mode = "skip"
					break
				}
				if (char !== " ") {
					stacks[j]!.unshift(char!)
				}
			}
		} else if (mode === "skip") {
			mode = "move"
			continue
		} else {
			const match = line.match(/^move ([0-9]+) from ([0-9]+) to ([0-9]+)/)
			if (!match) {
				throw new Error('invalid input')
			}
			const count = Number(match[1])
			const from = Number(match[2]) - 1
			const to = Number(match[3]) - 1

			const moved = stacks[from]!.splice(stacks[from]!.length - count, count)
			stacks[to]!.push(...moved)
		}
	}
	const topOfStacks = stacks.map(stack => stack.at(-1)).join('')
	console.log({topOfStacks})
}()

