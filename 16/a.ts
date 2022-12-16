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

let position = 'AA'

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

// create set of all closed valves (all valves - valves with flow === 0)

// loop
// - on a node
//   - find paths to all open valves and associated travel duration
//   - add to tree
//      - open current (if closed) and then go to all open valves (if duration is OK)
//      - go to all open valves (if duration is OK)
//   - if no paths, resolve tree and prune

console.log(graph)

type Node = {
	in: string,
	after?: Action[],
	length: number,
	open: Set<string>,
}

type Action = Node & {
	before: Action | Node,
} & (
	| {type: "open"}
	| {type: "moveTo"}
)

const actionTree: Node = {
	in: 'AA',
	length: 0,
	open: new Set(),
}

const branchScores: number[] = []
console.log('building tree')
buildTree(actionTree)
console.log('done')
// const max = resolveTree(actionTree, 0, 0)
// console.log({max})


function nodePath(node: Node): string {
	const path = isAction(node) && node.type === "open" ? "**" : node.in
	if (isAction(node)) {
		return nodePath(node.before) + " -> " + path
	}
	return path
}

function resolveFromNode(node: Node) {
	const [branch] = resolveBranch(node)
	const max = resolveTree(branch, 0, 0)
	branchScores.push(max)
	console.log('tree', Math.max(...branchScores), nodePath(node))
	// prune
	if (isAction(node)) {
		let parent = node.before
		while(true) {
			if (parent.after) {
				parent.after.splice(parent.after.indexOf(node), 1)
				if (parent.after.length > 0) {
					break
				}
				if (!isAction(parent)) {
					break
				}
				parent = parent.before
			}
		}
	}
}

function buildTree(node: Node) {
	if (node.length >= 30) {
		resolveFromNode(node)
		return
	}
	if (isAction(node) && node.open.size === graph.size) {
		resolveFromNode(node)
		return
	}
	// if (node.length < 5)
	// 	console.log(`tree building, step ${String(node.length).padStart(2, '0')}: ${nodePath(node)}`)

	const valve = graph.get(node.in)
	if (!valve) throw new Error(`no valve ${node.in}`)

	const after: Action[] = []

	const open = node.open.has(valve.name)
	if (!open && valve.flow > 0) {
		after.push({
			in: valve.name,
			type: "open",
			before: node,
			length: node.length + 1,
			open: new Set(node.open).add(valve.name),
		})
	}

	valve.leadsTo.forEach(to => {
		const uniquePath = findUniquePath(to[0], new Set([valve.name]))
		// avoid dead-ends
		if (uniquePath) {
			if (Array.from(uniquePath.values()).reduce((acc, name) => acc && (node.open.has(name) || graph.get(name)!.flow === 0), true)) {
				return
			}
		}
		after.push({
			in: to[0],
			type: "moveTo",
			before: node,
			length: node.length + to[1],
			open: new Set(node.open),
		})
	})

	node.after = after

	after.forEach((next, i) => {
		buildTree(next)

		// if (next.length === 1) {
		// 	console.log(resolveTree(actionTree, 0, 0))
		// 	after[i] = null
		// }
	})
}

function findUniquePath(next: string, acc: Set<string> = new Set()): Set<string> | false {
	acc.add(next)
	const nextValve = graph.get(next)!
	if (nextValve.leadsTo.length > 2) return false
	if (nextValve.leadsTo.length === 1) return acc

	const nextName = nextValve.leadsTo.find(([name]) => name !== next)!
	if (acc.has(nextName[0])) return acc
	return findUniquePath(nextName[0], acc)
}

function isAction(node: Node | Action): node is Action {
	return "type" in node
}

function resolveBranch(node: Node | Action): [Node | Action, Node | Action] {
	if (!isAction(node)) return [node, node]
	const parent = node.before
	const [tree, last] = resolveBranch(parent)
	last.after = [node]
	return [tree, node]
}

function resolveTree(node: Node | Action, releasedPerMinute: number, released: number): number {
	// console.log(`exploring ${node.in} with ${releasedPerMinute} released per minute and ${released} released in total, ${node.length} steps`)
	const newReleased = released + releasedPerMinute
	if (isAction(node)) {
		if (node.type === "open") {
			if (node.after) {
				const flow = graph.get(node.in)!.flow
				const scores = node.after.map(next => resolveTree(next, releasedPerMinute + flow, newReleased))
				return Math.max(...scores)
			} else {
				return newReleased
			}
		} else if (node.type === "moveTo") {
			if (node.after) {
				const scores = node.after.map(next => resolveTree(next, releasedPerMinute, newReleased))
				return Math.max(...scores)
			} else {
				return newReleased
			}
		} else {
			throw new Error(`unknown action type`)
		}
	} else {
		if (node.after) {
			const scores = node.after.map(next => resolveTree(next, releasedPerMinute, newReleased))
			return Math.max(...scores)
		} else {
			throw new Error(`no after for non-action node ${node.in}`)
		}
	}
}
