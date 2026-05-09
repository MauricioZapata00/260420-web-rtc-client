import { beforeEach, test, expect } from 'vitest';
import { get } from 'svelte/store';
import { media, toggleCamera, toggleMic, setCamera, setMic } from './media';

beforeEach(() => {
	setCamera(true);
	setMic(true);
});

test('initial state has both camera and mic enabled', () => {
	expect(get(media)).toEqual({ cameraEnabled: true, micEnabled: true });
});

test('toggleCamera twice returns cameraEnabled to its initial value', () => {
	toggleCamera();
	toggleCamera();
	expect(get(media).cameraEnabled).toBe(true);
});

test('toggleMic twice returns micEnabled to its initial value', () => {
	toggleMic();
	toggleMic();
	expect(get(media).micEnabled).toBe(true);
});

test('setCamera false then true restores cameraEnabled', () => {
	setCamera(false);
	expect(get(media).cameraEnabled).toBe(false);
	setCamera(true);
	expect(get(media).cameraEnabled).toBe(true);
});

test('setMic false then true restores micEnabled', () => {
	setMic(false);
	expect(get(media).micEnabled).toBe(false);
	setMic(true);
	expect(get(media).micEnabled).toBe(true);
});
