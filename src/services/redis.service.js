'use strict';

// Tam thoi vo hieu hoa Redis lock de chay backend
const acquireLock = async () => true;
const realeaseLock = async () => true;

module.exports = {
    acquireLock,
    realeaseLock,
};
