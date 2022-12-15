import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

const MAX = 4_000_000

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

const ALL_RANGES = new Map<number, [number, number][]>()
for (const [x, y, bx, by, d] of pairs) {
	for (let i = Math.max(0, y - d); i <= Math.min(MAX, y + d); i++) {
		const minX = x - (d - Math.abs(i - y))
		const maxX = x + (d - Math.abs(i - y))
		if (maxX < minX) continue
		const newRange: [number, number] = [Math.max(0, minX), Math.min(MAX, maxX)]
		const rowRanges = ALL_RANGES.get(i)
		if (!rowRanges) {
			ALL_RANGES.set(i, [newRange])
			continue
		}
		ALL_RANGES.set(i, [...rowRanges, newRange])
	}
}
for (const [x, y, bx, by, d] of pairs) {
	if (by < 0 || by > MAX) continue
	if (bx < 0 || bx > MAX) continue
	const rowRanges = ALL_RANGES.get(by)
	if (!rowRanges) {
		ALL_RANGES.set(by, [[bx, bx]])
	} else {
		ALL_RANGES.set(by, [...rowRanges, [bx, bx]])
	}
}

for (let y = 0; y < MAX; y++) {
	let rowRanges = ALL_RANGES.get(y)
	if (!rowRanges) throw new Error(`no ranges for row ${y}`)
	const merged = mergeRanges(rowRanges)

	if (merged.length === 0 || merged.length > 2) throw new Error(`row ${y} has ${merged.length} ranges`)
	if (merged.length === 1) {
		continue
	}

	const [[amin, amax], [bmin, bmax]] = merged as [[number, number], [number, number]]
	let min
	let max
	if (amax < bmin) {
		min = amax
		max = bmin
	} else if (bmax < amin) {
		min = bmax
		max = amin
	} else {
		throw new Error(`row ${y} has overlapping ranges ${amin}-${amax} and ${bmin}-${bmax}`)
	}
	const delta = max - min
	if (delta !== 2) throw new Error(`row ${y} has ${delta} empty tiles between ${amin}-${amax} and ${bmin}-${bmax}`)

	const x = min + 1
	const result = tune(x, y)
	console.log(`result: ${result}`)
}


function mergeRanges(ranges: [number, number][]) {
	let merged: [number, number][] = []
	for (const [minX, maxX] of ranges) {
		if (merged.length === 0) {
			merged.push([minX, maxX])
			continue
		}

		const contains = merged.some(([min, max]) => minX >= min && maxX <= max)
		if (contains) continue

		const overlaps = merged.find(([min, max]) =>
			(minX >= min - 1 && minX <= max + 1)
			|| (maxX >= min - 1 && maxX <= max + 1)
			|| (min >= minX - 1 && min <= maxX + 1)
			|| (max >= minX - 1 && max <= maxX + 1)
		)
		if (overlaps) {
			overlaps[0] = Math.min(overlaps[0], minX)
			overlaps[1] = Math.max(overlaps[1], maxX)

			let length = merged.length
			let changed = true
			while (changed && length > 1) {
				merged = mergeRanges(merged)
				changed = merged.length !== length
				length = merged.length
			}

			continue
		}

		merged.push([minX, maxX])
	}

	return merged
}