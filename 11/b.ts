import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

class Item {
	worry = 0
	constructor(worry: number) {
		this.worry = worry
	}
}

class Monkey {
	items: Item[] = []
	operation: (item: Item) => void = () => {}
	denominator: number = 0
	ifTrue: number = 0
	ifFalse: number = 0
	inspectCount: number = 0
}

const monkeys: Monkey[] = []

for (const line of lines) {
	const [command, args] = line.split(":").map(s => s.trim())
	switch(true) {
		case command!.startsWith("Monkey"):
			monkeys.push(new Monkey())
			break
		case command === "Starting items":
			monkeys.at(-1)!.items = args!.split(', ').map(s => new Item(Number(s)))
			break
		case command === "Operation": {
			const match = args!.match(/new = (old|[0-9]+) ([\+\*]) (old|[0-9]+)/)
			if (!match) throw new Error(`Invalid operation, ${args}`)
			const [_, a, op, b] = match
			monkeys.at(-1)!.operation = (item: Item) => {
				const valueA = a === "old" ? item.worry : Number(a)
				const valueB = b === "old" ? item.worry : Number(b)
				item.worry = op === "+" ? valueA + valueB : valueA * valueB
			}
			break
		}
		case command === "Test": {
			const match = args!.match(/divisible by ([0-9]+)/)
			if (!match) throw new Error(`Invalid test, ${args}`)
			const [_, divisor] = match
			monkeys.at(-1)!.denominator = Number(divisor)
			break
		}
		case command === "If true": {
			const match = args!.match(/throw to monkey ([0-9]+)/)
			if (!match) throw new Error(`Invalid if true, ${args}`)
			const [_, monkey] = match
			monkeys.at(-1)!.ifTrue = Number(monkey)
			break
		}
		case command === "If false": {
			const match = args!.match(/throw to monkey ([0-9]+)/)
			if (!match) throw new Error(`Invalid if false, ${args}`)
			const [_, monkey] = match
			monkeys.at(-1)!.ifFalse = Number(monkey)
			break
		}
		default:
			continue;
	}
}

const commonDenominator = monkeys.reduce((acc, m) => acc * m.denominator, 1)

const ROUNDS = 10_000
for (let i = 0; i < ROUNDS; i++) {
	for (const monkey of monkeys) {
		for (const item of monkey.items) {
			monkey.operation(item)
			monkey.inspectCount++
			item.worry = item.worry % commonDenominator
			const target = item.worry % monkey.denominator === 0
				? monkey.ifTrue
				: monkey.ifFalse
			monkeys.at(target)!.items.push(item)
		}
		monkey.items.length = 0
	}
}

const result = monkeys
	.map(m => m.inspectCount)
	.sort((a, b) => b - a)

const monkeyBusinessScore = result[0]! * result[1]!
console.log({monkeyBusinessScore})