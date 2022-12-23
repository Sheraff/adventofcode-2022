import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})

const directions = [
	[0, -1],
	[0, 1],
	[-1, 0],
	[1, 0],
] as [number, number][]

const checks = new Map([
	[directions[0], [[-1, -1], [0, -1], [1, -1]] as [number, number][]],
	[directions[1], [[-1, 1],  [0, 1],  [1, 1] ] as [number, number][]],
	[directions[2], [[-1, -1], [-1, 0], [-1, 1]] as [number, number][]],
	[directions[3], [[1, -1],  [1, 0],  [1, 1] ] as [number, number][]],
])

const around = [
	[-1, -1],
	[-1, 0],
	[-1, 1],
	[0, -1],
	[0, 1],
	[1, -1],
	[1, 0],
	[1, 1],
] as const

const grid = input.split("\n").map(line => line.split(''))

const countElvesBefore = grid.reduce((count, line) => count + line.filter(char => char === '#').length, 0)

let round = 0
while (true) {
	round++
	const moves = new Map<`${number},${number}`, {count: number, elf: [number, number], destination: [number, number]}>()

	for (let y = 0; y < grid.length; y++) {
		for (let x = 0; x < grid[0]!.length; x++) {
			const char = grid[y]![x]!
			if (char !== '#') {
				continue
			}

			if (around.every(([dx, dy]) => grid[y + dy]?.[x + dx] !== '#')) {
				continue
			}

			let direction: typeof directions[number] | undefined
			for (let d = 0; d < directions.length; d++) {
				const dir = directions[d]!
				const check = checks.get(dir)!
				if (check.every(([dx, dy]) => grid[y + dy]?.[x + dx] !== '#')) {
					direction = dir
					break
				}
			}
			if (!direction) {
				continue
			}

			const key: `${number},${number}` = `${x + direction[0]},${y + direction[1]}`
			const move = moves.get(key)
			if (!move) {
				moves.set(key, {
					count: 1,
					elf: [x, y],
					destination: [x + direction[0], y + direction[1]],
				})
			} else {
				move.count++
			}
		}
	}

	if (moves.size === 0) {
		break
	}

	// move elves
	let offsetX = 0
	let offsetY = 0
	for (const move of moves.values()) {
		if (move.count > 1) {
			continue
		}
		const [x, y] = move.elf
		const [dx, dy] = move.destination
		grid[y + offsetY]![x + offsetX] = '.'
		if (dy + offsetY < 0) {
			grid.unshift([])
			offsetY++
		}
		if (!grid[dy + offsetY]) {
			grid[dy + offsetY] = []
		}
		if (dx + offsetX < 0) {
			grid.forEach(line => {
				line.unshift('.')
			})
			offsetX++
		}
		grid[dy + offsetY]![dx + offsetX] = '#'
	}

	// readjust grid
	if (grid[0]!.every(char => char !== '#')) {
		grid.shift()
	}
	if (grid[grid.length - 1]!.every(char => char !== '#')) {
		grid.pop()
	}
	const maxX = grid.reduce((max, line) => Math.max(max, line.length - 1), 0)
	grid.forEach(line => line.length = maxX + 1)
	if (grid.every(line => line[maxX] !== '#')) {
		grid.forEach(line => line.length = maxX)
	}
	if (grid.every(line => line[0] !== '#')) {
		grid.forEach(line => line.shift())
	}

	// rotate directions
	const first = directions.shift()!
	directions.push(first)
}

const maxX = grid.reduce((max, line) => Math.max(max, line.length - 1), 0)

// fill empty space
for (const line of grid) {
	for (let x = 0; x <= maxX; x++) {
		if (!line[x]) {
			line[x] = '.'
		}
	}
}

console.log(grid.map(line => line.join('')).join('\n'))

// compute empty space
const countElvesAfter = grid.reduce((count, line) => count + line.filter(char => char === '#').length, 0)
console.log({round, countElvesBefore, countElvesAfter})
