import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

const table = lines.map(line => line.split("").map(Number))

let best = -1

for (let row = 1; row < table.length - 1; row++) {
	for (let col = 1; col < table[row]!.length - 1; col++) {
		const score = scoreTree(row, col)
		if (score > best) {
			best = score
		}
	}
}

console.log({best})

function scoreTree(row: number, col: number) {
	const max = table[row]![col]!

	// view to the left
	let left = 0
	for (let x = col - 1; x >= 0; x--) {
		const cell = table[row]![x]!
		if (cell < max) {
			left++
		}
		if (cell >= max) {
			left++
			break
		}
	}

	// view to the right
	let right = 0
	for (let x = col + 1; x < table[row]!.length; x++) {
		const cell = table[row]![x]!
		if (cell < max) {
			right++
		}
		if (cell >= max) {
			right++
			break
		}
	}

	// view to the top
	let top = 0
	for (let y = row - 1; y >= 0; y--) {
		const cell = table[y]![col]!
		if (cell < max) {
			top++
		}
		if (cell >= max) {
			top++
			break
		}
	}

	// view to the bottom
	let bottom = 0
	for (let y = row + 1; y < table.length; y++) {
		const cell = table[y]![col]!
		if (cell < max) {
			bottom++
		}
		if (cell >= max) {
			bottom++
			break
		}
	}

	return left * right * top * bottom
}

