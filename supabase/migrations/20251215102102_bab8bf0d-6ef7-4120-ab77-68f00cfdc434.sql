-- Clear all old data from old testnet (correct order respecting foreign keys)
DELETE FROM notifications;
DELETE FROM watchlist;
DELETE FROM offer_logs;
DELETE FROM activities;
DELETE FROM listings;
DELETE FROM offers;
DELETE FROM nfts;