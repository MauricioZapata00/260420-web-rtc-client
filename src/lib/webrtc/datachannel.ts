import { addMessage } from '$lib/stores/messages';
import type { ChatMessage } from '$lib/types';

export function openDataChannel(pc: RTCPeerConnection): RTCDataChannel {
	const dc = pc.createDataChannel('chat');

	dc.onopen = () => {};
	dc.onmessage = (event: MessageEvent<string>) => {
		try {
			const msg: ChatMessage = JSON.parse(event.data);
			addMessage(msg);
		} catch {
			// ignore malformed messages
		}
	};
	dc.onclose = () => {};

	return dc;
}

export function sendChatMessage(dc: RTCDataChannel, text: string): void {
	if (dc.readyState === 'open') dc.send(text);
}
