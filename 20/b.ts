import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

const identities = lines.map(l => ({n: Number(l) * 811_589_153}))
const orderable = [...identities]

for (let _ = 0; _ < 10; _++) {
	for (const i of identities) {
		const index = orderable.indexOf(i)
		const nextIndex = mod(index + i.n, orderable.length - 1)
		orderable.splice(index, 1)
		orderable.splice(nextIndex, 0, i)
	}
}

const zero = orderable.findIndex(o => o.n === 0)

const one = orderable[mod(zero + 1000, orderable.length)]!
const two = orderable[mod(zero + 2000, orderable.length)]!
const three = orderable[mod(zero + 3000, orderable.length)]!

console.log(one.n + two.n + three.n)

function mod(n: number, of: number) {
	if (n < 0) {
		return of - (Math.abs(n) % of)
	}
	return n % of
}