'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const { verifySePaySignature } = require('../src/utils/sepayWebhook');

test('verifySePaySignature accepts valid raw-body signature', () => {
    const secret = 'test-secret';
    const raw = JSON.stringify({ id: 92704, code: 'OD1234', transferAmount: 100000, transferType: 'in' });
    const timestamp = `${Math.floor(Date.now() / 1000)}`;

    const signature = crypto
        .createHmac('sha256', secret)
        .update(raw)
        .digest('hex');

    const result = verifySePaySignature({
        rawBody: Buffer.from(raw),
        signature,
        timestamp,
        secret,
    });

    assert.equal(result.ok, true);
});

test('verifySePaySignature rejects old timestamp', () => {
    const secret = 'test-secret';
    const raw = JSON.stringify({ id: 92704, code: 'OD1234', transferAmount: 100000, transferType: 'in' });
    const oldTimestamp = `${Math.floor((Date.now() - 10 * 60 * 1000) / 1000)}`;

    const signature = crypto
        .createHmac('sha256', secret)
        .update(raw)
        .digest('hex');

    const result = verifySePaySignature({
        rawBody: Buffer.from(raw),
        signature,
        timestamp: oldTimestamp,
        secret,
    });

    assert.equal(result.ok, false);
    assert.match(result.reason, /timestamp/i);
});

test('verifySePaySignature rejects invalid signature', () => {
    const result = verifySePaySignature({
        rawBody: Buffer.from('{"id":1}'),
        signature: 'invalid',
        timestamp: `${Math.floor(Date.now() / 1000)}`,
        secret: 'test-secret',
    });

    assert.equal(result.ok, false);
    assert.match(result.reason, /signature/i);
});
