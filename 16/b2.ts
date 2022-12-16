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

const TIME_LIMIT = 26

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
const score = processGraph([['AA'],['AA']], closedValves, 0)
console.log({score})

// AA > JJ > BB > CC
// AA > DD > HH > EE
function processGraph(agents: string[][], closed: Set<string>, start: number = 1): number {
	for (let minute = start; minute <= TIME_LIMIT; minute++) {
		for (const agent of agents) {
			if (agent.at(-2) && agent.at(-1) !== agent.at(-2)) {
				agent.push(agent.at(-1)!)
				closed.delete(agent.at(-1)!)
			}
		}
		const availableAgents = agents.filter(agent => agent.length === minute)
		if (!availableAgents.length) {
			continue
		}

		const current = availableAgents.map(agent => agent.at(-1)!)
		const possibilities = Array.from(closed.values())
			.filter(name => !current.includes(name))
			.map(name => [name, current.map(c => findPathFromTo(c, name))] as [string, number[]])
			.filter(([,durations]) => durations.some(
				(duration, i) => duration + minute + (graph.get(current[i]!)!.flow === 0 ? 0 : 1) < TIME_LIMIT)
			)

		if (!possibilities.length) {
			if (availableAgents.length === agents.length) {
				break
			}
			continue
		}
		
		const permutations = choose(possibilities, availableAgents.length)
			.filter(permutation => {
				for (let i = 0; i < permutation.length; i++) {
					if (permutation[i]![1][i]! + minute + graph.get(current[i]!)!.flow === 0 ? 0 : 1 >= TIME_LIMIT) return false
				}
				return true
			})
			.map(permutation => permutation.map(([name]) => name))

		if (!permutations.length) {
			if (availableAgents.length === agents.length) {
				break
			}
			continue
		}
		const scores: number[] = []
		for (const permutation of permutations) {
			const newArray = agents.map((agent, a) => {
				const i = availableAgents.indexOf(agent)
				if (i === -1) return []
				return new Array(findPathFromTo(availableAgents[i]!.at(-1)!, permutation[i]!) - 1).fill(availableAgents[i]!.at(-1)!).concat(permutation[i]) as string[]
			})
			const newAgents = agents.map((agent, a) => [...agent, ...newArray[a]!])
			scores.push(processGraph(newAgents, new Set(closed), minute))
		}
		return Math.max(...scores)
	}

	// resolve
	return resolve(agents)
}

function resolve(agents: string[][]): number {
	const open: Set<string> = new Set()
	let releasePerMinute = 0
	let score = 0
	for (let minute = 1; minute < TIME_LIMIT; minute++) {
		for (const agent of agents) {
			const index = Math.min(minute, agent.length - 1)
			if (agent[index]! === agent[index-1]!) {
				if (!open.has(agent[index]!)) {
					releasePerMinute += graph.get(agent[index]!)!.flow
					open.add(agent[index]!)
				}
			}
		}
		score += releasePerMinute
	}
	display(agents, score)
	return score
}

function choose<T>(arr: T[], k: number, prefix: T[] = []): T[][] {
	if (k === 0) return [prefix]
	return arr.flatMap((v, i) =>
		choose(arr.slice(i+1), k-1, [...prefix, v])
	)
}


function display(agents: string[][], score: number) {
	if (maxSoFar < score) {
		maxSoFar = score
		const string = agents.map(agent => agentDisplay(agent)).join('\n')
		console.log()
		console.log(string)
		console.log(`${score} / ${maxSoFar}`)
	}
}

function agentDisplay(agent: string[]) {
	let str = ''
	for (let i = 0; i < agent.length; i++) {
		if (i === 0) {
			str += agent[i]
		} else if (agent[i] === agent[i-1]) {
			str += ' ....'
		} else {
			str += ' > ' + agent[i]
		}
	}
	return str
}
