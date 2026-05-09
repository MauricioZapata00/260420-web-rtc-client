import { beforeEach, test, expect } from 'vitest';
import { get } from 'svelte/store';
import {
	remoteStreams,
	addRemoteStream,
	removeRemoteStream,
	clearRemoteStreams
} from './remoteStreams';

const streamA = { id: 'stream-a' } as MediaStream;
const streamB = { id: 'stream-b' } as MediaStream;

beforeEach(() => clearRemoteStreams());

test('initial state is an empty array', () => {
	expect(get(remoteStreams)).toEqual([]);
});

test('addRemoteStream appends a new entry', () => {
	addRemoteStream('peer-1', streamA);
	const list = get(remoteStreams);
	expect(list).toHaveLength(1);
	expect(list[0]).toEqual({ peerId: 'peer-1', stream: streamA });
});

test('addRemoteStream does not mutate the previous array reference', () => {
	const before = get(remoteStreams);
	addRemoteStream('peer-1', streamA);
	expect(get(remoteStreams)).not.toBe(before);
});

test('removeRemoteStream removes the entry with the matching peerId', () => {
	addRemoteStream('peer-1', streamA);
	addRemoteStream('peer-2', streamB);
	removeRemoteStream('peer-1');
	const list = get(remoteStreams);
	expect(list).toHaveLength(1);
	expect(list[0].peerId).toBe('peer-2');
});

test('removeRemoteStream with non-existing peerId leaves the list unchanged', () => {
	addRemoteStream('peer-1', streamA);
	removeRemoteStream('peer-99');
	expect(get(remoteStreams)).toHaveLength(1);
});

test('clearRemoteStreams resets to an empty array', () => {
	addRemoteStream('peer-1', streamA);
	addRemoteStream('peer-2', streamB);
	clearRemoteStreams();
	expect(get(remoteStreams)).toEqual([]);
});
