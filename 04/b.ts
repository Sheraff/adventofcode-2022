import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

void async function () {
	let count = 0
	for await (const line of rl) {
		const sections = line.split(",").map(s => s.split("-").map(Number))
		const [x1, y1] = sections[0] as [number, number]
		const [x2, y2] = sections[1] as [number, number]
		if ((x1 >= x2 && x1 <= y2) || (y1 >= x2 && y1 <= y2)) {
			count++
		} else if ((x2 >= x1 && x2 <= y1) || (y2 >= x1 && y2 <= y1)) {
			count++
		}
	}
	console.log({count})
}()

