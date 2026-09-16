import serverless from 'serverless-http';
import type { Handler } from 'aws-lambda';
import { createApp } from '../../server/src/main';

let handlerPromise: Promise<Handler> | undefined;

async function getHandler(): Promise<Handler> {
  if (!handlerPromise) {
    handlerPromise = createApp().then((app) => serverless(app.getHttpAdapter().getInstance()));
  }
  return handlerPromise;
}

export const handler: Handler = async (event, context, callback) => {
  try {
    const appHandler = await getHandler();
    return appHandler(event, context, callback);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown API startup error';
    console.error('[netlify-api] startup failure', message);
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: message }) };
  }
};
