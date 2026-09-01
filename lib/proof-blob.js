const blobCache = new Map();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUsableImageBlob(blob) {
  if (!blob || blob.size < 16) return false;
  const type = String(blob.type || '').toLowerCase();
  if (type.includes('json') || type.includes('text/html') || type.includes('text/plain')) {
    return false;
  }
  return true;
}

export function forgetProofBlob(proofKey) {
  if (proofKey) blobCache.delete(String(proofKey));
}

export async function loadProofBlob(fetcher, proofKey) {
  const key = String(proofKey || '').trim();
  if (!key) throw new Error('Proof file is missing.');
  const cached = blobCache.get(key);
  if (cached) return cached;

  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const blob = await fetcher(key);
      if (!isUsableImageBlob(blob)) {
        throw new Error('Proof image was not returned.');
      }
      blobCache.set(key, blob);
      return blob;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await wait(250 * (attempt + 1));
    }
  }

  throw lastError || new Error('Failed to load payment proof.');
}
