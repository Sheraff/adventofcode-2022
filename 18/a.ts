import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

declare global {
	interface Array<T> {
		findLastIndex(
			predicate: (value: T, index: number, obj: T[]) => unknown,
			thisArg?: any
		): number
	}
}

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")


const set = new Set<string>(lines)

let freeSides = 0

for (const line of set) {
	const [x, y, z] = line.split(",").map(Number) as [number, number, number]
	const neighbors = [
		[x + 1, y, z],
		[x - 1, y, z],
		[x, y + 1, z],
		[x, y - 1, z],
		[x, y, z + 1],
		[x, y, z - 1],
	]
	for (const neighbor of neighbors) {
		if (!set.has(neighbor.join(","))) {
			freeSides++
		}
	}
}

console.log(freeSides)