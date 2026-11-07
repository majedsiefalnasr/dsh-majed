import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  RPC_ERROR_KINDS,
  RpcFailure,
  rpcErrorKind,
} from '../dist/rpc-errors.js';

test('rpcErrorKind maps failures to the stable kinds', () => {
  assert.deepEqual(
    [...RPC_ERROR_KINDS],
    [
      'invalid-request',
      'not-found',
      'forbidden',
      'conflict',
      'too-large',
      'unavailable',
      'internal',
    ],
  );
  assert.equal(rpcErrorKind(new RpcFailure('conflict', 'x')), 'conflict');
  assert.equal(
    rpcErrorKind(new Error('payload.a must be x')),
    'invalid-request',
  );
  assert.equal(
    rpcErrorKind(new Error('Image storage unavailable')),
    'unavailable',
  );
  for (const [status, kind] of [
    [400, 'invalid-request'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [409, 'conflict'],
    [413, 'too-large'],
    [503, 'unavailable'],
    [418, 'internal'],
  ])
    assert.equal(rpcErrorKind(Object.assign(new Error('e'), { status })), kind);
  assert.equal(rpcErrorKind(new Error('boom')), 'internal');
  assert.equal(rpcErrorKind('weird'), 'internal');
});
