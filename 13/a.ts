import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

type Recursive = (number | Recursive)[]

void async function () {
	let count = 1
	let one: Recursive | null = null
	let two: Recursive | null = null
	const indicesInOrder: number[] = []
	for await (const line of rl) {
		if (!line) {
			one = null
			two = null
			count++
			continue
		}
		const parsed = parse(line.split(""))
		if (!one) {
			one = parsed
			continue
		}
		two = parsed
		const inOrder = isInOrder(one, two)
		if (inOrder !== false) indicesInOrder.push(count)
	}
	console.log({ indicesInOrder })
	const sum = indicesInOrder.reduce((a, b) => a + b, 0)
	console.log({sum})
}()

function recursiveToString(a: Recursive) {
	let str = ""
	for (let i = 0; i < a.length; i++) {
		const item = a[i]!
		if (typeof item === 'number') {
			str += `${item},`
			continue
		}
		str += `[${recursiveToString(item)}],`
	}
	return str
}

function isInOrder(a: Recursive, b: Recursive, initA: Recursive = a, initB: Recursive = b): boolean | undefined {
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		const itemA = a[i]
		const itemB = b[i]
		const typeA = typeof itemA
		const typeB = typeof itemB
		if (typeA === 'undefined' && typeB === 'undefined') {
			throw new Error("Shouldn't happen, both undefined")
		}
		if (typeA === 'undefined' && typeB !== 'undefined') return true
		if (typeA !== 'undefined' && typeB === 'undefined') return false
		if (typeA === 'number' && typeB === 'number') {
			if (itemA! < itemB!) return true
			if (itemA! === itemB!) continue
			if (itemA! > itemB!) return false
		}
		const depthA = Array.isArray(itemA) ? itemA : [itemA!]
		const depthB = Array.isArray(itemB) ? itemB : [itemB!]
		const subInOrder = isInOrder(depthA, depthB, initA, initB)
		if (subInOrder !== undefined) return subInOrder
	}
}

function parse(tokens: string[]) {
	const parsed: Recursive = []
	let number: string = ""
	const closeNumber = () => {
		if (number) {
			parsed.push(Number(number))
			number = ""
		}
	}
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i]!
		if (token === "[") {
			closeNumber()
			const end = findMatching(tokens, i)
			parsed.push(parse(tokens.slice(i + 1, end)))
			i = end
			continue
		}
		if (token === ",") {
			closeNumber()
			continue
		}
		number += token
	}
	closeNumber()
	return parsed
}

function findMatching(tokens: string[], index: number) {
	let depth = 0
	if (tokens[index] !== "[") throw new Error("Expected [")
	for (let i = index; i < tokens.length; i++) {
		const token = tokens[i]
		if (token === "[") depth++
		if (token === "]") depth--
		if (depth === 0) return i
	}
	throw new Error("Expected ]")
}

