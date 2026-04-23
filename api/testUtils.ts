import type { VercelRequest, VercelResponse } from '@vercel/node';

export type MockResponse = {
  res: VercelResponse;
  statusCode: () => number;
  jsonBody: () => unknown;
  sentBody: () => unknown;
  headers: () => Record<string, string>;
};

export const createMockResponse = (): MockResponse => {
  let currentStatus = 200;
  let jsonPayload: unknown;
  let sentPayload: unknown;
  const headerMap: Record<string, string> = {};

  const res = {
    setHeader: (name: string, value: unknown) => {
      headerMap[name] = String(value);
      return res;
    },
    status: (code: number) => {
      currentStatus = code;
      return res;
    },
    json: (payload: unknown) => {
      jsonPayload = payload;
      return res;
    },
    send: (payload: unknown) => {
      sentPayload = payload;
      return res;
    },
    end: () => res,
  } as unknown as VercelResponse;

  return {
    res,
    statusCode: () => currentStatus,
    jsonBody: () => jsonPayload,
    sentBody: () => sentPayload,
    headers: () => headerMap,
  };
};

export const createMockRequest = (partial: Partial<VercelRequest>): VercelRequest => {
  return {
    method: 'GET',
    headers: {},
    query: {},
    body: undefined,
    ...partial,
  } as unknown as VercelRequest;
};
