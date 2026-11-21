import { Client } from '@opensearch-project/opensearch';
import { env } from '../config/env.js';

let osClient: Client | null = null;
let isOpenSearchConnected = false;

export function getOpenSearchClient(): Client {
  if (!osClient) {
    const node = env.OPENSEARCH_URL;
    const auth = env.OPENSEARCH_USERNAME && env.OPENSEARCH_PASSWORD ? {
      username: env.OPENSEARCH_USERNAME,
      password: env.OPENSEARCH_PASSWORD,
    } : undefined;

    osClient = new Client({
      node,
      auth,
      ssl: {
        rejectUnauthorized: false, // For managed cloud / self-signed certs
      },
      requestTimeout: 10000,
    });
  }
  return osClient;
}

export async function testOpenSearchConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
  try {
    const client = getOpenSearchClient();
    const info = await client.info();
    isOpenSearchConnected = true;
    console.log('[OpenSearch] Connected to Aiven OpenSearch cluster:', info.body.version.number);
    return { connected: true, version: info.body.version.number };
  } catch (err: any) {
    isOpenSearchConnected = false;
    console.warn(`[OpenSearch] Notice: ${err.message}. Provide valid OPENSEARCH_URL in .env.`);
    return { connected: false, error: err.message };
  }
}

export function isOpenSearchLive(): boolean {
  return isOpenSearchConnected;
}
