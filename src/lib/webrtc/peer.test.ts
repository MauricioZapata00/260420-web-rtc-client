import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { get } from 'svelte/store';
import { connection, peerId, resetConnection } from '$lib/stores/connection';
import { remoteStreams, clearRemoteStreams } from '$lib/stores/remoteStreams';

vi.mock('$lib/services', () => ({ sendOffer: vi.fn() }));

import { sendOffer } from '$lib/services';
import { createPeerConnection, initiateConnection } from './peer';

interface MockPC {
	config: RTCConfiguration;
	connectionState: RTCPeerConnectionState;
	onconnectionstatechange: (() => void) | null;
	ondatachannel: ((e: { channel: RTCDataChannel }) => void) | null;
	ontrack: ((e: RTCTrackEvent) => void) | null;
	createOffer: ReturnType<typeof vi.fn>;
	setLocalDescription: ReturnType<typeof vi.fn>;
	setRemoteDescription: ReturnType<typeof vi.fn>;
	createDataChannel: ReturnType<typeof vi.fn>;
}

let mockPC: MockPC;

function buildMockPC(config: RTCConfiguration): MockPC {
	return {
		config,
		connectionState: 'new',
		onconnectionstatechange: null,
		ondatachannel: null,
		ontrack: null,
		createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'offer-sdp' }),
		setLocalDescription: vi.fn().mockResolvedValue(undefined),
		setRemoteDescription: vi.fn().mockResolvedValue(undefined),
		createDataChannel: vi
			.fn()
			.mockReturnValue({ onopen: null, onmessage: null, onclose: null, readyState: 'connecting' })
	};
}

beforeEach(() => {
	resetConnection();
	clearRemoteStreams();
	vi.mocked(sendOffer).mockReset();
	vi.stubGlobal('RTCPeerConnection', function MockRTCPeerConnection(config: RTCConfiguration) {
		mockPC = buildMockPC(config);
		return mockPC;
	});
});

afterEach(() => vi.unstubAllGlobals());

test('createPeerConnection configures the two Google STUN servers', () => {
	createPeerConnection();
	const urls = (mockPC.config.iceServers ?? []).flatMap((s) =>
		Array.isArray(s.urls) ? s.urls : [s.urls]
	);
	expect(urls).toContain('stun:stun.l.google.com:19302');
	expect(urls).toContain('stun:stun1.l.google.com:19302');
});

test('onconnectionstatechange connected calls setConnected', () => {
	createPeerConnection();
	mockPC.connectionState = 'connected';
	mockPC.onconnectionstatechange!();
	expect(get(connection).state).toBe('connected');
});

test('onconnectionstatechange failed calls setFailed', () => {
	createPeerConnection();
	mockPC.connectionState = 'failed';
	mockPC.onconnectionstatechange!();
	expect(get(connection).state).toBe('failed');
	expect(get(connection).error).not.toBeNull();
});

test('onconnectionstatechange closed calls setClosed', () => {
	createPeerConnection();
	mockPC.connectionState = 'closed';
	mockPC.onconnectionstatechange!();
	expect(get(connection).state).toBe('closed');
});

test('ontrack with a stream updates remoteStreams', () => {
	createPeerConnection();
	const mockStream = { id: 'stream-1' } as MediaStream;
	mockPC.ontrack!({ streams: [mockStream] } as unknown as RTCTrackEvent);
	expect(get(remoteStreams)).toHaveLength(1);
	expect(get(remoteStreams)[0].stream).toBe(mockStream);
});

test('initiateConnection happy path sets connected state and returns peerId', async () => {
	vi.mocked(sendOffer).mockResolvedValue({ peer_id: 'peer-abc', sdp: 'answer-sdp' });
	const result = await initiateConnection();
	expect(get(connection).state).toBe('connected');
	expect(get(peerId)).toBe('peer-abc');
	expect(result.peerId).toBe('peer-abc');
});

test('initiateConnection error path calls setFailed and re-throws', async () => {
	vi.mocked(sendOffer).mockRejectedValue(new Error('network error'));
	await expect(initiateConnection()).rejects.toThrow('network error');
	expect(get(connection).state).toBe('failed');
	expect(get(connection).error).toBe('network error');
});
