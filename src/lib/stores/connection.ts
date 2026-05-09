import { writable } from 'svelte/store';
import type { ConnectionState } from '$lib/types';

interface ConnectionStore {
	state: ConnectionState;
	error: string | null;
}

export const connection = writable<ConnectionStore>({ state: 'idle', error: null });
export const peerId = writable<string | null>(null);

export function setConnecting(): void {}
export function setConnected(_id: string): void {}
export function setFailed(_error: string): void {}
export function setClosed(): void {}
export function resetConnection(): void {}
