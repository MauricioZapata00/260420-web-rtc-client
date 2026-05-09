import type { OfferResponse } from '$lib/types';

export async function sendOffer(_offer: RTCSessionDescriptionInit): Promise<OfferResponse> {
	throw new Error('Not implemented');
}
