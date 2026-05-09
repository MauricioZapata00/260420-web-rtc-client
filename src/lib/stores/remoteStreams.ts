import { writable } from 'svelte/store';

interface RemoteStream {
	peerId: string;
	stream: MediaStream;
}

export const remoteStreams = writable<RemoteStream[]>([]);

export function addRemoteStream(peerId: string, stream: MediaStream): void {
	remoteStreams.update((list) => [...list, { peerId, stream }]);
}

export function removeRemoteStream(peerId: string): void {
	remoteStreams.update((list) => list.filter((s) => s.peerId !== peerId));
}

export function clearRemoteStreams(): void {
	remoteStreams.set([]);
}
