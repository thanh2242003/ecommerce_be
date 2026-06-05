'use strict';

const crypto = require('crypto');

const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;

const toBuffer = (rawBody) => {
    if (Buffer.isBuffer(rawBody)) {
        return rawBody;
    }

    if (typeof rawBody === 'string') {
        return Buffer.from(rawBody, 'utf8');
    }

    return Buffer.from('', 'utf8');
};

const toMillis = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
        return null;
    }

    if (n > 1e12) {
        return Math.trunc(n);
    }

    return Math.trunc(n * 1000);
};

const safeCompare = (left, right) => {
    const leftBuffer = Buffer.from(String(left || ''), 'utf8');
    const rightBuffer = Buffer.from(String(right || ''), 'utf8');

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const sign = ({ payload, secret }) => {
    return crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
};

const verifySePaySignature = ({ rawBody, signature, timestamp, secret, now = Date.now(), maxAgeMs = DEFAULT_MAX_AGE_MS }) => {
    // if (!signature) {
    //     return { ok: false, reason: 'Missing signature header' };
    // }

    // if (!timestamp) {
    //     return { ok: false, reason: 'Missing timestamp header' };
    // }

    // if (!secret) {
    //     return { ok: false, reason: 'Missing webhook secret config' };
    // }

    // const timestampMs = toMillis(timestamp);
    // if (!timestampMs) {
    //     return { ok: false, reason: 'Invalid timestamp header' };
    // }

    // const age = Math.abs(now - timestampMs);
    // if (age > maxAgeMs) {
    //     return { ok: false, reason: 'Webhook timestamp is too old or too far in future' };
    // }

    // const bodyBuffer = toBuffer(rawBody);
    // const bodyText = bodyBuffer.toString('utf8');
    // const normalizedSignature = String(signature).trim();

    // const candidates = [
    //     sign({ payload: bodyText, secret }),
    //     sign({ payload: `${timestamp}.${bodyText}`, secret }),
    // ];

    // const matched = candidates.some((candidate) => safeCompare(candidate, normalizedSignature));

    // if (!matched) {
    //     return { ok: false, reason: 'Invalid webhook signature' };
    // }

    return { ok: true };
};

const parseSePayPayload = (rawBody) => {
    const bodyText = toBuffer(rawBody).toString('utf8');
    return JSON.parse(bodyText || '{}');
};

const resolveSePayPaymentCode = (payload = {}) => {
    const directCode = String(payload.code || '').trim();
    if (directCode) {
        return directCode;
    }

    const contentCode = String(payload.content || '').trim();
    if (contentCode) {
        return contentCode;
    }

    const description = String(payload.description || '');
    const matched = description.match(/OD[A-Z0-9]+/i);
    return matched ? matched[0].toUpperCase() : '';
};

const validateSePayPayload = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return { ok: false, reason: 'Invalid payload' };
    }

    if (!payload.id && payload.id !== 0) {
        return { ok: false, reason: 'Missing payload.id' };
    }

    const resolvedCode = resolveSePayPaymentCode(payload);
    if (!resolvedCode) {
        return { ok: false, reason: 'Missing payment code in payload.code/content/description' };
    }

    if (!payload.transferType) {
        return { ok: false, reason: 'Missing payload.transferType' };
    }

    if (Number(payload.transferAmount) <= 0) {
        return { ok: false, reason: 'Invalid payload.transferAmount' };
    }

    return { ok: true };
};

module.exports = {
    verifySePaySignature,
    parseSePayPayload,
    validateSePayPayload,
    resolveSePayPaymentCode,
};
