import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})

type Monkey = {
	name: string
} & (
	| {
		number: number | string
	}
	| {
		a: string
		b: string
		op: '+' | '-' | '*' | '/' | '='
	}
)

const REGEX = /^([a-z]{4})\: (?:(\d+)|(?:([a-z]{4}) ([\+\-\/\*]) ([a-z]{4})))$/

const set = new Map<string, Monkey>(input.split("\n").map(l => {
	const match = l.match(REGEX)!
	if (match[2]) {
		return [match[1]!, {
			name: match[1]!,
			number: match[1] === 'humn' ? 'x' : Number(match[2]!),
		}]
	} else {
		return [match[1]!, {
			name: match[1]!,
			a: match[3]!,
			b: match[5]!,
			op: match[1] === 'root' ? '=' : match[4]! as '+' | '-' | '*' | '/',
		}]
	}
}))

console.log(set.get('root'))

console.log(solveNode(set.get('root')!))

function solveNode(node: Monkey): number | string {
	if ('number' in node) {
		return node.number
	} else {
		const a = solveNode(set.get(node.a)!)
		const b = solveNode(set.get(node.b)!)
		let number
		if (typeof a === 'string' || typeof b === 'string') {
			number = `(${a} ${node.op} ${b})`
		} else {
			switch (node.op) {
				case '+': number = a + b; break
				case '-': number = a - b; break
				case '*': number = a * b; break
				case '/': number = a / b; break
			}
		}
		set.set(node.name, {
			name: node.name,
			number: number as number | string,
		})
		return number as number | string
	}
}

