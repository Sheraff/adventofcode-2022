import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

const SAND_INPUT = [500, 0] as const

void async function () {
	const matrix: (0 | 1 | 2)[][] = []
	let matrixMaxY = 0
	let matrixMinX = Infinity
	for await (const line of rl) {
		const points = line.split(" -> ").map(coords => coords.split(",").map(Number))
		for (let i = 1; i < points.length; i++) {
			const a = points[i - 1]
			const b = points[i]
			if (!a || !b || a.length !== 2 || b.length !== 2)
				throw new Error("Shouldn't happen")
			const [x1, y1] = a as [number, number]
			const [x2, y2] = b as [number, number]
			const minX = Math.min(x1, x2)
			const maxX = Math.max(x1, x2)
			const minY = Math.min(y1, y2)
			const maxY = Math.max(y1, y2)
			matrixMinX = Math.min(matrixMinX, minX)
			matrixMaxY = Math.max(matrixMaxY, maxY)
			for (let x = minX; x <= maxX; x++) {
				for (let y = minY; y <= maxY; y++) {
					if (!matrix[y]) matrix[y] = new Array(650).fill(0)
					matrix[y]![x] = 1
				}
			}
		}
	}

	drawMatrix(matrix, matrixMinX)
	console.log('matrix done', matrixMinX, matrixMaxY)

	let lastGrainMoved = true
	let restingCount = 0
	while (lastGrainMoved) {
		const newGrain = [...SAND_INPUT] as [number, number]
		lastGrainMoved = false
		while (true) {
			const [x, y] = newGrain
			const nextY = y + 1
			if (!matrix[nextY]) matrix[nextY] = new Array(650).fill(0)
			if (nextY < matrixMaxY + 2) {
				const row = matrix[nextY]!
				if (row[x] !== 1 && row[x] !== 2) {
					newGrain[1] = nextY
					continue
				}
				if (row[x - 1] !== 1 && row[x - 1] !== 2) {
					newGrain[1] = nextY
					newGrain[0] = x - 1
					continue
				}
				if (row[x + 1] !== 1 && row[x + 1] !== 2) {
					newGrain[1] = nextY
					newGrain[0] = x + 1
					continue
				}
			}
			if (!matrix[y]) {
				matrix[y] = new Array(650).fill(0)
			}
			matrix[y]![x] = 2
			restingCount++
			if (restingCount % 500 === 0) {
				drawMatrix(matrix, matrixMinX)
			}
			lastGrainMoved = x !== SAND_INPUT[0] || y !== SAND_INPUT[1]
			break
		}
	}
	
	console.log({restingCount})
}()

function drawMatrix(matrix: (0 | 1 | 2)[][], minX: number) {
	console.log(`starting at ${minX - 100},0`)
	const lines = matrix.map((row, i) =>
		String(i).padStart(3, '0')
		+ row.slice(minX - 100).map(
			cell => cell === 1 ? "#" : cell === 2 ? "o" : "."
		).join(""))
	console.log(lines.join("\n"))
}