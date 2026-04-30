'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const DOCUMENT_NAME = 'SearchHistory';
const COLLECTION_NAME = 'search_histories';

/**
 * SearchHistory — stores a user's search keywords.
 *
 * Indexes:
 *  - { userId, createdAt }  → efficient FIFO pruning (find oldest per user)
 *  - { userId, keyword }    → O(1) duplicate-consecutive check
 */
const searchHistorySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        keyword: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: COLLECTION_NAME
    }
);

// Compound index for FIFO pruning: quickly find the oldest docs for a user
searchHistorySchema.index({ userId: 1, createdAt: 1 });

// Used by the duplicate-consecutive check (find the latest keyword of a user)
searchHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports =
    mongoose.models[DOCUMENT_NAME] ||
    mongoose.model(DOCUMENT_NAME, searchHistorySchema);
