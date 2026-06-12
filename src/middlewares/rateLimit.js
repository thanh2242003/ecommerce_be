'use strict';

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 10;

const buckets = new Map();

const getClientKey = (req, keyGenerator) => {
    if (typeof keyGenerator === 'function') {
        return keyGenerator(req);
    }

    return req.user?.userId || req.headers['x-client-id'] || req.ip || 'anonymous';
};

const createRateLimiter = ({
    windowMs = DEFAULT_WINDOW_MS,
    max = DEFAULT_MAX_REQUESTS,
    keyGenerator,
    message = 'Too many requests, please try again later',
} = {}) => {
    return (req, res, next) => {
        const now = Date.now();
        const key = String(getClientKey(req, keyGenerator));
        const bucket = buckets.get(key);

        if (!bucket || bucket.resetAt <= now) {
            buckets.set(key, {
                count: 1,
                resetAt: now + windowMs,
            });
            return next();
        }

        bucket.count += 1;

        if (bucket.count <= max) {
            return next();
        }

        const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
        res.set('Retry-After', String(retryAfterSeconds));

        return res.status(429).json({
            code: 429,
            message,
            metadata: {
                retryAfterSeconds,
            },
        });
    };
};

module.exports = {
    createRateLimiter,
};
