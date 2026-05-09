export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'failed' | 'closed';

export interface SdpOffer {
	sdp: string;
}

export interface OfferResponse {
	peer_id: string;
	sdp: string;
}

export interface IceCandidate {
	candidate: string;
	sdp_mid: string | null;
	sdp_mline_index: number | null;
}

export type IceWsMessage =
	| { type: 'candidate'; data: IceCandidate }
	| { type: 'done' }
	| { type: 'offer'; data: { sdp: string } };

export type IceWsClientMessage =
	| { type: 'candidate'; data: IceCandidate }
	| { type: 'answer'; data: { sdp: string } };

export interface ChatMessage {
	from: string;
	text: string;
}

export interface MediaState {
	cameraEnabled: boolean;
	micEnabled: boolean;
}
