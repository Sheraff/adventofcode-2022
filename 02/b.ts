import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

const POWER_MAP = {
	'A': 0,
	'B': 1,
	'C': 2,
} as const

/** @description map of <strategy decision, delta of power> */
const STRATEGY_MAP = {
	'X': -1,
	'Y': 0,
	'Z': 1,
} as const

/** @description map of <delta of power, score earned> */
const ROUND_SCORE_MAP = {
	[0]: 3,
	[-1]: 6,
	[2]: 6,
} as const

void async function () {
	let score = 0
	for await (const line of rl) {
		const [_a, _b] = line.split(' ')
		if (!_a || !_b) {
			throw new Error('Wrong input')
		}
		const a = _a as 'A' | 'B' | 'C'
		const b = _b as 'X' | 'Y' | 'Z'
		const aChoice = POWER_MAP[a]
		const bChoice = (aChoice + STRATEGY_MAP[b] + 3) % 3
		const round = aChoice - bChoice
		// @ts-expect-error -- unchecked access is behind a nullish check
		const roundScore = (ROUND_SCORE_MAP[round] ?? 0) as number

		score += bChoice + 1 + roundScore
	}

	console.log({score})
}()