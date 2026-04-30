'use strict';

const express = require('express');
const router = express.Router();

const SearchHistoryController = require('../../controllers/search_history.controller');
const { asyncHandler } = require('../../auth/checkAuth');

/*
========================
        PUBLIC
  (protected by optional auth in product routes;
   here we keep them open so the mobile app
   can call with its own userId header)
========================
*/

// POST /v1/api/search/history          — save a keyword
router.post('/history', asyncHandler(SearchHistoryController.saveHistory));

// GET  /v1/api/search/history/:userId  — get history for a user
router.get('/history/:userId', asyncHandler(SearchHistoryController.getHistory));

// DELETE /v1/api/search/history/:userId — clear history for a user
router.delete('/history/:userId', asyncHandler(SearchHistoryController.clearHistory));

module.exports = router;
