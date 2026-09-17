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
      return serverless(app.getHttpAdapter().getInstance());
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
