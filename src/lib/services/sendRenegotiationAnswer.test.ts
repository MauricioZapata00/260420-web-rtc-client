import { test, expect, vi } from 'vitest';
import { sendRenegotiationAnswer } from './sendRenegotiationAnswer';

function mockWs() {
	return { send: vi.fn() } as unknown as WebSocket;
}

test('sends an answer message over the WebSocket', () => {
	const ws = mockWs();
	sendRenegotiationAnswer(ws, { type: 'answer', sdp: 'v=0\r\n...' });
	expect(ws.send).toHaveBeenCalledOnce();
});

test('serialises the answer sdp correctly', () => {
	const ws = mockWs();
	sendRenegotiationAnswer(ws, { type: 'answer', sdp: 'v=0\r\n...' });
	const sent = JSON.parse((ws.send as ReturnType<typeof vi.fn>).mock.calls[0][0]);
	expect(sent.type).toBe('answer');
	expect(sent.data.sdp).toBe('v=0\r\n...');
});
