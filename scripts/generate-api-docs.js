'use strict';

const fs = require('fs');
const path = require('path');
const { buildOpenApiSpec, buildPostmanCollection } = require('../src/configs/api-docs');

const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const postmanDir = path.join(docsDir, 'postman');

fs.mkdirSync(postmanDir, { recursive: true });

const openApiPath = path.join(docsDir, 'openapi.json');
const postmanPath = path.join(postmanDir, 'ecommerce-be.postman_collection.json');

fs.writeFileSync(openApiPath, `${JSON.stringify(buildOpenApiSpec(), null, 2)}\n`);
fs.writeFileSync(postmanPath, `${JSON.stringify(buildPostmanCollection(), null, 2)}\n`);

console.log(`Wrote ${path.relative(rootDir, openApiPath)}`);
console.log(`Wrote ${path.relative(rootDir, postmanPath)}`);