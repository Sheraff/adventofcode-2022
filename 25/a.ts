import {readFile} from "node:fs/promises"
import { dirname, join } from "node:path"

const cwd = new URL(dirname(import.meta.url)).pathname
const input = await readFile(join(cwd, "input-a.txt"), {encoding: "utf-8"})
const lines = input.split("\n")

const sum = lines.reduce((sum, line) => sum + fromBaseSnafu(line), 0)
const baseSnafu = toBaseSnafu(sum)
console.log({sum, baseSnafu})

/**
 * Base Snafu is a base 5 number system with the following characters:
 * "0" => 0
 * "1" => 1
 * "2" => 2
 * "-" => -1
 * "=" => -2
 */

function fromBaseSnafu(str: string) {
	return str.split('').reduce((sum, char, i, {length}) => {
		const power = length - i - 1
		const figure = char === '-' ? -1 : char === '=' ? -2 : Number(char)
		const value = figure * (5 ** power)
		return sum + value
	}, 0)
}

function toBaseSnafu(num: number) {
	const figures = num
		.toString(5)
		.split('')
		.reverse()
	const transformed: string[] = []
	for (let i = 0; i < figures.length; i++) {
		const char = figures[i]!
		if (['0', '1', '2'].includes(char)) {
			transformed.push(char)
			continue
		}
		transformed.push(minusFive(char))
		if (figures[i + 1] === undefined) {
			transformed.push('1')
		} else {
			figures[i + 1] = plusOne(figures[i + 1]!)
		}
	}
	return transformed
		.reverse()
		.join('')
}

function minusFive(a: string) {
	switch (a) {
		case '3': return '='
		case '4': return '-'
		case '5': return '0'
		default: throw new Error(`Invalid minusFive character: ${a}`)
	}
}

function plusOne(a: string) {
	switch (a) {
		case '=': return '-'
		case '-': return '0'
		case '0': return '1'
		case '1': return '2'
		case '2': return '3'
		case '3': return '4'
		case '4': return '5'
		default: throw new Error(`Invalid plusOne character: ${a}`)
	}
}

