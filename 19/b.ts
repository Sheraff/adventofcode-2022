import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

const MAX_TIME = 32

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
}).slice(0, 3) as {[key in Material]: Cost}[]

console.log(BLUEPRINTS)

const m = "obsidian"
console.log(Object.values(BLUEPRINTS[0]!).reduce((a, b) => Math.max(a, b[m] ?? 0), 0))

const startingRobots = Object.fromEntries(MATERIAL.map(m => [m, 0])) as {[key in Material]: number}
startingRobots.ore = 1

const startingGathered = Object.fromEntries(MATERIAL.map(m => [m, 0])) as {[key in Material]: number}

function makeKey(
	robots: {[key in Material]: number},
	gathered: {[key in Material]: number},
	t: number
) {
	return JSON.stringify({robots, gathered, t})
}

function processBranch(
	blueprint: {[key in Material]: Cost},
	_robots: string = JSON.stringify(startingRobots),
	_gathered: string = JSON.stringify(startingGathered),
	_bought: string = JSON.stringify([]),
	_nextPurchase: Material | undefined = undefined,
	_t: number = 0,
	bestSoFar: {s: number} = {s: 0},
	cache = new Map<string, number>()
): number {
	const robots = JSON.parse(_robots) as {[key in Material]: number}
	const gathered = JSON.parse(_gathered) as {[key in Material]: number}
	const bought = JSON.parse(_bought) as Material[]
	let nextPurchase = _nextPurchase
	for (let t = _t; t < MAX_TIME; t++) {

		const key = makeKey(robots, gathered, t)
		if (cache.has(key)) {
			// console.log('skip')
			return cache.get(key)!
		}

		if (bestSoFar.s && gathered.geode + (MAX_TIME - t) * robots.geode + (MAX_TIME - t)*(MAX_TIME - t + 1) / 2 < bestSoFar.s) {
			// console.log('cant beat best')
			cache.set(key, 0)
			return 0
		}

		// find next to buy
		if (!nextPurchase) {
			// const nextPossiblePurchases = MATERIAL.filter(m => {
			// 	const cost = blueprint[m]
			// 	return Object.keys(cost).every((material) => robots[material as Material] > 0)
			// })
			const nextPossiblePurchases = MATERIAL.filter(m => {
				const cost = blueprint[m]
				const canProduce = Object.keys(cost).every((material) => robots[material as Material] > 0)
				if (!canProduce) return false
				const hasTime = Object.keys(cost).every(material => (cost[material as Material]! - gathered[material as Material]) / robots[material as Material] < MAX_TIME - t + 1)
				if (!hasTime) return false
				const needsMore = m === "geode" || robots[m] < Object.values(blueprint).reduce((a, b) => a + (b[m] ?? 0), 0)
				if (!needsMore) return false
				return true
			})
			// should branch out here
			if (nextPossiblePurchases.length > 1) {
				const robotsString = JSON.stringify(robots)
				const gatheredString = JSON.stringify(gathered)
				const boughtString = JSON.stringify(bought)
				const scores = nextPossiblePurchases.reverse().map(m => processBranch(
					blueprint,
					robotsString,
					gatheredString,
					boughtString,
					m,
					t,
					bestSoFar,
					cache
				))
				const max = Math.max(...scores)
				bestSoFar.s = Math.max(bestSoFar.s, max)
				const key = makeKey(robots, gathered, t)
				cache.set(key, max)
				return max
			} else if (nextPossiblePurchases.length === 1) {
				nextPurchase = nextPossiblePurchases[0]
			}
		}
		// buy next
		let canBuy = false
		if (nextPurchase) {
			canBuy = Object.entries(blueprint[nextPurchase]).every(([material, amount]) => gathered[material as Material] >= amount)
		}
		// robots gather
		Object.entries(robots).forEach(([material, amount]) => {
			gathered[material as Material] += amount
		})
		// add bought
		if (canBuy) {
			Object.entries(blueprint[nextPurchase!]).forEach(([material, amount]) => {
				gathered[material as Material] -= amount
			})
			bought.push(nextPurchase!)
			robots[nextPurchase!]++
			nextPurchase = undefined
		}
	}
	// console.log(`end of branch: geodes=${gathered.geode} => ${bought.join(",")}`)
	bestSoFar.s = Math.max(bestSoFar.s, gathered.geode)
	const key = makeKey(robots, gathered, MAX_TIME)
	cache.set(key, gathered.geode)
	return gathered.geode
}

let total = 1
for (let b = 0; b < BLUEPRINTS.length; b++) {
	const score = processBranch(BLUEPRINTS[b]!)
	console.log(`blueprint ${b}: ${score}`)
	total *= score
}
console.log({total})

