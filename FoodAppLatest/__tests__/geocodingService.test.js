import { searchAddress } from '../src/services/geocodingService';

function mockNominatimResponse(results) {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(results),
  });
}

global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('searchAddress', () => {
  test('returns empty array for short query', async () => {
    const [promise] = searchAddress('ab');
    const result = await promise;
    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('returns empty array for whitespace-only query', async () => {
    const [promise] = searchAddress('   ');
    const result = await promise;
    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('returns empty array when fetch returns non-ok', async () => {
    const calls = [];
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    const [promise] = searchAddress('Indore');
    const result = await promise;
    expect(result).toEqual([]);
    expect(fetch).toHaveBeenCalled();
    for (const call of fetch.mock.calls) {
      expect(call[0]).toContain('nominatim.openstreetmap.org');
    }
  });

  test('returns empty array when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    const [promise] = searchAddress('Indore');
    const result = await promise;
    expect(result).toEqual([]);
  });

  test('sequentially tries query variants and returns first results found', async () => {
    const mockResult1 = [
      { place_id: 100, importance: 0.5, display_name: 'Rajendra Nagar, Indore, Madhya Pradesh, India', lat: '22.7', lon: '75.9', address: { road: 'Rajendra Nagar', city: 'Indore', state: 'Madhya Pradesh' } },
    ];
    const emptyMock = [];

    const callResults = [emptyMock, mockResult1, emptyMock];
    let callIndex = 0;
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(callResults[callIndex++]),
      })
    );

    const [promise] = searchAddress('Rajendra Nagar Bijalpur Indore');
    const result = await promise;

    // Only 2 fetch calls — first variant empty, second variant succeeds
    expect(fetch.mock.calls.length).toBe(2);

    const urls = fetch.mock.calls.map(c => c[0]);
    expect(urls[0]).toContain(encodeURIComponent('Rajendra, Nagar, Bijalpur, Indore'));
    expect(urls[1]).toContain(encodeURIComponent('Rajendra, Nagar, Indore'));

    expect(result.length).toBe(1);
    expect(result[0].displayName).toBe('Rajendra Nagar, Indore, Madhya Pradesh');
    expect(result[0].latitude).toBe(22.7);
    expect(result[0].longitude).toBe(75.9);
  });

  test('caps results at 6', async () => {
    const createItem = (id, importance) => ({
      place_id: id,
      importance,
      display_name: `Place ${id}, Indore, Madhya Pradesh, India`,
      lat: '22.7',
      lon: '75.9',
      address: { road: `Road ${id}`, city: 'Indore', state: 'Madhya Pradesh' },
    });

    const manyResults = Array.from({ length: 10 }, (_, i) => createItem(i + 1, (10 - i) / 10));

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(manyResults),
    });

    const [promise] = searchAddress('Indore');
    const result = await promise;
    expect(result.length).toBeLessThanOrEqual(6);
  });

  test('cancelFn aborts the controller', () => {
    const [, cancelFn] = searchAddress('Indore');
    expect(() => cancelFn()).not.toThrow();
  });

  test('typo variant is generated for missing letter (Rajndra -> Rajendra)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { place_id: 1, importance: 0.5, display_name: 'Rajendra Nagar, Indore, Madhya Pradesh, India', lat: '22.7', lon: '75.9', address: { road: 'Rajendra Nagar', city: 'Indore', state: 'Madhya Pradesh', postcode: '452001' } },
      ]),
    });

    const [promise] = searchAddress('Rajndra Nagar Indore');
    const result = await promise;
    expect(result.length).toBe(1);
    expect(result[0].displayName).toBe('Rajendra Nagar, Indore, Madhya Pradesh');
    expect(result[0].pinCode).toBe('452001');
  });

  test('short query (Indor) still generates variants and returns results', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { place_id: 1, importance: 0.6, display_name: 'Indore, Madhya Pradesh, India', lat: '22.7', lon: '75.9', address: { city: 'Indore', state: 'Madhya Pradesh', postcode: '452001' } },
      ]),
    });

    const [promise] = searchAddress('Indor');
    const result = await promise;
    expect(result.length).toBe(1);
    expect(result[0].displayName).toBe('Indore, Madhya Pradesh');
  });
});
