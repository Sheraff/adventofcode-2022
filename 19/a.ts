import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

type Material = "ore" | "clay" | "obsidian" | "geode"
type Cost = {[key in Material]?: number}
const MATERIAL = ["ore", "clay", "obsidian", "geode"] as const

// Blueprint 1: Each ore robot costs 4 ore. Each clay robot costs 4 ore. Each obsidian robot costs 4 ore and 5 clay. Each geode robot costs 3 ore and 7 obsidian.
const material = MATERIAL.join("|")
const robot = `Each (${material}) robot costs ([^.]+)\.`
const REGEX = new RegExp(`${robot} ${robot} ${robot} ${robot}`)

const BLUEPRINTS = lines.map(line => {
	const parts = line.match(REGEX)!.slice(1)
	const costs: [Material, Cost][] = []
	for (let i = 0; i < 8; i+=2) {
		const material = parts[i]! as Material
		const cost = parts[i + 1]!.split(" and ").map(a => {
			const [amount, material] = a.split(" ")
			return [material, Number(amount)] as [Material, number]
		})
		costs.push([material, Object.fromEntries(cost) as Cost])
	}
	return Object.fromEntries(costs)
}) as {[key in Material]: Cost}[]

const startingRobots = Object.fromEntries(MATERIAL.map(m => [m, 0])) as {[key in Material]: number}
startingRobots.ore = 1

const startingGathered = Object.fromEntries(MATERIAL.map(m => [m, 0])) as {[key in Material]: number}

function processBranch(
	blueprint: {[key in Material]: Cost},
	_robots: string = JSON.stringify(startingRobots),
	_gathered: string = JSON.stringify(startingGathered),
	_bought: string = JSON.stringify([]),
	_nextPurchase: Material | undefined = undefined,
	_t: number = 0
): number {
	const robots = JSON.parse(_robots) as {[key in Material]: number}
	const gathered = JSON.parse(_gathered) as {[key in Material]: number}
	const bought = JSON.parse(_bought) as Material[]
	let nextPurchase = _nextPurchase
	for (let t = _t; t < 24; t++) {
		// find next to buy
		if (!nextPurchase) {
			const nextPossiblePurchases = MATERIAL.filter(m => {
				const cost = blueprint[m]
				return Object.keys(cost).every((material) => robots[material as Material] > 0)
			})
			// should branch out here
			if (nextPossiblePurchases.length > 1) {
				const robotsString = JSON.stringify(robots)
				const gatheredString = JSON.stringify(gathered)
				const boughtString = JSON.stringify(bought)
				const scores = nextPossiblePurchases.map(m => processBranch(
					blueprint,
					robotsString,
					gatheredString,
					boughtString,
					m,
					t
				))
				return Math.max(...scores)
			} else {
				nextPurchase = nextPossiblePurchases[0]
			}
		}
		// buy next
		const canBuy = Object.entries(blueprint[nextPurchase!]).every(([material, amount]) => gathered[material as Material] >= amount)
		if (canBuy) {
			Object.entries(blueprint[nextPurchase!]).forEach(([material, amount]) => {
				gathered[material as Material] -= amount
			})
		}
		// robots gather
		Object.entries(robots).forEach(([material, amount]) => {
			gathered[material as Material] += amount
		})
		// add bought
		if (canBuy) {
			bought.push(nextPurchase!)
			robots[nextPurchase!]++
			nextPurchase = undefined
		}
	}
	// console.log(`end of branch: geodes=${gathered.geode} => ${bought.join(",")}`)
	return gathered.geode
}

let total = 0
for (let b = 0; b < BLUEPRINTS.length; b++) {
	const score = processBranch(BLUEPRINTS[b]!)
	console.log(`blueprint ${b}: ${score}`)
	total +=score * (b + 1)
}
console.log({total})

