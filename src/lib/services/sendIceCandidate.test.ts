import { test, expect, vi } from 'vitest';
import { sendIceCandidate } from './sendIceCandidate';

function mockWs() {
	return { send: vi.fn() } as unknown as WebSocket;
}

function mockCandidate(): RTCIceCandidate {
	return {
		candidate: 'candidate:0 1 UDP 2122252543 192.168.1.1 54321 typ host',
		sdpMid: '0',
		sdpMLineIndex: 0
	} as RTCIceCandidate;
}

test('sends a candidate message over the WebSocket', () => {
	const ws = mockWs();
	sendIceCandidate(ws, mockCandidate());
	expect(ws.send).toHaveBeenCalledOnce();
});

test('serialises candidate fields to snake_case data properties', () => {
	const ws = mockWs();
	sendIceCandidate(ws, mockCandidate());
	const sent = JSON.parse((ws.send as ReturnType<typeof vi.fn>).mock.calls[0][0]);
	expect(sent.type).toBe('candidate');
	expect(sent.data.candidate).toBe('candidate:0 1 UDP 2122252543 192.168.1.1 54321 typ host');
	expect(sent.data.sdp_mid).toBe('0');
	expect(sent.data.sdp_mline_index).toBe(0);
});

test('does not call ws.send when candidate is null', () => {
	const ws = mockWs();
	sendIceCandidate(ws, null);
	expect(ws.send).not.toHaveBeenCalled();
});
