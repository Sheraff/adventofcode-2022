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
const ROCKS = 1_000_000_000_000

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

let grid: number[][] = []

type State = {
	gridString: string,
	rockIndexAdd: number,
	jetIndexAdd: number,
	maxAdd: number,
	baseAdd: number,
	nextKey: string,
}
const memoized = new Map<string, State>()
let fullCycle: State & {key: string, iAdd: number} | undefined

let base = 0
let max = 0
let rockIndex = 0
let jetIndex = 0
for (let i = 0; i < ROCKS; i++) {
	const initialJetI = jetIndex
	const initialMax = max
	const initialBase = base
	const initialGridString = JSON.stringify(grid)
	const key = `${rockIndex % shapes.length}#${initialJetI % chars.length}#${initialGridString}`
	let memo = memoized.get(key)
	if (memo) {
		let gridString: string
		const beforeI = i
		console.log('in memo', i)
		do {
			const {rockIndexAdd, jetIndexAdd, maxAdd, baseAdd, nextKey} = memo
			gridString = memo.gridString
			rockIndex += rockIndexAdd
			jetIndex += jetIndexAdd
			max += maxAdd
			base += baseAdd
			if (fullCycle && fullCycle.key === nextKey && i + fullCycle.iAdd < ROCKS) {
				memo = fullCycle
				i += fullCycle.iAdd
			} else {
				memo = memoized.get(nextKey)
				if (memo) {
					i++
				}
			}
			if (i % 10_000_000 === 0) console.log(ROCKS - i)
		} while (memo && i < ROCKS)
		grid = JSON.parse(gridString) as number[][]
		console.log('from memo', memoized.size, `skip ${i - beforeI}`)
		continue
	}

	const rockI = rockIndex % shapes.length
	rockIndex++
	const shape = shapes[rockI]!
	let x = 2
	let y = max + 3
	const width = Math.max(...shape.map(l => l.length))
	let resting = false

	// drawState(i, grid, base, shape, x, y)
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
				if (grid[shapeRowY - base]?.[shapeRowLeftX + jetDirection] === 1) {
					break wind
				}
				// right rock
				const shapeRowRightX = x + shapeRow.lastIndexOf(1)
				if (grid[shapeRowY - base]?.[shapeRowRightX + jetDirection] === 1) {
					break wind
				}
			}
			x += jetDirection
			// drawState(i, grid, base, shape, x, y)
		}
		gravity: {
			if (y <= base) {
				resting = true
				break gravity
			}
			for (let ry = y; ry < shape.length + y; ry++) {
				const row = shape[ry - y]!
				for (let rx = x; rx < row.length + x; rx++) {
					const cell = row[rx - x]!
					if (cell === 1) {
						const gridCell = grid[ry - 1 - base]?.[rx]
						if (gridCell === 1) {
							resting = true
							break gravity
						}
					}
				}
			}
			y -= 1
			// drawState(i, grid, base, shape, x, y)
		}
	}

	// add rock to grid
	for (let ry = y; ry < shape.length + y; ry++) {
		const row = shape[ry - y]!
		for (let rx = x; rx < row.length + x; rx++) {
			const cell = row[rx - x]!
			if (cell === 1) {
				if (!grid[ry - base]) grid[ry - base] = []
				grid[ry - base]![rx] = 1
			}
		}
	}

	// readjust max
	max = grid.findLastIndex(l => new Array(WIDTH).fill(1).some((_, i) => l[i] === 1)) + 1 + base

	// readjust base
	const highestFullRow = grid.findLastIndex((l, _y) => {
		if (l[0] !== 1) return false
		let y = _y
		for (let x = 1; x < WIDTH; x++) {
			if (grid[y]![x] === 1) continue
			if (!grid[y + 1]) return false
			y += 1
			if (x <= 0 || grid[y]![x - 1] !== 1) return false
			x -= 2
		}
		return true
	})
	if (highestFullRow >= 0) {
		base += highestFullRow + 1
		grid.splice(0, highestFullRow + 1)
	}

	// memoize
	const rockIndexAdd = 1
	const jetIndexAdd = jetIndex - initialJetI
	const gridString = JSON.stringify(grid)
	const maxAdd = max - initialMax
	const baseAdd = base - initialBase
	const nextKey = `${rockIndex % shapes.length}#${jetIndex % chars.length}#${gridString}`
	memoized.set(key, {gridString, rockIndexAdd, jetIndexAdd, maxAdd, baseAdd, nextKey})

	// compute full cycle
	let rockIndexAddTotal = rockIndexAdd
	let jetIndexAddTotal = jetIndexAdd
	let maxAddTotal = maxAdd
	let baseAddTotal = baseAdd
	let nextKeyCycle = nextKey
	let memoCycle = memoized.get(nextKeyCycle)
	let iAdd = 1
	while (memoCycle && nextKeyCycle !== key) {
		rockIndexAddTotal += memoCycle.rockIndexAdd
		jetIndexAddTotal += memoCycle.jetIndexAdd
		maxAddTotal += memoCycle.maxAdd
		baseAddTotal += memoCycle.baseAdd
		nextKeyCycle = memoCycle.nextKey
		memoCycle = memoized.get(nextKeyCycle)
		iAdd++
	}
	if (nextKeyCycle === key) {
		console.log(`cycle found, length: ${iAdd}`)
		fullCycle = {
			rockIndexAdd: rockIndexAddTotal,
			jetIndexAdd: jetIndexAddTotal,
			maxAdd: maxAddTotal,
			baseAdd: baseAddTotal,
			iAdd,
			key,
			gridString: initialGridString,
			nextKey: key,
		}
		console.log(fullCycle)
	}
}

console.log({max})

function drawState(i: number, grid: number[][], base: number, rock?: number[][], x?: number, y?: number) {
	// return
	const displayMatrix = []

	for (let y = 0; y < grid.length + base; y++) {
		const row = grid[y - base]
		displayMatrix.push(new Array(WIDTH).fill('.'))
		if (!row) {
			if (y - base < 0) {
				displayMatrix[y] = new Array(WIDTH).fill('~')
			}
			continue
		}
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
	displayMatrix.splice(displayMatrix.length - base, base)

	console.log("\n" + displayMatrix.map(l => l.join("")).join("\n"))
}