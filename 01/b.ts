import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

const calories = [0]
let index = 0
for (const line of lines) {
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
console.log(calories[0] + calories[1] + calories[2])
