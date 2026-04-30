// 'use strict';

// const JWT = require('jsonwebtoken');
// const { asyncHandler } = require('../helpers/asyncHandler');
// const { AuthFailureError, NotFoundError } = require('../core/error.response');
// const { findByUserId } = require('../services/keyToken.service');



// const HEADER = {
//     API_KEY: 'x-api-key',
//     CLIENT_ID: 'x-client-id',
//     AUTHORIZATION: 'authorization',
//     REFRESH_TOKEN: 'x-rtoken-id',
// }

// const createTokenPair = async (payload, publicKey, privateKey) => {
//     try {
//         const accessToken = await JWT.sign(payload, publicKey, {
//             expiresIn: '2 days',
//         })

//         const refreshToken = await JWT.sign(payload, privateKey, {
//             expiresIn: '7 days',
//         })

//         JWT.verify(accessToken, publicKey, (error, decode) => {
//             if (error) {
//                 console.log('error verify:: ', error)
//             } else {
//                 console.log('decoded verify:: ', decode)
//             }
//         })


//         return { accessToken: accessToken, refreshToken: refreshToken }
//     } catch (error) {

//     }
// }

// const authenticationV2 = asyncHandler(async (req, res, next) => {

//     const userId = req.headers[HEADER.CLIENT_ID]

//     if (!userId) {
//         throw new AuthFailureError('Invalid request')
//     }

//     const keyStore = await findByUserId(userId)

//     if (!keyStore) {
//         throw new NotFoundError('Not found keyStore')
//     }

//     if (req.headers[HEADER.REFRESH_TOKEN]) {
//         try {

//             const refreshToken = req.headers[HEADER.REFRESH_TOKEN]

//             const decodeUser = JWT.verify(refreshToken, keyStore.privateKey)
//             if (userId != decodeUser.userId) throw new AuthFailureError('Invalid UserId')

//             req.refreshToken = refreshToken
//             req.user = decodeUser
//             req.keyStore = keyStore
//             return next()
//         } catch (error) {

//             throw error
//         }

//     }


//     const accessToken = req.headers[HEADER.AUTHORIZATION]
//     if (!accessToken) {
//         throw new AuthFailureError('Invalid accessToken')
//     }
//     try {
//         const decodeUser = JWT.verify(accessToken, keyStore.publicKey,)
//         if (userId != decodeUser.userId) throw new AuthFailureError('Invalid UserId')
//         req.user = decodeUser
//         req.keyStore = keyStore
//         return next()
//     } catch (error) {

//         throw error
//     }

// })

// const authentication = asyncHandler(async (req, res, next) => {
//     /*
//         1- check userId missing ?
//         2- get access token
//         3- verify token
//         4- check user in database
//         5- check keyStore with userId
//         6- OK-all return next()
//     */



//     const userId = req.headers[HEADER.CLIENT_ID]

//     if (!userId) {
//         throw new AuthFailureError('Invalid request')
//     }

//     const keyStore = await findByUserId(userId)

//     if (!keyStore) {
//         throw new NotFoundError('Not found keyStore')
//     }

//     const accessToken = req.headers[HEADER.AUTHORIZATION]
//     if (!accessToken) {
//         throw new AuthFailureError('Invalid accessToken')
//     }


//     try {
//         const decodeUser = JWT.verify(accessToken, keyStore.publicKey,)
//         if (userId != decodeUser.userId) throw new AuthFailureError('Invalid UserId')

//         req.keyStore = keyStore
//         return next()
//     } catch (error) {

//         throw error
//     }

// })

// const verifyJWT = async (token, keySecret) => {
//     return await JWT.verify(token, keySecret)
// }

// /**
//  * optionalAuth — non-throwing variant of authenticationV2.
//  * If a valid x-client-id + authorization pair is present, it populates
//  * req.user exactly like authenticationV2. Otherwise it silently continues.
//  * Use this on public endpoints that want to personalise for logged-in users
//  * without blocking anonymous access.
//  */
// const optionalAuth = async (req, res, next) => {
//     try {
//         const userId = req.headers[HEADER.CLIENT_ID];
//         if (!userId) return next();

//         const keyStore = await findByUserId(userId);
//         if (!keyStore) return next();

//         const accessToken = req.headers[HEADER.AUTHORIZATION];
//         if (!accessToken) return next();

//         const decodeUser = JWT.verify(accessToken, keyStore.publicKey);
//         if (userId !== decodeUser.userId) return next();

//         req.user = decodeUser;
//         req.keyStore = keyStore;
//     } catch (_) {
//         // invalid / expired token — just continue as anonymous
//     }
//     return next();
// };

// module.exports = {
//     createTokenPair,
//     authentication,
//     authenticationV2,
//     optionalAuth,
//     verifyJWT
// }
'use strict';

const JWT = require('jsonwebtoken');
const { asyncHandler } = require('../helpers/asyncHandler');
const { AuthFailureError, NotFoundError } = require('../core/error.response');
const { findByUserId } = require('../services/keyToken.service');

const HEADER = {
    API_KEY: 'x-api-key',
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization',
    REFRESH_TOKEN: 'x-rtoken-id',
};

// ================= PUBLIC ROUTES =================
const PUBLIC_PATHS = [
    '/shop/signup',
    '/shop/signin',
    '/user/signup',
    '/user/signin',
    '/admin/auth/login'
];

// ================= CREATE TOKEN =================
const createTokenPair = async (payload, publicKey, privateKey) => {
    try {
        const accessToken = JWT.sign(payload, publicKey, {
            expiresIn: '2 days',
        });

        const refreshToken = JWT.sign(payload, privateKey, {
            expiresIn: '7 days',
        });

        return { accessToken, refreshToken };
    } catch (error) {
        throw error;
    }
};

// ================= AUTH V2 =================
const authenticationV2 = asyncHandler(async (req, res, next) => {

    // ✅ BYPASS LOGIN / SIGNUP
    if (PUBLIC_PATHS.includes(req.path)) {
        return next();
    }

    const userId = req.headers[HEADER.CLIENT_ID];

    if (!userId) {
        throw new AuthFailureError('Invalid request');
    }

    const keyStore = await findByUserId(userId);

    if (!keyStore) {
        throw new NotFoundError('Not found keyStore');
    }

    // ================= REFRESH TOKEN FLOW =================
    if (req.headers[HEADER.REFRESH_TOKEN]) {
        try {
            const refreshToken = req.headers[HEADER.REFRESH_TOKEN];

            const decodeUser = JWT.verify(refreshToken, keyStore.privateKey);

            if (userId !== decodeUser.userId) {
                throw new AuthFailureError('Invalid UserId');
            }

            req.refreshToken = refreshToken;
            req.user = decodeUser;
            req.keyStore = keyStore;
            return next();

        } catch (error) {
            throw error;
        }
    }

    // ================= ACCESS TOKEN FLOW =================
    const accessToken = req.headers[HEADER.AUTHORIZATION];

    if (!accessToken) {
        throw new AuthFailureError('Invalid accessToken');
    }

    try {
        const decodeUser = JWT.verify(accessToken, keyStore.publicKey);

        if (userId !== decodeUser.userId) {
            throw new AuthFailureError('Invalid UserId');
        }

        req.user = decodeUser;
        req.keyStore = keyStore;
        return next();

    } catch (error) {
        throw error;
    }
});

// ================= SIMPLE AUTH =================
const authentication = asyncHandler(async (req, res, next) => {

    const userId = req.headers[HEADER.CLIENT_ID];

    if (!userId) {
        throw new AuthFailureError('Invalid request');
    }

    const keyStore = await findByUserId(userId);

    if (!keyStore) {
        throw new NotFoundError('Not found keyStore');
    }

    const accessToken = req.headers[HEADER.AUTHORIZATION];

    if (!accessToken) {
        throw new AuthFailureError('Invalid accessToken');
    }

    try {
        const decodeUser = JWT.verify(accessToken, keyStore.publicKey);

        if (userId !== decodeUser.userId) {
            throw new AuthFailureError('Invalid UserId');
        }

        req.keyStore = keyStore;
        req.user = decodeUser;
        return next();

    } catch (error) {
        throw error;
    }
});

// ================= OPTIONAL AUTH =================
const optionalAuth = async (req, res, next) => {
    try {
        const userId = req.headers[HEADER.CLIENT_ID];
        if (!userId) return next();

        const keyStore = await findByUserId(userId);
        if (!keyStore) return next();

        const accessToken = req.headers[HEADER.AUTHORIZATION];
        if (!accessToken) return next();

        const decodeUser = JWT.verify(accessToken, keyStore.publicKey);
        if (userId !== decodeUser.userId) return next();

        req.user = decodeUser;
        req.keyStore = keyStore;

    } catch (_) {
        // ignore lỗi → anonymous
    }

    return next();
};

// ================= VERIFY JWT =================
const verifyJWT = async (token, keySecret) => {
    return JWT.verify(token, keySecret);
};

module.exports = {
    createTokenPair,
    authentication,
    authenticationV2,
    optionalAuth,
    verifyJWT
};
