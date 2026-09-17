import serverless from 'serverless-http';

// Set this before importing server/main.ts. Its bootstrap checks these markers
// to avoid starting a standalone HTTP listener and to omit the /api prefix.
process.env.NETLIFY_FUNCTION_NAME ??= 'api';

let handlerPromise: Promise<ReturnType<typeof serverless>> | undefined;

async function getHandler(): Promise<ReturnType<typeof serverless>> {
  if (!handlerPromise) {
    const { createApp } = await import('../../server/dist/main');
    handlerPromise = createApp().then(async (app) => {
      await app.init();
      return serverless(app.getHttpAdapter().getInstance(), {
        request: (request) => {
          if (request.body) {
            request.headers['content-type'] = 'application/json';
            request.headers['content-length'] = String(Buffer.byteLength(request.body));
          }
          return request;
        },
      });
    });
  }
  return handlerPromise;
}

export const handler = async (
  event: Parameters<ReturnType<typeof serverless>>[0],
  context: Parameters<ReturnType<typeof serverless>>[1],
) => {
  try {
    const appHandler = await getHandler();
    const requestEvent = { ...event } as typeof event & { path?: string; rawPath?: string; requestPath?: string };
    const stripFunctionPrefix = (path?: string) => path?.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api(?=\/|$)/, '') || path;
    requestEvent.path = stripFunctionPrefix(requestEvent.path);
    requestEvent.rawPath = stripFunctionPrefix(requestEvent.rawPath);
    requestEvent.requestPath = stripFunctionPrefix(requestEvent.requestPath);
    if (requestEvent.isBase64Encoded && typeof requestEvent.body === 'string') {
      requestEvent.body = Buffer.from(requestEvent.body, 'base64').toString('utf8');
      requestEvent.isBase64Encoded = false;
    }
    if (typeof requestEvent.body === 'string') {
      try {
        requestEvent.body = JSON.parse(requestEvent.body) as typeof requestEvent.body;
      } catch {
        // Leave non-JSON bodies untouched for the normal parser/validation path.
      }
    } else if (Array.isArray(requestEvent.body) && requestEvent.body.every((part) => typeof part === 'string')) {
      try {
        requestEvent.body = JSON.parse(requestEvent.body.join('')) as typeof requestEvent.body;
      } catch {
        // Leave malformed bodies untouched for the normal validation path.
      }
    } else if (requestEvent.body && typeof requestEvent.body === 'object' && !Buffer.isBuffer(requestEvent.body)) {
      const entries = Object.entries(requestEvent.body);
      if (entries.length > 0 && entries.every(([key, value]) => /^\d+$/.test(key) && typeof value === 'string')) {
        try {
          requestEvent.body = JSON.parse(entries.sort(([a], [b]) => Number(a) - Number(b)).map(([, value]) => value).join('')) as typeof requestEvent.body;
        } catch {
          // Leave malformed bodies untouched for the normal validation path.
        }
      }
    }
    if (requestEvent.body && typeof requestEvent.body === 'string') {
      const headers = Object.fromEntries(
        Object.entries(requestEvent.headers ?? {}).filter(([key]) => key.toLowerCase() !== 'content-type'),
      );
      requestEvent.headers = { ...headers, 'content-type': 'application/json' };
    }
    return appHandler(requestEvent, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown API startup error';
    console.error('[netlify-api] startup failure', message);
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: message }),
    };
  }
};

export default handler;
