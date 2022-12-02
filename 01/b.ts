import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

void async function () {
	const calories = [0]
	let index = 0
	for await (const line of rl) {
		if (!line) {
			index++
			calories[index] = 0
			continue
		} else {
			const cals = Number(line)
			calories[index] += cals
			continue
		}
	}
	calories.sort((a, b) => b - a)
	if (index < 2) {
		throw new Error('wront input size')
	}
	console.log(calories[0]! + calories[1]! + calories[2]!)
}()

