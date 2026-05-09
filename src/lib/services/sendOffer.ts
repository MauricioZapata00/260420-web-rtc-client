import type { OfferResponse } from '$lib/types';

export async function sendOffer(offer: RTCSessionDescriptionInit): Promise<OfferResponse> {
	const res = await fetch('/offer', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ sdp: offer.sdp })
	});
	if (!res.ok) throw new Error(`Signaling error: ${res.status}`);
	return res.json();
}
