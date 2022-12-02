import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

const calories = [0]
let index = 0
let max = 0
let maxIndex = 0
for (const line of lines) {
	if (!line) {
		const current = calories[index]
		if (typeof current === "undefined") {
			throw new Error('wrong input')
		}
		if (current > max) {
			max = current
			maxIndex = index
		}
		index++
		calories[index] = 0
		continue
	} else {
		const cals = Number(line)
		calories[index] += cals
		continue
	}
}

console.log({max, maxIndex})
