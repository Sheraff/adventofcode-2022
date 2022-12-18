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

// add 1 to avoid being blocked by points on the edge
const droplets = lines.map(line => line.split(",").map(a => Number(a) + 1) as [number, number, number])

const matrix: number[][][] = []
let max = 0
for (const point of droplets) {
	const [x, y, z] = point
	if (!matrix[x]) {
		matrix[x] = []
	}
	if (!matrix[x]![y]) {
		matrix[x]![y] = []
	}
	matrix[x]![y]![z] = 1
	max = Math.max(max, x, y, z)
}
// add 1 to avoid being blocked by points on the edge
max += 1
for (let x = 0; x <= max; x++) {
	if (!matrix[x]) matrix[x] = []
	for (let y = 0; y <= max; y++) {
		if (!matrix[x]![y]) matrix[x]![y] = []
		for (let z = 0; z <= max; z++) {
			if (!matrix[x]![y]![z]) {
				matrix[x]![y]![z] = 0
			}
		}
	}
}

const freeAir = walkAllFreeAir()

let freeSides = 0
for (const point of droplets) {
	const [x, y, z] = point
	const neighbors = findFreeNeighbors([x, y, z])
	neighbors.forEach(point => {
		const key = point.join(",")
		if (freeAir.has(key)) {
			freeSides++
		}
	})
}

console.log({freeSides})

function walkAllFreeAir() {
	const starting = [
		[0, 0, 0],
	] as const
	const freeAir = new Set<string>(starting.map(p => p.join(",")))
	const justAdded = new Set<readonly [number, number, number]>(starting)
	while (justAdded.size) {
		justAdded.forEach((point) => {
			const freeNeighbors = findFreeNeighbors(point)
			freeNeighbors.forEach((point) => {
				const key = point.join(",")
				if (!freeAir.has(key)) {
					freeAir.add(key)
					justAdded.add(point)
				}
			})
			justAdded.delete(point)
		})
	}
	return freeAir
}

function findFreeNeighbors(point: readonly [number, number, number]) {
	const [x, y, z] = point
	const neighbors = [
		[x + 1, y, z],
		[x - 1, y, z],
		[x, y + 1, z],
		[x, y - 1, z],
		[x, y, z + 1],
		[x, y, z - 1],
	] as const
	const free = neighbors.filter(([x, y, z]) => matrix[x]?.[y]?.[z] === 0)
	return free
}