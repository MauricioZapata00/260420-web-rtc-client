import { beforeEach, test, expect, vi } from 'vitest';
import { get } from 'svelte/store';
import { messages, clearMessages } from '$lib/stores/messages';
import { openDataChannel, sendChatMessage } from './datachannel';

function makeDC(readyState: RTCDataChannelState = 'open') {
	return {
		onopen: null,
		onmessage: null as ((e: MessageEvent<string>) => void) | null,
		onclose: null,
		readyState,
		send: vi.fn()
	} as unknown as RTCDataChannel;
}

function makePC(dc: RTCDataChannel) {
	return { createDataChannel: vi.fn().mockReturnValue(dc) } as unknown as RTCPeerConnection;
}

beforeEach(() => clearMessages());

test('openDataChannel calls createDataChannel with the name chat', () => {
	const dc = makeDC();
	const pc = makePC(dc);
	openDataChannel(pc);
	expect(pc.createDataChannel).toHaveBeenCalledWith('chat');
});

test('dc.onmessage with valid ChatMessage JSON calls addMessage', () => {
	const dc = makeDC();
	const pc = makePC(dc);
	openDataChannel(pc);
	dc.onmessage!({
		data: JSON.stringify({ from: 'peer-a', text: 'hello' })
	} as MessageEvent<string>);
	expect(get(messages)).toHaveLength(1);
	expect(get(messages)[0]).toEqual({ from: 'peer-a', text: 'hello' });
});

test('dc.onmessage with malformed JSON does not throw', () => {
	const dc = makeDC();
	const pc = makePC(dc);
	openDataChannel(pc);
	expect(() => dc.onmessage!({ data: 'not-json' } as MessageEvent<string>)).not.toThrow();
});

test('sendChatMessage calls dc.send when readyState is open', () => {
	const dc = makeDC('open');
	sendChatMessage(dc, 'hello');
	expect(dc.send).toHaveBeenCalledWith('hello');
});

test('sendChatMessage does not call dc.send when readyState is connecting', () => {
	const dc = makeDC('connecting');
	sendChatMessage(dc, 'hello');
	expect(dc.send).not.toHaveBeenCalled();
});
