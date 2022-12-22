import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

const CUBE_SIDE = 50

const instructions = lines.pop()!.split('').reduce((acc, c) => {
	const currentIsNumber = Boolean(/\d/.test(c))
	if (!acc.length) {
		if (currentIsNumber)
			return [Number(c)]
		else
			return [c as 'L' | 'R']
	}
	const lastIsNumber = typeof acc.at(-1) === 'number'

	if (lastIsNumber !== currentIsNumber) {
		if (currentIsNumber) {
			acc.push(Number(c))
		} else {
			acc.push(c as 'L' | 'R')
		}
		return acc
	}

	if (lastIsNumber) {
		const newLast = `${acc.at(-1)}${c}`
		acc[acc.length - 1]! = Number(newLast)
	} else {
		acc.push(c as 'L' | 'R')
	}
	return acc

}, [] as ('L' | 'R' | number)[])
lines.pop()

const grid: string[][] = lines.map(l => l.split(''))

const initialX = grid[0]!.findIndex(c => c === '.')

type Position = {
	x: number
	y: number
	facing: 'U' | 'D' | 'L' | 'R'
}

const position: Position = {
	x: initialX,
	y: 0,
	facing: 'R',
}

console.log({initial: position})

for (const instr of instructions) {
	if (typeof instr === 'number') {
		for (let i = 0; i < instr; i++) {
			switch (position.facing) {
				case 'U': updateCoordsFromPosition(position, [ 0,-1]); break
				case 'D': updateCoordsFromPosition(position, [ 0, 1]); break
				case 'L': updateCoordsFromPosition(position, [-1, 0]); break
				case 'R': updateCoordsFromPosition(position, [ 1, 0]); break
			}
		}
	} else {
		updateFacingFromPosition(position, instr)
	}
}

const score = scoreFromPosition(position)
console.log({score})

function scoreFromPosition(position: Position) {
	const FACING_SCORE = {
		R: 0,
		D: 1,
		L: 2,
		U: 3,
	}
	return (position.y + 1) * 1_000 + (position.x + 1) * 4 + FACING_SCORE[position.facing]
}

function updateFacingFromPosition(position: Position, dir: 'L' | 'R') {
	switch (position.facing) {
		case 'U': position.facing = dir === 'L' ? 'L' : 'R'; break
		case 'D': position.facing = dir === 'L' ? 'R' : 'L'; break
		case 'L': position.facing = dir === 'L' ? 'D' : 'U'; break
		case 'R': position.facing = dir === 'L' ? 'U' : 'D'; break
	}
}

function updateCoordsFromPosition(position: Position, vec: [0,1] | [0,-1] | [1,0] | [-1,0]) {
	if (grid[position.y + vec[1]]?.[position.x + vec[0]] === '.') {
		position.x += vec[0]
		position.y += vec[1]
		return
	}
	if (grid[position.y + vec[1]]?.[position.x + vec[0]] === '#') {
		return
	}

	// cube wrapping (side size `CUBE_SIDE`)
	const next = wrapToNext(position, vec)
	if (grid[next.y]![next.x] === '#') {
		return
	}
	if (grid[next.y]![next.x] === '.') {
		position.x = next.x
		position.y = next.y
		position.facing = next.facing
		return
	}
	console.log(position, next, vec)
	throw new Error('unreachable update')
}

function wrapToNext(position: Position, vec: [0,1] | [0,-1] | [1,0] | [-1,0]): Position {
	if (vec[0] === -1) {
		if (position.y < CUBE_SIDE) {
			return {
				x: 0,
				y: CUBE_SIDE * 3 - position.y - 1,
				facing: 'R'
			}
		} else if (position.y < CUBE_SIDE * 2) {
			return {
				x: position.y - CUBE_SIDE,
				y: CUBE_SIDE * 2,
				facing: 'D'
			}
		} else if (position.y < CUBE_SIDE * 3) {
			return {
				x: CUBE_SIDE,
				y: CUBE_SIDE - (position.y - CUBE_SIDE * 2) - 1,
				facing: 'R'
			}
		} else if (position.y < CUBE_SIDE * 4) {
			return {
				x: CUBE_SIDE + position.y - CUBE_SIDE * 3,
				y: 0,
				facing: 'D'
			}
		}
	} else if (vec[0] === 1) {
		if (position.y < CUBE_SIDE) {
			return {
				x: CUBE_SIDE * 2 - 1,
				y: CUBE_SIDE * 3 - position.y - 1,
				facing: 'L'
			}
		} else if (position.y < CUBE_SIDE * 2) {
			return {
				x: CUBE_SIDE * 2 + position.y - CUBE_SIDE,
				y: CUBE_SIDE - 1,
				facing: 'U'
			}
		} else if (position.y < CUBE_SIDE * 3) {
			return {
				x: CUBE_SIDE * 3 - 1,
				y: CUBE_SIDE - (position.y - CUBE_SIDE * 2) - 1,
				facing: 'L'
			}
		} else if (position.y < CUBE_SIDE * 4) {
			return {
				x: CUBE_SIDE + position.y - CUBE_SIDE * 3,
				y: CUBE_SIDE * 3 - 1,
				facing: 'U'
			}
		}
	} else if (vec[1] === -1) {
		if (position.x < CUBE_SIDE) {
			return {
				x: CUBE_SIDE,
				y: CUBE_SIDE + position.x,
				facing: 'R'
			}
		} else if (position.x < CUBE_SIDE * 2) {
			return {
				x: 0,
				y: CUBE_SIDE * 2 + position.x,
				facing: 'R'
			}
		} else if (position.x < CUBE_SIDE * 3) {
			return {
				x: position.x - CUBE_SIDE * 2,
				y: CUBE_SIDE * 4 - 1,
				facing: 'U'
			}
		}
	} else if (vec[1] === 1) {
		if (position.x < CUBE_SIDE) {
			return {
				x: position.x + CUBE_SIDE * 2,
				y: 0,
				facing: 'D'
			}
		} else if (position.x < CUBE_SIDE * 2) {
			return {
				x: CUBE_SIDE - 1,
				y: 2 * CUBE_SIDE + position.x,
				facing: 'L'
			}
		} else if (position.x < CUBE_SIDE * 3) {
			return {
				x: CUBE_SIDE * 2 - 1,
				y: position.x - CUBE_SIDE,
				facing: 'L'
			}
		}
	}
	throw new Error('unreachable wrapping')
}
