process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_DIR = 'D:/portfolio/public/images';
const CDN_BASE = 'https://pub-ea6cf7d0fc18449aa9cce3aee87abf18.r2.dev';
const ACCOUNT_ID = '93eb059c98d30a883375cfaf04bc20e6';
const BUCKET = 'portfolio-images';
const ACCESS_KEY = 'bf60d76fc62b3555e9b88a87c700af49';
const SECRET_KEY = 'b6559e116d5b308569514e23f5d42b96888f23fe1644dcca6bed7cd9997d4300';
const REGION = 'auto';
const SERVICE = 's3';

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
function hmacSha256(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest();
}
function getSigningKey(dateStamp) {
  const kDate = hmacSha256(Buffer.from('AWS4' + SECRET_KEY), dateStamp);
  const kRegion = hmacSha256(kDate, REGION);
  const kService = hmacSha256(kRegion, SERVICE);
  return hmacSha256(kService, 'aws4_request');
}

function getContentType(key) {
  const ext = path.extname(key).toLowerCase();
  return { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif' }[ext] || 'application/octet-stream';
}

async function uploadFile(filePath, objectKey) {
  const body = fs.readFileSync(filePath);
  const contentType = getContentType(objectKey);
  const payloadHash = sha256(body);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);

  // Virtual-hosted style: BUCKET.ACCOUNT_ID.r2.cloudflarestorage.com
  const host = `${BUCKET}.${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = `https://${host}/${objectKey}`;

  const headers = {
    'Host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    'Content-Type': contentType,
    'Content-Length': String(body.length),
  };

  const signedHeaderNames = 'content-length;content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = [
    'content-length:' + body.length,
    'content-type:' + contentType,
    'host:' + host,
    'x-amz-content-sha256:' + payloadHash,
    'x-amz-date:' + amzDate,
    '',
  ].join('\n');

  const canonicalRequest = [
    'PUT',
    '/' + objectKey,
    '',
    canonicalHeaders,
    signedHeaderNames,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(dateStamp);
  const signature = hmacSha256(signingKey, stringToSign).toString('hex');

  headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`;

  const resp = await fetch(url, { method: 'PUT', headers, body });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text.substring(0, 200)}`);
  }
  return true;
}

function* walkDir(dir, prefix = 'images/') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      yield* walkDir(path.join(dir, entry.name), prefix + entry.name + '/');
    } else {
      yield { key: prefix + entry.name, filePath: path.join(dir, entry.name) };
    }
  }
}

async function main() {
  const files = [...walkDir(BASE_DIR)];
  console.log(`Found ${files.length} files\n`);

  const cdnMap = {};
  let ok = 0, fail = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    try {
      await uploadFile(f.filePath, f.key);
      ok++;
      cdnMap['/' + f.key] = CDN_BASE + '/' + f.key;
      console.log(`[${i+1}/${files.length}] OK  ${f.key}`);
    } catch (e) {
      fail++;
      console.log(`[${i+1}/${files.length}] FAIL ${f.key} - ${e.message}`);
    }
  }

  console.log(`\n=== Done! OK: ${ok}, Failed: ${fail} ===`);
  fs.writeFileSync('D:/portfolio/_cdn_map.json', JSON.stringify(cdnMap, null, 2), 'utf8');
  console.log(`Map saved. CDN: ${CDN_BASE}`);
}

main().catch(console.error);
