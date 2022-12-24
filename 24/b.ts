import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})

type Char = '#' | '^' | 'v' | '<' | '>'

const initial = input
	.split("\n")
	.map(
		line => line
			.split('')
			.map(
				char => char === '.'
					? []
					: [char]
			)
	) as Char[][][]

type Pos = {x: number, y: number}
type Move = [-1, 0] | [1, 0] | [0, -1] | [0, 1] | [0, 0]

const solved = new Map<string, number>()

const goals = [
	{
		x:initial[0]!.length - 2,
		y: initial.length - 1,
		min: 290 // known from part A
	},
	{
		x: 1,
		y: 0,
		min: 272 // known from previous runs
	},
	{
		x:initial[0]!.length - 2,
		y: initial.length - 1,
		min: 502 // ballpark it
	},
]

let total = 290
for (let i = 1; i < goals.length; i++) {
	solved.clear()
	const prevPos = i === 0
		? {x: 1, y: 0}
		: {x: goals[i - 1]!.x, y: goals[i - 1]!.y}
	const prevMoves = i === 0
		? 0
		: goals.slice(0, i).reduce((sum, {min}) => sum + min, 0)
	let grid = initial
	for (let j = 0; j < prevMoves; j++) {
		grid = updateGrid(grid)
	}
	printGrid(grid, prevPos)
	const min = resolve(grid, prevPos, goals[i]!, 0)
	console.log({min, i})
	if (min)
		total += min
}

console.log({total})

/**
 * @returns 
 *   - `null` if all branches bailed out early, 
 *   - `Infinity` if this branch is a dead end, 
 *   - or the `number` of steps to the end
 */
function resolve(grid: Char[][][], position: Pos, goal: Pos & {min: number}, count: number): number | null {
	if (count >= goal.min) {
		return null
	}
	// printGrid(grid, position)
	const key = serializeState(grid, position)
	if (position.y === goal.y && position.x === goal.x) {
		if (count < goal.min) {
			goal.min = count
			console.log(goal)
		}
		return 0
	}
	if (solved.has(key)) {
		return solved.get(key)!
	}
	const nextGrid = updateGrid(grid)
	const moves = getPossibleMoves(nextGrid, position, goal)
	if (moves.length === 0) {
		solved.set(key, Infinity)
		return Infinity
	}
	if (moves.length === 1) {
		const [x, y] = moves[0]!
		const nextPosition = {x: position.x + x, y: position.y + y}
		const result = resolve(nextGrid, nextPosition, goal, count + 1)
		if (result === null) {
			return null
		} else {
			solved.set(key, result + 1)
		}
		return result + 1
	}
	let scores = []
	for (const [x, y] of moves) {
		const nextPosition = {x: position.x + x, y: position.y + y}
		const result = resolve(nextGrid, nextPosition, goal, count + 1)
		if (result !== null) {
			scores.push(result)
		}
	}
	if (!scores.length) {
		return null
	}
	const min = Math.min(...scores) + 1
	solved.set(key, min)
	return min
}

function getPossibleMoves(grid: Char[][][], position: Pos, goal: Pos) {
	const {x, y} = position
	const moves: Move[] = []
	if (grid[y + 1]?.[x]?.length === 0) {
		moves.push([0, 1])
	}
	if (grid[y]![x + 1]!.length === 0) {
		moves.push([1, 0])
	}
	if (grid[y]![x]!.length === 0) {
		moves.push([0, 0])
	}
	if (grid[y]![x - 1]!.length === 0) {
		moves.push([-1, 0])
	}
	if (grid[y - 1]?.[x]?.length === 0) {
		moves.push([0, -1])
	}
	
	return moves.sort(([x1, y1], [x2, y2]) => {
		const d1 = Math.abs(x1 - goal.x) + Math.abs(y1 - goal.y)
		const d2 = Math.abs(x2 - goal.x) + Math.abs(y2 - goal.y)
		return d1 - d2
	})
}

function updateGrid(grid: Char[][][]) {
	const next = new Array(grid.length).fill(0).map(() => new Array(grid[0]!.length).fill(0).map(() => [] as Char[]))
	for (let y = 0; y < grid.length; y++) {
		for (let x = 0; x < grid[y]!.length; x++) {
			for (const char of grid[y]![x]!) {
				if (char === '#') {
					next[y]![x]!.push(char)
				}
				switch (char) {
					case '^': {
						if (y - 1 === 0) {
							next[grid.length - 2]![x]!.push(char)
						} else {
							next[y - 1]![x]!.push(char)
						}
						break
					}
					case 'v': {
						if (y + 1 === grid.length - 1) {
							next[1]![x]!.push(char)
						} else {
							next[y + 1]![x]!.push(char)
						}
						break
					}
					case '<': {
						if (x - 1 === 0) {
							next[y]![grid[y]!.length - 2]!.push(char)
						} else {
							next[y]![x - 1]!.push(char)
						}
						break
					}
					case '>': {
						if (x + 1 === grid[y]!.length - 1) {
							next[y]![1]!.push(char)
						} else {
							next[y]![x + 1]!.push(char)
						}
						break
					}
				}
			}
		}
	}
	return next
}

function serializeState(grid: Char[][][], position: Pos) {
	return `${position.x}:${position.y}\n` + grid.map(line => line.map(chars => chars.join('')).join(',')).join('\n')
}

function printGrid(grid: Char[][][], position: Pos) {
	console.log(grid.map((line, y) => line.map(
		(chars, x) => 
			x === position.x && y === position.y
				? chars.length === 0
					? '🟢'
					: '🔴'
				: chars.length === 0
					? '.'
					: chars.length > 1
						? chars.length
						: chars[0]
	).join('')).join('\n'))
}