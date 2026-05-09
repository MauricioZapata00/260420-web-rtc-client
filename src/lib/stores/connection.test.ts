import { beforeEach, test, expect } from 'vitest';
import { get } from 'svelte/store';
import {
	connection,
	peerId,
	setConnecting,
	setConnected,
	setFailed,
	setClosed,
	resetConnection
} from './connection';

beforeEach(() => {
	resetConnection();
});

test('initial state is idle with no error and peerId is null', () => {
	expect(get(connection)).toEqual({ state: 'idle', error: null });
	expect(get(peerId)).toBeNull();
});

test('setConnecting sets state to connecting and clears error', () => {
	setConnecting();
	expect(get(connection)).toEqual({ state: 'connecting', error: null });
});

test('setConnected sets state to connected, stores peerId, and clears error', () => {
	setConnected('uuid-1');
	expect(get(connection)).toEqual({ state: 'connected', error: null });
	expect(get(peerId)).toBe('uuid-1');
});

test('setFailed sets state to failed and stores the error message', () => {
	setFailed('timeout');
	expect(get(connection)).toEqual({ state: 'failed', error: 'timeout' });
});

test('setClosed sets state to closed and clears error', () => {
	setClosed();
	expect(get(connection)).toEqual({ state: 'closed', error: null });
});

test('resetConnection resets state to idle with no error and null peerId', () => {
	setConnected('uuid-1');
	setFailed('oops');
	resetConnection();
	expect(get(connection)).toEqual({ state: 'idle', error: null });
	expect(get(peerId)).toBeNull();
});
