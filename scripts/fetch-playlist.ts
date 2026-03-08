import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf-8');
const get = (key: string) => env.match(new RegExp(`${key}\\s*=\\s*(.+)`))?.[1]?.trim() ?? '';

const clientId = get('SPOTIFY_CLIENT_ID');
const clientSecret = get('SPOTIFY_CLIENT_SECRET');
const playlistId = '3k6Os3T678g6MNfcN5u3SX';

async function main() {
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const { access_token } = await tokenRes.json() as any;

  // Try with market parameter and fields filter
  const endpoints = [
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?market=NO&limit=50`,
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?market=US&limit=50`,
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&fields=items(track(id,name,artists(name)))`,
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?market=US&limit=50&fields=items(track(id,name,artists(name))),next,total`,
    `https://api.spotify.com/v1/playlists/${playlistId}?market=US&fields=tracks.total,tracks.items(track(id,name,artists(name))),tracks.next`,
  ];

  for (const url of endpoints) {
    console.error(`\nTrying: ${url.replace(access_token, '***')}`);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    console.error(`Status: ${res.status}`);
    const data = await res.json() as any;
    const preview = JSON.stringify(data).slice(0, 300);
    console.error(`Response: ${preview}`);
  }
}

main().catch(console.error);
