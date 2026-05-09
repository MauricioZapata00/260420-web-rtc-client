import { test, expect, vi, afterEach } from 'vitest';
import { sendOffer } from './sendOffer';

afterEach(() => vi.unstubAllGlobals());

function stubFetch(status: number, body: unknown) {
	const mock = vi.fn().mockResolvedValue({
		ok: status >= 200 && status < 300,
		status,
		json: () => Promise.resolve(body)
	});
	vi.stubGlobal('fetch', mock);
	return mock;
}

test('returns OfferResponse on HTTP 200', async () => {
	stubFetch(200, { peer_id: 'uuid-123', sdp: 'answer-sdp' });
	const result = await sendOffer({ type: 'offer', sdp: 'offer-sdp' });
	expect(result).toEqual({ peer_id: 'uuid-123', sdp: 'answer-sdp' });
});

test('throws an error containing the status code on non-OK response', async () => {
	stubFetch(500, 'Internal Server Error');
	await expect(sendOffer({ type: 'offer', sdp: 'offer-sdp' })).rejects.toThrow('500');
});

test('calls fetch with POST method and correct Content-Type header', async () => {
	const mock = stubFetch(200, { peer_id: 'uuid-123', sdp: 'answer-sdp' });
	await sendOffer({ type: 'offer', sdp: 'offer-sdp' });
	const [url, options] = mock.mock.calls[0] as [
		string,
		RequestInit & { headers: Record<string, string> }
	];
	expect(url).toBe('/offer');
	expect(options.method).toBe('POST');
	expect(options.headers['Content-Type']).toBe('application/json');
	expect(JSON.parse(options.body as string)).toEqual({ sdp: 'offer-sdp' });
});
