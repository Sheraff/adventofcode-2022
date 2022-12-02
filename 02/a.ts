import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

const POWER_MAP = new Map([
	['A', 0],
	['B', 1],
	['C', 2],
	['X', 0],
	['Y', 1],
	['Z', 2],
])

/** @description map of <move played, score earned> */
const SCORE_MAP = new Map([
	['X', 1],
	['Y', 2],
	['Z', 3],
])

/** @description map of <delta of power, score earned> */
const ROUND_SCORE_MAP = new Map([
	[0, 3],
	[-1, 6],
	[2, 6],
])

void async function () {
	let score = 0
	for await (const line of rl) {
		const [a, b] = line.split(' ')
		if (!a || !b) {
			throw new Error('Wrong input')
		}
		const aChoice = POWER_MAP.get(a)
		const bChoice = POWER_MAP.get(b)
		const round = aChoice - bChoice
		const roundScore = ROUND_SCORE_MAP.get(round) ?? 0

		score += SCORE_MAP.get(b) + roundScore
	}

	console.log({score})
}()