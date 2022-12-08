import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

const table = lines.map(line => line.split("").map(Number))
const visible = new Set<string>()

// from the left
for (let y = 0; y < table.length; y++) {
	const row = table[y]!
	let max = -1
	for (let x = 0; x < row.length; x++) {
		const cell = row[x]!
		if (cell > max) {
			max = cell
			visible.add(`${x},${y}`)
		}
	}
}

// from the right
for (let y = 0; y < table.length; y++) {
	const row = table[y]!
	let max = -1
	for (let x = row.length - 1; x >= 0; x--) {
		const cell = row[x]!
		if (cell > max) {
			max = cell
			visible.add(`${x},${y}`)
		}
	}
}

// from the top
for (let x = 0; x < table[0]!.length; x++) {
	let max = -1
	for (let y = 0; y < table.length; y++) {
		const cell = table[y]![x]!
		if (cell > max) {
			max = cell
			visible.add(`${x},${y}`)
		}
	}
}

// from the bottom
for (let x = 0; x < table[0]!.length; x++) {
	let max = -1
	for (let y = table.length - 1; y >= 0; y--) {
		const cell = table[y]![x]!
		if (cell > max) {
			max = cell
			visible.add(`${x},${y}`)
		}
	}
}

console.log({visible: visible.size})
