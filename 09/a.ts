import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

const directionToVector = {
	U: {x: 0, y: 1},
	R: {x: 1, y: 0},
	D: {x: 0, y: -1},
	L: {x: -1, y: 0},
} as const

void async function () {
	const visited = new Set<string>(["0,0"])
	const head = {x: 0, y: 0}
	const tail = {x: 0, y: 0}
	for await (const line of rl) {
		const [direction, count] = line.split(" ")
		const vector = directionToVector[direction as keyof typeof directionToVector]
		for (let i = 0; i < Number(count); i++) {
			head.x += vector.x
			head.y += vector.y
			const distance = {x: head.x - tail.x, y: head.y - tail.y}
			const stateString = `${direction} => h:${head.x},${head.y} t:${tail.x},${tail.y} d:${distance.x},${distance.y}}`
			if (Math.abs(distance.x) <= 1 && Math.abs(distance.y) <= 1) {
				// already adjacent
				console.log(`${stateString} ---`)
				continue
			}
			if (Math.abs(distance.x) === 2 && Math.abs(distance.y) === 1) {
				// diagonal, same Y, behind X
				tail.y = head.y
				tail.x = head.x - Math.sign(distance.x)
			} else if (Math.abs(distance.x) === 1 && Math.abs(distance.y) === 2) {
				// diagonal, same X, behind Y
				tail.x = head.x
				tail.y = head.y - Math.sign(distance.y)
			} else if (Math.abs(distance.x) === 2 && Math.abs(distance.y) === 0) {
				// horizontal, same Y, behind X
				tail.y = head.y
				tail.x = head.x - Math.sign(distance.x)
			} else if (Math.abs(distance.y) === 2 && Math.abs(distance.x) === 0) {
				// vertical, same X, behind Y
				tail.x = head.x
				tail.y = head.y - Math.sign(distance.y)
			} else {
				throw new Error(`Invalid distance, h:${head.x},${head.y} t:${tail.x},${tail.y} d:${distance.x},${distance.y}}`)
			}
			console.log(`${stateString} => ${tail.x},${tail.y}`)
			visited.add(`${tail.x},${tail.y}`)
		}
	}
	console.log(visited.size)
}()

