'use strict';

const { Types } = require('mongoose');
const { BadRequestError } = require('../core/error.response');
const SearchHistory = require('../models/search_history.model');

/** Maximum number of history records kept per user. */
const MAX_HISTORY = 20;

class SearchHistoryService {

    /**
     * saveKeyword
     * -----------
     * Persists a search keyword for a user, enforcing:
     *   1. Normalisation  — trim + lowercase
     *   2. Consecutive-duplicate guard — skip if same as the user's last keyword
     *   3. FIFO cap       — keep at most MAX_HISTORY records per user
     *
     * DB queries used:
     *   Q1  countDocuments({ userId })         — O(1) with compound index
     *   Q2a deleteMany (oldest N docs)         — only when over the cap
     *   Q2b create (the new record)            — always
     *
     * Total: 2 queries in the happy path (no pruning needed),
     *        3 queries when the cap is exceeded.
     * Never fetches full documents unnecessarily.
     *
     * @param {string} userId
     * @param {string} rawKeyword
     * @returns {Promise<SearchHistory>} the saved document
     */
    static async saveKeyword(userId, rawKeyword) {
        // ── Validate ─────────────────────────────────────────────────────────
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestError('Invalid userId format');
        }

        const keyword = String(rawKeyword ?? '').trim().toLowerCase();
        if (!keyword) {
            throw new BadRequestError('keyword must not be empty');
        }

        const userObjectId = new Types.ObjectId(userId);

        // ── Guard: skip if same as the last saved keyword (consecutive duplicate) ──
        // Uses { userId: 1, createdAt: -1 } index → touches exactly 1 document.
        const lastEntry = await SearchHistory
            .findOne({ userId: userObjectId })
            .sort({ createdAt: -1 })
            .select('keyword')
            .lean();

        if (lastEntry && lastEntry.keyword === keyword) {
            // Return a synthetic object so callers don't have to handle null.
            return { skipped: true, reason: 'duplicate_consecutive', keyword };
        }

        // ── FIFO cap: count existing records ─────────────────────────────────
        // countDocuments uses the index and never loads full documents.
        const count = await SearchHistory.countDocuments({ userId: userObjectId });

        if (count >= MAX_HISTORY) {
            // How many records need to go?
            const overflow = count - MAX_HISTORY + 1; // +1 makes room for the new one

            // Find the IDs of the oldest `overflow` records for THIS user only.
            // Sorted asc by createdAt → oldest first. Indexed → no collection scan.
            const oldest = await SearchHistory
                .find({ userId: userObjectId })
                .sort({ createdAt: 1 })        // oldest first
                .limit(overflow)
                .select('_id')                 // only _id, no hydration
                .lean();

            const idsToDelete = oldest.map((doc) => doc._id);

            // Delete by _id list — targeted, safe, single round-trip.
            await SearchHistory.deleteMany({ _id: { $in: idsToDelete } });
        }

        // ── Save the new record ───────────────────────────────────────────────
        const saved = await SearchHistory.create({
            userId: userObjectId,
            keyword
        });

        return saved;
    }

    /**
     * getHistory
     * ----------
     * Returns the search history for a user, most-recent first.
     * Uses the { userId: 1, createdAt: -1 } compound index.
     *
     * @param {string} userId
     * @param {number} [limit=20]
     * @returns {Promise<SearchHistory[]>}
     */
    static async getHistory(userId, limit = MAX_HISTORY) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestError('Invalid userId format');
        }

        return SearchHistory
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('keyword createdAt -_id')
            .lean();
    }

    /**
     * clearHistory
     * ------------
     * Deletes all search history records for a user.
     *
     * @param {string} userId
     */
    static async clearHistory(userId) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestError('Invalid userId format');
        }

        const result = await SearchHistory.deleteMany({
            userId: new Types.ObjectId(userId)
        });

        return { deleted: result.deletedCount };
    }
}

module.exports = SearchHistoryService;
