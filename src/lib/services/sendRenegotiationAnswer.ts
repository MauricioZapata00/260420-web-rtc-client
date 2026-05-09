import type { IceWsClientMessage } from '$lib/types';

export function sendRenegotiationAnswer(ws: WebSocket, answer: RTCSessionDescriptionInit): void {
	const msg: IceWsClientMessage = {
		type: 'answer',
		data: { sdp: answer.sdp ?? '' }
	};
	ws.send(JSON.stringify(msg));
}
