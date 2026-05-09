import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { openSignalingSocket, closeSignalingSocket } from './signalingSocket';

vi.mock('$lib/services', () => ({
	sendIceCandidate: vi.fn(),
	sendRenegotiationAnswer: vi.fn()
}));

import { sendIceCandidate, sendRenegotiationAnswer } from '$lib/services';

interface MockWS {
	url: string;
	readyState: number;
	send: ReturnType<typeof vi.fn>;
	close: ReturnType<typeof vi.fn>;
	onmessage: ((e: MessageEvent<string>) => Promise<void>) | null;
}

interface MockPC {
	onicecandidate: ((e: RTCPeerConnectionIceEvent) => void) | null;
	addIceCandidate: ReturnType<typeof vi.fn>;
	setRemoteDescription: ReturnType<typeof vi.fn>;
	createAnswer: ReturnType<typeof vi.fn>;
	setLocalDescription: ReturnType<typeof vi.fn>;
}

let mockWs: MockWS;
let mockPc: MockPC;

function buildMockWS(url: string): MockWS {
	return { url, readyState: WebSocket.OPEN, send: vi.fn(), close: vi.fn(), onmessage: null };
}

function message(payload: object) {
	return { data: JSON.stringify(payload) } as MessageEvent<string>;
}

beforeEach(() => {
	vi.mocked(sendIceCandidate).mockReset();
	vi.mocked(sendRenegotiationAnswer).mockReset();

	vi.stubGlobal(
		'WebSocket',
		Object.assign(
			function MockWebSocket(url: string) {
				mockWs = buildMockWS(url);
				return mockWs;
			},
			{ CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 }
		)
	);

	mockPc = {
		onicecandidate: null,
		addIceCandidate: vi.fn().mockResolvedValue(undefined),
		setRemoteDescription: vi.fn().mockResolvedValue(undefined),
		createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'answer-sdp' }),
		setLocalDescription: vi.fn().mockResolvedValue(undefined)
	};
});

afterEach(() => vi.unstubAllGlobals());

test('openSignalingSocket constructs WebSocket with URL containing peer_id', () => {
	openSignalingSocket(mockPc as unknown as RTCPeerConnection, 'peer-123');
	expect(mockWs.url).toContain('peer-123');
});

test('pc.onicecandidate with a valid candidate calls sendIceCandidate', () => {
	openSignalingSocket(mockPc as unknown as RTCPeerConnection, 'peer-123');
	const candidate = { candidate: 'cand', sdpMid: '0', sdpMLineIndex: 0 } as RTCIceCandidate;
	mockPc.onicecandidate!({ candidate } as RTCPeerConnectionIceEvent);
	expect(sendIceCandidate).toHaveBeenCalledOnce();
	expect(sendIceCandidate).toHaveBeenCalledWith(mockWs, candidate);
});

test('pc.onicecandidate with null candidate does not call sendIceCandidate', () => {
	openSignalingSocket(mockPc as unknown as RTCPeerConnection, 'peer-123');
	mockPc.onicecandidate!({ candidate: null } as RTCPeerConnectionIceEvent);
	expect(sendIceCandidate).toHaveBeenCalledWith(mockWs, null);
});

test('ws.onmessage candidate calls pc.addIceCandidate with the data', async () => {
	openSignalingSocket(mockPc as unknown as RTCPeerConnection, 'peer-123');
	const data = { candidate: 'cand', sdp_mid: '0', sdp_mline_index: 0 };
	await mockWs.onmessage!(message({ type: 'candidate', data }));
	expect(mockPc.addIceCandidate).toHaveBeenCalledWith(data);
});

test('ws.onmessage done does not throw and has no side effects on the peer connection', async () => {
	openSignalingSocket(mockPc as unknown as RTCPeerConnection, 'peer-123');
	await expect(mockWs.onmessage!(message({ type: 'done' }))).resolves.toBeUndefined();
	expect(mockPc.addIceCandidate).not.toHaveBeenCalled();
	expect(mockPc.setRemoteDescription).not.toHaveBeenCalled();
});

test('ws.onmessage offer drives full renegotiation and sends answer', async () => {
	openSignalingSocket(mockPc as unknown as RTCPeerConnection, 'peer-123');
	await mockWs.onmessage!(message({ type: 'offer', data: { sdp: 'offer-sdp' } }));
	expect(mockPc.setRemoteDescription).toHaveBeenCalledWith({ type: 'offer', sdp: 'offer-sdp' });
	expect(mockPc.createAnswer).toHaveBeenCalledOnce();
	expect(mockPc.setLocalDescription).toHaveBeenCalledWith({ type: 'answer', sdp: 'answer-sdp' });
	expect(sendRenegotiationAnswer).toHaveBeenCalledOnce();
});

test('ws.onmessage with unknown type does not throw', async () => {
	openSignalingSocket(mockPc as unknown as RTCPeerConnection, 'peer-123');
	await expect(mockWs.onmessage!(message({ type: 'unknown' }))).resolves.toBeUndefined();
});

test('closeSignalingSocket calls ws.close when readyState is OPEN', () => {
	openSignalingSocket(mockPc as unknown as RTCPeerConnection, 'peer-123');
	mockWs.readyState = WebSocket.OPEN;
	closeSignalingSocket(mockWs as unknown as WebSocket);
	expect(mockWs.close).toHaveBeenCalledOnce();
});

test('closeSignalingSocket does not call ws.close when readyState is CLOSED', () => {
	openSignalingSocket(mockPc as unknown as RTCPeerConnection, 'peer-123');
	mockWs.readyState = WebSocket.CLOSED;
	closeSignalingSocket(mockWs as unknown as WebSocket);
	expect(mockWs.close).not.toHaveBeenCalled();
});
