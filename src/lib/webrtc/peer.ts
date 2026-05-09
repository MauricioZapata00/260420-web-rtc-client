import { get } from 'svelte/store';
import { sendOffer } from '$lib/services';
import {
	peerId as peerIdStore,
	setConnecting,
	setConnected,
	setFailed,
	setClosed
} from '$lib/stores/connection';
import { addMessage } from '$lib/stores/messages';
import { addRemoteStream } from '$lib/stores/remoteStreams';
import type { ChatMessage } from '$lib/types';
import { openDataChannel } from './datachannel';

const ICE_SERVERS: RTCIceServer[] = [
	{ urls: 'stun:stun.l.google.com:19302' },
	{ urls: 'stun:stun1.l.google.com:19302' }
];

export function createPeerConnection(): RTCPeerConnection {
	const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

	pc.onconnectionstatechange = () => {
		if (pc.connectionState === 'connected') {
			setConnected(get(peerIdStore) ?? '');
		} else if (pc.connectionState === 'failed') {
			setFailed('Peer connection failed');
		} else if (pc.connectionState === 'closed') {
			setClosed();
		}
	};

	pc.ondatachannel = ({ channel }) => {
		channel.onmessage = (event: MessageEvent<string>) => {
			try {
				const msg: ChatMessage = JSON.parse(event.data);
				addMessage(msg);
			} catch {
				// ignore malformed messages
			}
		};
		channel.onclose = () => {};
	};

	pc.ontrack = ({ streams }) => {
		if (streams[0]) addRemoteStream(streams[0].id, streams[0]);
	};

	return pc;
}

export async function initiateConnection(): Promise<{ pc: RTCPeerConnection; peerId: string }> {
	const pc = createPeerConnection();
	openDataChannel(pc);
	setConnecting();
	try {
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);
		const { peer_id, sdp } = await sendOffer(offer);
		await pc.setRemoteDescription({ type: 'answer', sdp });
		setConnected(peer_id);
		return { pc, peerId: peer_id };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		setFailed(message);
		throw err;
	}
}
