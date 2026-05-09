import { test, expect } from 'vitest';
import type { SdpOffer, OfferResponse, IceCandidate, ChatMessage, IceWsMessage } from './types';

test('SdpOffer round-trips through JSON', () => {
	const original: SdpOffer = { sdp: 'v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\n' };
	const parsed: SdpOffer = JSON.parse(JSON.stringify(original));
	expect(parsed.sdp).toBe(original.sdp);
});

test('OfferResponse round-trips through JSON', () => {
	const original: OfferResponse = {
		peer_id: '550e8400-e29b-41d4-a716-446655440000',
		sdp: 'v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\n'
	};
	const parsed: OfferResponse = JSON.parse(JSON.stringify(original));
	expect(parsed.peer_id).toBe(original.peer_id);
	expect(parsed.sdp).toBe(original.sdp);
});

test('IceCandidate round-trips through JSON with string fields', () => {
	const original: IceCandidate = {
		candidate: 'candidate:0 1 UDP 2122252543 192.168.1.1 54321 typ host',
		sdp_mid: '0',
		sdp_mline_index: 0
	};
	const parsed: IceCandidate = JSON.parse(JSON.stringify(original));
	expect(parsed.candidate).toBe(original.candidate);
	expect(parsed.sdp_mid).toBe(original.sdp_mid);
	expect(parsed.sdp_mline_index).toBe(original.sdp_mline_index);
});

test('IceCandidate round-trips through JSON with null fields', () => {
	const original: IceCandidate = {
		candidate: 'candidate:0 1 UDP 2122252543 192.168.1.1 54321 typ host',
		sdp_mid: null,
		sdp_mline_index: null
	};
	const parsed: IceCandidate = JSON.parse(JSON.stringify(original));
	expect(parsed.sdp_mid).toBeNull();
	expect(parsed.sdp_mline_index).toBeNull();
});

test('ChatMessage round-trips through JSON', () => {
	const original: ChatMessage = {
		from: '550e8400-e29b-41d4-a716-446655440000',
		text: 'hello everyone'
	};
	const parsed: ChatMessage = JSON.parse(JSON.stringify(original));
	expect(parsed.from).toBe(original.from);
	expect(parsed.text).toBe(original.text);
});

test('IceWsMessage candidate branch narrows correctly', () => {
	const raw = JSON.stringify({
		type: 'candidate',
		data: {
			candidate: 'candidate:0 1 UDP 2122252543 192.168.1.1 54321 typ host',
			sdp_mid: '0',
			sdp_mline_index: 0
		}
	});
	const msg: IceWsMessage = JSON.parse(raw);
	expect(msg.type).toBe('candidate');
	if (msg.type === 'candidate') {
		expect(msg.data.candidate).toBeDefined();
		expect(typeof msg.data.sdp_mline_index).toBe('number');
	}
});

test('IceWsMessage done branch narrows correctly', () => {
	const msg: IceWsMessage = JSON.parse('{"type":"done"}');
	expect(msg.type).toBe('done');
	expect('data' in msg).toBe(false);
});
