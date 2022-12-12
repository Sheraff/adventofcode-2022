import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"
import aStar, { Cell } from "./a-star"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})

let end: Cell | null = null
const matrix = input
	.split("\n")
	.map((line, y) => line
		.split("")
		.map((c, x) => {
			const elevation = c === "S"
				? 1
				: c === "E"
					? 26
					: parseInt(c, 36) - 9
			const cell = {
				elevation,
				x,
				y,
			}
			if (c === "E") end = cell
			return cell
		})
	)

if (!end) throw new Error("No start or end")

let minLength = Infinity
for (const line of matrix) {
	for (const cell of line) {
		if (cell.elevation === 1) {
			const path = aStar(matrix, cell, end)
			if (!path) continue
			if (path.length < minLength) {
				minLength = path.length
			}
		}
	}
}

console.log(minLength - 1)




