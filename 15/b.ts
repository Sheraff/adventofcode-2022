import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

const MIN = [0, 0] as const
const MAX = [4_000_000, 4_000_000] as const

function tune(x: number, y: number) {
	return x * 4_000_000 + y
}

const REGEX = /Sensor at x=([\-0-9]+), y=([\-0-9]+): closest beacon is at x=([\-0-9]+), y=([\-0-9]+)/

const pairs: [number, number, number, number, number][]	= []
for (const line of lines) {
	const [, x, y, bx, by] = line.match(REGEX)!.map(Number) as [number, number, number, number, number]
	const distance = Math.abs(x - bx) + Math.abs(y - by)
	pairs.push([x, y, bx, by, distance])
}

let cell: undefined | [number, number]
findCell: for (let ROW_Y = MIN[1]; ROW_Y <= MAX[1]; ROW_Y++) {
	console.log(`row ${ROW_Y}`)
	const row = new Array(MAX[0] - MIN[0] + 1).fill(0) as number[]

	for (const [x, y, , , d] of pairs) {
		if (y - d > ROW_Y) continue
		if (y + d < ROW_Y) continue

		const startX = Math.max(MIN[0], x - d)
		const endX = Math.min(MAX[0], x + d)

		for (let i = startX; i <= endX; i++) {
			if (row[i] === 1) continue
			const cellDistance = Math.abs(i - x) + Math.abs(ROW_Y - y)
			if (cellDistance <= d) {
				row[i] = 1
			}
		}
	}

	for (const [, , bx, by] of pairs) {
		if (by !== ROW_Y) continue
		const i = bx - MIN[0]
		row[i] = 0
	}

	for (let x = 0; x < row.length; x++) {
		if (row[x] === 0) {
			cell = [x, ROW_Y]
			break findCell
		}
	}
}

if (!cell) throw new Error(`no cell found`)
console.log({cell})

const frequency = tune(...cell)
console.log({frequency})
