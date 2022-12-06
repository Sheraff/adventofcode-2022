import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})

let i = 3
for(; i < input.length; i++) {
	const slice = input.slice(i - 3, i + 1)
	if (new Set(slice.split('')).size === 4) {
		i++
		break
	}
}

console.log({i})
