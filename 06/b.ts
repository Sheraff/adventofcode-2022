import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})

const CHUNK_LENGTH = 14

let i = CHUNK_LENGTH - 1
for(; i < input.length; i++) {
	const slice = input.slice(i - CHUNK_LENGTH + 1, i + 1)
	if (new Set(slice.split('')).size === CHUNK_LENGTH) {
		i++
		break
	}
}

console.log({i})
