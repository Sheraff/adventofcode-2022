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
const chars = input.split("")

const WIDTH = 7
const ROCKS = 2022

const shapes = [
	[[1, 1, 1, 1]],

	[
		[0, 1, 0],
		[1, 1, 1],
		[0, 1, 0],
	],

	[
		[1, 1, 1],
		[0, 0, 1],
		[0, 0, 1],
	],

	[
		[1],
		[1],
		[1],
		[1],
	],

	[
		[1, 1],
		[1, 1],
	],
]

const grid: number[][] = []

let base = 0
let max = 0
let jetIndex = 0
for (let i = 0; i < ROCKS; i++) {
	const shape = shapes[i % shapes.length]!
	let x = 2
	let y = max + 3
	const width = Math.max(...shape.map(l => l.length))
	let resting = false

	drawState(grid, shape, x, y)
	while (!resting) {
		wind: {
			const jetDirection = chars[jetIndex % chars.length] === "<" ? -1 : 1
			jetIndex++

			// test collisions
			if (x + jetDirection < 0) {
				// left wall
				break wind
			}
			if (x + jetDirection + width > WIDTH) {
				// right wall
				break wind
			}
			for (let ry = 0; ry < shape.length; ry++) {
				const shapeRow = shape[ry]!
				const shapeRowY = y + ry
				// left rock
				const shapeRowLeftX = x + shapeRow.indexOf(1)
				if (grid[shapeRowY]?.[shapeRowLeftX + jetDirection] === 1) {
					break wind
				}
				// right rock
				const shapeRowRightX = x + shapeRow.lastIndexOf(1)
				if (grid[shapeRowY]?.[shapeRowRightX + jetDirection] === 1) {
					break wind
				}
			}
			x += jetDirection
			drawState(grid, shape, x, y)
		}
		gravity: {
			if (y === 0) {
				resting = true
				break gravity
			}
			for (let ry = y; ry < shape.length + y; ry++) {
				const row = shape[ry - y]!
				for (let rx = x; rx < row.length + x; rx++) {
					const cell = row[rx - x]!
					if (cell === 1) {
						const gridCell = grid[ry - 1]?.[rx]
						if (gridCell === 1) {
							resting = true
							break gravity
						}
					}
				}
			}
			y -= 1
			drawState(grid, shape, x, y)
		}
	}

	// add rock to grid
	for (let ry = y; ry < shape.length + y; ry++) {
		const row = shape[ry - y]!
		for (let rx = x; rx < row.length + x; rx++) {
			const cell = row[rx - x]!
			if (cell === 1) {
				if (!grid[ry]) grid[ry] = []
				grid[ry]![rx] = 1
			}
		}
	}
	drawState(grid)

	// readjust max
	max = grid.findLastIndex(l => l.some(c => c === 1)) + 1
}
console.log({max})

function drawState(grid: number[][], rock?: number[][], x?: number, y?: number) {
	return
	const displayMatrix = []

	for (let y = 0; y < grid.length; y++) {
		const row = grid[y]
		displayMatrix.push(new Array(WIDTH).fill('.'))
		if (!row) continue
		for (let x = 0; x < WIDTH; x++) {
			if (row[x] === 1) {
				displayMatrix.at(-1)![x] = '#'
			}
		}
	}

	if (rock && x !== undefined && y !== undefined) {
		while (displayMatrix.length <= y + rock.length - 1) {
			displayMatrix.push(new Array(WIDTH).fill('.'))
		}
		for (let ry = y; ry < rock.length + y; ry++) {
			const row = rock[ry - y]!
			for (let rx = x; rx < row.length + x; rx++) {
				const cell = row[rx - x]!
				if (cell === 1) {
					displayMatrix[ry]![rx] = '@'
				}
			}
		}
	}


	displayMatrix.unshift(new Array(WIDTH).fill('-'))
	displayMatrix.reverse()

	console.log("\n" + displayMatrix.map(l => l.join("")).join("\n"))
}