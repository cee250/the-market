import serverless from 'serverless-http';
import { createApp } from '../../server/src/main';

process.env.NETLIFY_FUNCTION_NAME ??= 'api';

let handlerPromise: Promise<ReturnType<typeof serverless>> | undefined;

async function getHandler(): Promise<Handler> {
  if (!handlerPromise) {
    handlerPromise = createApp().then((app) => serverless(app.getHttpAdapter().getInstance()));
  }
  return handlerPromise;
}

export const handler = async (event: Parameters<ReturnType<typeof serverless>>[0], context: Parameters<ReturnType<typeof serverless>>[1]) => {
  try {
    const appHandler = await getHandler();
    return appHandler(event, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown API startup error';
    console.error('[netlify-api] startup failure', message);
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: message }) };
  }
};
