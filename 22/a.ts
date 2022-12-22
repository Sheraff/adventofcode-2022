import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

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
	const next = [position.x, position.y] as [number, number]
	while (grid[next[1]]?.[next[0]] !== ' ' && grid[next[1]]?.[next[0]] !== undefined) {
		next[0] -= vec[0]
		next[1] -= vec[1]
	}
	next[0] += vec[0]
	next[1] += vec[1]
	if (grid[next[1]]![next[0]] === '#') {
		return
	}
	if (grid[next[1]]![next[0]] === '.') {
		position.x = next[0]
		position.y = next[1]
		return
	}
	throw new Error('unreachable')
}
