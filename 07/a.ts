import * as readline from 'node:readline/promises'
import { dirname, join } from "node:path"
import { createReadStream } from 'node:fs'

const cwd = new URL(dirname(import.meta.url)).pathname
const rl = readline.createInterface({
	input: createReadStream(join(cwd, "input-a.txt"), { encoding: "utf-8" })
})

type Dir = {
	name: string
	children: (Dir | File)[]
	parent?: Dir
	size: number
}
type File = {
	size: number
	name: string
}

const MAX_SIZE = 100_000

void async function () {
	const tree: Dir = {
		name: "/",
		children: [],
		size: 0,
	}
	let currentDir = tree
	for await (const line of rl) {
		const mode = line.startsWith("$") ? "cmd" : "out"
		if (mode === "cmd") {
			if (line.startsWith("$ ls")) {
				continue
			}
			if (line.startsWith("$ cd")) {
				// create or select dir
				const path = line.split(" ")[2]!
				if (path === "..") {
					currentDir = currentDir.parent!
				} else {
					const dir = currentDir.children.find(child => child.name === path) as Dir
					if (dir) {
						currentDir = dir
					} else {
						const newDir: Dir = {
							name: path,
							children: [],
							parent: currentDir,
							size: 0,
						}
						currentDir.children.push(newDir)
						currentDir = newDir
					}
				}
				continue
			}
		} else if (mode === "out") {
			// create file and add to dir
			const parts = line.split(" ")
			const size = Number(parts[0])
			const name = parts[1]!
			if (!Number.isNaN(size)) {
				const file: File = {
					size,
					name
				}
				currentDir.children.push(file)
				let walkDir: Dir | undefined = currentDir
				do {
					walkDir.size += size
					walkDir = walkDir.parent
				} while (walkDir)
			}
		}
	}
	// sum all dir sizes < MAX_SIZE
	let sum = 0
	function walk(dir: Dir) {
		for (const child of dir.children) {
			if ("children" in child) {
				if (child.size < MAX_SIZE) {
					sum += child.size
				}
				walk(child)
			}
		}
	}
	walk(tree)
	console.log({sum})
}()

