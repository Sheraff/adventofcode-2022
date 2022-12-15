import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

const ROW_Y = 2_000_000
const REGEX = /Sensor at x=([\-0-9]+), y=([\-0-9]+): closest beacon is at x=([\-0-9]+), y=([\-0-9]+)/

void async function () {
	const pairs: [number, number, number, number][]	= []
	for await (const line of rl) {
		const [, x, y, bx, by] = line.match(REGEX)!.map(Number) as [number, number, number, number, number]
		pairs.push([x, y, bx, by])
	}

	// minX, maxX
	const xRange = pairs.reduce(([minX, maxX], [x,,bx]) => [
		Math.min(minX, x, bx),
		Math.max(maxX, x, bx)
	] as const, [Infinity, -Infinity] as const)
	// @ts-ignore -- large approximation of manhattan distance diamond shape
	xRange[0] -= 1_000_000
	// @ts-ignore -- large approximation of manhattan distance diamond shape
	xRange[1] += 1_000_000

	const row = new Array(xRange[1] - xRange[0] + 1).fill(0) as number[]
	
	for (const [x, y, bx, by] of pairs) {
		const distance = Math.abs(x - bx) + Math.abs(y - by)
		if (y - distance > ROW_Y) continue
		if (y + distance < ROW_Y) continue

		for (let i = 0; i < row.length; i++) {
			const cellX = xRange[0] + i
			if (row[i] === 1) continue
			const cellDistance = Math.abs(cellX - x) + Math.abs(ROW_Y - y)
			if (cellDistance <= distance) {
				row[i] = 1
			}
		}
	}

	for (const [, , bx, by] of pairs) {
		if (by !== ROW_Y) continue
		const i = bx - xRange[0]
		row[i] = 0
	}

	const totalAvailableCells = row.reduce((sum, cell) => sum + cell, 0)
	console.log({totalAvailableCells})
}()
