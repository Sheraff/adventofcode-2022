import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

const REGEX = /^Valve ([A-Z]+) has flow rate=([0-9]+); tunnels? leads? to valves? (.*)$/

type Valve = {
	name: string
	flow: number
	leadsTo: [string, number][]
}

const graph = new Map<string, Valve>()

// make graph
for (const line of lines) {
	const [, name, flow, list] = line.match(REGEX)! as [string, string, string, string]
	const leadsTo = list.split(", ").map(name => [name, 1] as [string, number])
	graph.set(name, {
		name,
		flow: Number(flow),
		leadsTo,
	})
}

// compress graph
for (const [name, valve] of graph) {
	if (name === 'AA') {
		continue
	}
	if (valve.flow === 0) {
		valve.leadsTo.forEach(([leadName, leadDuration]) => {
			const leadValve = graph.get(leadName)!
			const additionalLeadsTo = valve.leadsTo
				.filter(([name]) => name !== leadName && leadValve.leadsTo.every(([otherName]) => otherName !== name))
				.map(([name, duration]) => [name, duration + leadDuration] as [string, number])
			leadValve.leadsTo.forEach(([name, duration], i) => {
				const removed = valve.leadsTo.find(([otherName]) => otherName === name)
				if (removed) {
					leadValve.leadsTo[i] = [name, Math.min(duration, removed[1] + leadDuration)]
				}
			})
			leadValve.leadsTo = leadValve.leadsTo
				.filter(([name]) => name !== valve.name)
				.concat(additionalLeadsTo)
		})
		graph.delete(name)
	}
}

console.log(graph)

// memoize all paths from any node to any node (or write a function that finds path and memoizes it) and associated travel duration
const paths = new Map<string, Map<string, number>>()
function findPathFromTo(from: string, to: string, avoid: Set<string> = new Set()) {
	let fromMap = paths.get(from)
	if (fromMap) {
		const duration = fromMap.get(to)
		if (duration !== undefined) {
			return duration
		}
	}
	if (!fromMap) {
		fromMap = new Map()
		paths.set(from, fromMap)
	}

	let duration: number

	const valve = graph.get(from)!
	const found = valve.leadsTo.find(([name]) => name === to)
	if (found) {
		duration = found[1]
	} else {
		duration = valve.leadsTo
			.filter(([name]) => !avoid.has(name))
			.map(([name, duration]) => {
				const subAvoid = new Set(avoid)
				subAvoid.add(from)
				return duration + findPathFromTo(name, to, subAvoid)
			})
			.reduce((a, b) => Math.min(a, b), Infinity)
	}

	if (avoid.size === 0) {
		fromMap.set(to, duration)
		if (!paths.has(to)) {
			paths.set(to, new Map())
		}
		paths.get(to)!.set(from, duration)
	}

	return duration
}

// create set of all closed valves (all valves - valves with flow === 0)
const closedValves = new Set(graph.keys())
closedValves.delete('AA')
let maxSoFar = 0
const score = processGraph(['AA'], closedValves, 0)
console.log({score})

function processGraph(nodes: string[], closed: Set<string>, length: number): number {
	const current = nodes.at(-1)!

	// path and duration to all closed nodes
	const possibilities = Array.from(closed.values())
		.filter(name => name !== current && name !== nodes.at(-2))
		.map(name => [name, findPathFromTo(current, name)] as [string, number])

	// filter out paths that are too long
	const possibleWithOpen = graph.get(current)!.flow === 0
		? possibilities.filter(([,duration]) => length + duration < 30)
		: possibilities.filter(([,duration]) => length + duration + 1 < 30)

	if (!possibleWithOpen.length) {
		const finalNodes = length + 1 <= 30 && closed.has(current)
			? [...nodes, current]
			: nodes
		const score = resolve(finalNodes)
		if (maxSoFar < score) {
			maxSoFar = score
		}
		const scoreString = `${String(score).padStart(String(maxSoFar).length, '0')} / ${maxSoFar}`
		const durationString = String(length).padStart(2, '0')
		const nodeListString = nodeListDisplay(finalNodes)
		console.log(`${scoreString} in ${durationString}:${nodeListString}`)
		return score
	}

	let scores: number[] = []
	if (possibleWithOpen.length) {
		const newClosed = new Set(closed)
		newClosed.delete(current)
		const withOpenScores = graph.get(current)!.flow === 0
			? possibleWithOpen.map(([name, duration]) => processGraph([...nodes, name], newClosed, length + duration))
			: possibleWithOpen.map(([name, duration]) => processGraph([...nodes, current, name], newClosed, length + duration + 1))
		scores.push(...withOpenScores)
	}

	return Math.max(...scores)
}

function resolve(nodes: string[]): number {
	let score = 0
	let scorePerIteration = 0
	let minutes = 0

	for (let i = 1; i < nodes.length; i++) {
		const node = nodes[i]!
		const prev = nodes[i - 1]!
		
		// open valve
		if (prev === node) {
			minutes++
			score += scorePerIteration
			scorePerIteration += graph.get(node)!.flow
			continue
		}

		// move to next valve
		const duration = findPathFromTo(prev, node)
		minutes += duration
		score += scorePerIteration * duration
	}

	if (minutes < 30) {
		score += scorePerIteration * (30 - minutes)
	}

	return score
}


function nodeListDisplay(nodes: string[]) {
	let string = ''
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i]!
		if (i > 0 && nodes[i - 1] === node) {
			continue
		} else if (i > 0) {
			string += `  _${String(findPathFromTo(nodes[i-1]!, node)).padStart(2, '0')}_  ${node}`
		} else {
			string += ` ${node}`
		}
	}
	return string
}