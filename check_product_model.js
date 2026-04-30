const p = require('./src/models/product.model');
console.log('p type', typeof p);
console.log('modelName', p && p.modelName);
console.log('create type', p && typeof p.create);
console.log('keys', Object.keys(p || {}));
