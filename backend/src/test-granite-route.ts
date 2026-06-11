import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import { AddressInfo } from 'node:net';
import { createGraniteRouter } from './routes/granite.routes';

const startServer = async (service: any) => {
  const app = express();
  app.use(express.json());
  app.use('/api/granite', createGraniteRouter(service));

  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  const port = address.port;

  return {
    port,
    close: async () => new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))),
  };
};

const fetchJson = async (url: string, body: unknown) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

const testValidQuestion = async () => {
  const stubService = {
    queryTutor: async () => ({
      success: true,
      is_mocked: false,
      mode: 'mock',
      latency_ms: 1,
      data: {
        needs_clarification: false,
        concept_id: 'false_9',
        concept_name: 'False 9',
        complexity: 'INTERMEDIATE',
        user_level: 'INTERMEDIATE',
        animation_module: 'false9',
        explanation: 'A False 9 is a striker who drops into midfield.',
        follow_up_suggestions: ['Explain the defensive response'],
      },
    }),
  };

  const server = await startServer(stubService);
  try {
    const { status, body } = await fetchJson(`http://127.0.0.1:${server.port}/api/granite/test`, {
      question: 'What is a False 9?',
    });

    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.concept_id, 'false_9');
    assert.strictEqual(body.data.concept_name, 'False 9');
  } finally {
    await server.close();
  }
};

const testMissingQuestion = async () => {
  const stubService = { queryTutor: async () => ({ success: true } as any) };
  const server = await startServer(stubService);
  try {
    const { status, body } = await fetchJson(`http://127.0.0.1:${server.port}/api/granite/test`, {});

    assert.strictEqual(status, 400);
    assert.strictEqual(body.success, false);
    assert.match(body.error.message, /required/i);
  } finally {
    await server.close();
  }
};

const testMissingConceptId = async () => {
  const stubService = {
    queryTutor: async () => ({
      success: true,
      is_mocked: false,
      mode: 'mock',
      latency_ms: 1,
      data: {
        needs_clarification: true,
        clarification_question: 'Can you clarify your question?',
      },
    }),
  };

  const server = await startServer(stubService);
  try {
    const { status, body } = await fetchJson(`http://127.0.0.1:${server.port}/api/granite/test`, {
      question: 'What is a False 9?',
    });

    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.concept_id, 'unknown');
    assert.strictEqual(body.data.clarification_question, 'Can you clarify your question?');
  } finally {
    await server.close();
  }
};

const testServiceErrorResponse = async () => {
  const stubService = {
    queryTutor: async () => ({
      success: false,
      error: { message: 'Service failure' },
    }),
  };

  const server = await startServer(stubService);
  try {
    const { status, body } = await fetchJson(`http://127.0.0.1:${server.port}/api/granite/test`, {
      question: 'What is a False 9?',
    });

    assert.strictEqual(status, 502);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.message, 'Service failure');
  } finally {
    await server.close();
  }
};

const run = async () => {
  await testValidQuestion();
  await testMissingQuestion();
  await testMissingConceptId();
  await testServiceErrorResponse();
  console.log('✅ Granite route tests passed.');
};

run().catch((err) => {
  console.error('Granite route tests failed:', err);
  process.exit(1);
});
