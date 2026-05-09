import type { IceWsClientMessage } from '$lib/types';

export function sendIceCandidate(ws: WebSocket, candidate: RTCIceCandidate | null): void {
	if (!candidate) return;
	const msg: IceWsClientMessage = {
		type: 'candidate',
		data: {
			candidate: candidate.candidate,
			sdp_mid: candidate.sdpMid,
			sdp_mline_index: candidate.sdpMLineIndex
		}
	};
	ws.send(JSON.stringify(msg));
}
