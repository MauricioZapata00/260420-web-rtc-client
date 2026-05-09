import { sendIceCandidate, sendRenegotiationAnswer } from '$lib/services';
import type { IceWsMessage } from '$lib/types';

export function openSignalingSocket(pc: RTCPeerConnection, peerId: string): WebSocket {
	const ws = new WebSocket(`/ws/ice?peer_id=${peerId}`);

	pc.onicecandidate = ({ candidate }) => {
		sendIceCandidate(ws, candidate);
	};

	ws.onmessage = async ({ data }: MessageEvent<string>) => {
		const msg: IceWsMessage = JSON.parse(data);

		if (msg.type === 'candidate') {
			await pc.addIceCandidate(msg.data);
		} else if (msg.type === 'offer') {
			await pc.setRemoteDescription({ type: 'offer', sdp: msg.data.sdp });
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);
			sendRenegotiationAnswer(ws, answer);
		}
	};

	return ws;
}

export function closeSignalingSocket(ws: WebSocket): void {
	if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
		ws.close();
	}
}
