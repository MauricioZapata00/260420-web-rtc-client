import { beforeEach, test, expect } from 'vitest';
import { get } from 'svelte/store';
import { messages, addMessage, clearMessages } from './messages';

const msgA = { from: 'peer-a', text: 'hello' };
const msgB = { from: 'peer-b', text: 'world' };

beforeEach(() => {
	clearMessages();
});

test('initial state is an empty array', () => {
	expect(get(messages)).toEqual([]);
});

test('addMessage appends without mutating the previous array reference', () => {
	const before = get(messages);
	addMessage(msgA);
	expect(get(messages)).not.toBe(before);
	expect(before).toHaveLength(0);
});

test('two addMessage calls produce a list of length 2 in insertion order', () => {
	addMessage(msgA);
	addMessage(msgB);
	const result = get(messages);
	expect(result).toHaveLength(2);
	expect(result[0]).toEqual(msgA);
	expect(result[1]).toEqual(msgB);
});

test('clearMessages resets to an empty array', () => {
	addMessage(msgA);
	addMessage(msgB);
	clearMessages();
	expect(get(messages)).toEqual([]);
});
