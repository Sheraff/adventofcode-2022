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
	const knots = Array(10).fill(0).map(() => ({x: 0, y: 0}))
	let step = -1
	for await (const line of rl) {
		step++
		const [direction, count] = line.split(" ")
		const vector = directionToVector[direction as keyof typeof directionToVector]
		for (let i = 0; i < Number(count); i++) {
			knots[0]!.x += vector.x
			knots[0]!.y += vector.y
			
			for (let j = 1; j < knots.length; j++) {
				tailFollowsHead(knots[j - 1]!, knots[j]!)
			}
			
			visited.add(`${knots.at(-1)!.x},${knots.at(-1)!.y}`)
		}
	}
	console.log(visited.size)
}()


function tailFollowsHead(head: {x: number, y: number}, tail: {x: number, y: number}) {
	const distance = {x: head.x - tail.x, y: head.y - tail.y}
	if (Math.abs(distance.x) <= 1 && Math.abs(distance.y) <= 1) {
		// already adjacent
		return
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
	} else if (Math.abs(distance.x) === 2 && Math.abs(distance.y) === 2) {
		// diagonal, behind both
		tail.x = head.x - Math.sign(distance.x)
		tail.y = head.y - Math.sign(distance.y)
	} else {
		throw new Error(`Invalid distance, h:${head.x},${head.y} t:${tail.x},${tail.y} d:${distance.x},${distance.y}}`)
	}
}
