import { writable } from 'svelte/store';
import type { ConnectionState } from '$lib/types';

interface ConnectionStore {
	state: ConnectionState;
	error: string | null;
}

export const connection = writable<ConnectionStore>({ state: 'idle', error: null });
export const peerId = writable<string | null>(null);

export function setConnecting(): void {
	connection.update((s) => ({ ...s, state: 'connecting', error: null }));
}

export function setConnected(id: string): void {
	connection.update((s) => ({ ...s, state: 'connected', error: null }));
	peerId.set(id);
}

export function setFailed(error: string): void {
	connection.update((s) => ({ ...s, state: 'failed', error }));
}

export function setClosed(): void {
	connection.update((s) => ({ ...s, state: 'closed', error: null }));
}

export function resetConnection(): void {
	connection.set({ state: 'idle', error: null });
	peerId.set(null);
}
