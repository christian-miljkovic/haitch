#!/usr/bin/env node
// Reads every product in the Shopify store through the Admin API (client
// credentials grant, so nothing needs installing in the admin) and writes
// lib/shopify-products.json. The catalog joins those store products to the
// twelve looks by handle or title to get purchasable variants.
//
//   npm run sync:shopify
//
// Needs SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in
// the environment or .env.local.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_VERSION = '2026-07';

export const PRODUCTS_QUERY = `
  query Products($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        handle
        title
        status
        variants(first: 100) {
          nodes { id title price availableForSale }
        }
      }
    }
  }
`;

const numericId = (gid) => Number(gid.split('/').pop());

export async function fetchAdminToken({ domain, clientId, clientSecret }, fetch = globalThis.fetch) {
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`Shopify token exchange failed (${res.status}): ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

export async function fetchAllProducts({ domain }, token, fetch = globalThis.fetch) {
  const products = [];
  let cursor = null;
  do {
    const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query: PRODUCTS_QUERY, variables: { cursor } }),
    });
    const body = await res.json();
    if (!res.ok || body.errors) {
      throw new Error(`Shopify products query failed (${res.status}): ${JSON.stringify(body.errors ?? body)}`);
    }
    const { nodes, pageInfo } = body.data.products;
    for (const p of nodes) {
      products.push({
        id: numericId(p.id),
        handle: p.handle,
        title: p.title,
        status: p.status,
        variants: p.variants.nodes.map((v) => ({
          id: numericId(v.id),
          size: v.title,
          price: Number(v.price),
          available: v.availableForSale,
        })),
      });
    }
    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (cursor);
  return products;
}

function loadEnv(root) {
  const file = path.join(root, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const root = path.resolve(fileURLToPath(import.meta.url), '../..');
  loadEnv(root);
  const config = {
    domain: process.env.SHOPIFY_STORE_DOMAIN,
    clientId: process.env.SHOPIFY_CLIENT_ID,
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
  };
  const missing = Object.entries(config).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error(`Missing ${missing.join(', ')}; set SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET.`);
    process.exit(1);
  }
  const token = await fetchAdminToken(config);
  const products = await fetchAllProducts(config, token);
  const out = path.join(root, 'lib', 'shopify-products.json');
  fs.writeFileSync(out, `${JSON.stringify({ syncedAt: new Date().toISOString(), products }, null, 2)}\n`);
  for (const p of products) {
    console.log(`${p.status.padEnd(8)} ${p.handle}  (${p.variants.length} variants)`);
  }
  console.log(`${products.length} products written to lib/shopify-products.json`);
}
