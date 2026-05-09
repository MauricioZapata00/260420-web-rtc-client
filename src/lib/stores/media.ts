import { writable } from 'svelte/store';

interface MediaStore {
	cameraEnabled: boolean;
	micEnabled: boolean;
}

export const media = writable<MediaStore>({ cameraEnabled: true, micEnabled: true });

export function toggleCamera(): void {
	media.update((s) => ({ ...s, cameraEnabled: !s.cameraEnabled }));
}

export function toggleMic(): void {
	media.update((s) => ({ ...s, micEnabled: !s.micEnabled }));
}

export function setCamera(enabled: boolean): void {
	media.update((s) => ({ ...s, cameraEnabled: enabled }));
}

export function setMic(enabled: boolean): void {
	media.update((s) => ({ ...s, micEnabled: enabled }));
}
