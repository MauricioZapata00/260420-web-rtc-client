import { writable } from 'svelte/store';
import type { ChatMessage } from '$lib/types';

export const messages = writable<ChatMessage[]>([]);

export function addMessage(msg: ChatMessage): void {
	messages.update((list) => [...list, msg]);
}

export function clearMessages(): void {
	messages.set([]);
}
