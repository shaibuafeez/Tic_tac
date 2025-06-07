module tic_tac::tic_tac_enhanced {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use std::vector;
    use std::string::{Self, String};

    // ======== Constants ========
    const MARK_EMPTY: u8 = 0;
    const MARK_X: u8 = 1;
    const MARK_O: u8 = 2;

    // Game modes
    const MODE_FRIENDLY: u8 = 0;
    const MODE_COMPETITIVE: u8 = 1;

    // Game status
    const STATUS_WAITING: u8 = 0;
    const STATUS_ACTIVE: u8 = 1;
    const STATUS_COMPLETED: u8 = 2;
    const STATUS_CANCELLED: u8 = 3;
    const STATUS_TIMEOUT: u8 = 4; // New status for timeout wins

    // Platform fee (10%)
    const PLATFORM_FEE_BPS: u64 = 1000;
    const BPS_BASE: u64 = 10000;

    // Time limits
    const MOVE_TIMEOUT_EPOCHS: u64 = 60; // ~1 hour (assuming 1 epoch = 1 minute)
    const MIN_GAS_BUFFER: u64 = 10_000_000; // 0.01 SUI for gas

    // Leaderboard
    const MAX_LEADERBOARD_SIZE: u64 = 20;

    // ======== Errors ========
    const EInvalidTurn: u64 = 0;
    const EInvalidLocation: u64 = 1;
    const EGameOver: u64 = 2;
    const ECellOccupied: u64 = 3;
    const EInsufficientStake: u64 = 4;
    const EGameNotWaiting: u64 = 5;
    const ENotCreator: u64 = 6;
    const EWrongGameMode: u64 = 7;
    const EAlreadyJoined: u64 = 8;
    const ECannotJoinOwnGame: u64 = 9;
    const EGameNotActive: u64 = 10;
    const ENoTimeout: u64 = 11;
    const ENotYourTurn: u64 = 12;
    const EInsufficientBalance: u64 = 13;

    // ======== Structs ========
    
    // Player stats for leaderboard
    public struct PlayerStats has store, drop, copy {
        player: address,
        total_profit: u64,
        total_loss: u64,
        games_won: u64,
        games_lost: u64,
        last_updated: u64,
    }

    // Global leaderboard
    public struct Leaderboard has key {
        id: UID,
        top_players: vector<PlayerStats>,
        all_time_volume: u64,
        total_games: u64,
    }

    // Enhanced Game object with timeout tracking
    public struct GameEnhanced has key {
        id: UID,
        board: vector<u8>,
        turn: u8,
        x: address,
        o: address,
        mode: u8,
        status: u8,
        stake_amount: u64,
        prize_pool: Balance<SUI>,
        creator: address,
        winner: address,
        game_link: String,
        viewer_link: String,
        created_at: u64,
        completed_at: u64,
        last_move_epoch: u64, // Track last move time
        x_total_time: u64,    // Total time used by X
        o_total_time: u64,    // Total time used by O
    }

    // ======== Events ========
    
    public struct TimeoutVictory has copy, drop {
        game_id: address,
        winner: address,
        loser: address,
        reason: String,
    }

    public struct LeaderboardUpdated has copy, drop {
        player: address,
        new_profit: u64,
        rank: u64,
    }

    // ======== Functions ========

    // Check if player has sufficient balance for stake + gas
    public fun check_sufficient_balance(stake_amount: u64, player_balance: u64): bool {
        player_balance >= stake_amount + MIN_GAS_BUFFER
    }

    // Claim victory if opponent hasn't moved within timeout
    public fun claim_timeout_victory(
        game: &mut GameEnhanced,
        ctx: &mut TxContext
    ) {
        assert!(game.status == STATUS_ACTIVE, EGameNotActive);
        
        let current_epoch = tx_context::epoch(ctx);
        let time_since_last_move = current_epoch - game.last_move_epoch;
        
        assert!(time_since_last_move >= MOVE_TIMEOUT_EPOCHS, ENoTimeout);
        
        // Determine who should move and who wins by timeout
        let current_player_turn = if (game.turn % 2 == 0) { game.x } else { game.o };
        let claiming_player = tx_context::sender(ctx);
        
        // The player whose turn it is has timed out
        assert!(claiming_player != current_player_turn, ENotYourTurn);
        assert!(claiming_player == game.x || claiming_player == game.o, EInvalidTurn);
        
        // Set winner to the player who didn't timeout
        game.winner = claiming_player;
        game.status = STATUS_TIMEOUT;
        game.completed_at = current_epoch;
        
        // Emit timeout event
        event::emit(TimeoutVictory {
            game_id: object::uid_to_address(&game.id),
            winner: claiming_player,
            loser: current_player_turn,
            reason: string::utf8(b"Opponent timeout - no move for 1 hour"),
        });
        
        // Distribute prizes if competitive
        if (game.mode == MODE_COMPETITIVE) {
            // Similar to regular win distribution
            // TODO: Add prize distribution logic
        }
    }

    // Update leaderboard after game completion
    public fun update_leaderboard(
        leaderboard: &mut Leaderboard,
        winner: address,
        loser: address,
        profit_amount: u64,
        ctx: &mut TxContext
    ) {
        let current_epoch = tx_context::epoch(ctx);
        
        // Update winner stats
        update_player_stats(leaderboard, winner, profit_amount, 0, true, current_epoch);
        
        // Update loser stats
        update_player_stats(leaderboard, loser, 0, profit_amount, false, current_epoch);
        
        // Update global stats
        leaderboard.all_time_volume = leaderboard.all_time_volume + (profit_amount * 2);
        leaderboard.total_games = leaderboard.total_games + 1;
        
        // Sort and trim leaderboard
        sort_leaderboard(leaderboard);
    }

    fun update_player_stats(
        leaderboard: &mut Leaderboard,
        player: address,
        profit: u64,
        loss: u64,
        won: bool,
        epoch: u64
    ) {
        let mut i = 0;
        let mut found = false;
        let players = &mut leaderboard.top_players;
        
        // Find existing player
        while (i < vector::length(players)) {
            let stats = vector::borrow_mut(players, i);
            if (stats.player == player) {
                stats.total_profit = stats.total_profit + profit;
                stats.total_loss = stats.total_loss + loss;
                if (won) {
                    stats.games_won = stats.games_won + 1;
                } else {
                    stats.games_lost = stats.games_lost + 1;
                };
                stats.last_updated = epoch;
                found = true;
                break
            };
            i = i + 1;
        };
        
        // Add new player if not found
        if (!found) {
            let new_stats = PlayerStats {
                player,
                total_profit: profit,
                total_loss: loss,
                games_won: if (won) { 1 } else { 0 },
                games_lost: if (won) { 0 } else { 1 },
                last_updated: epoch,
            };
            vector::push_back(players, new_stats);
        };
    }

    fun sort_leaderboard(leaderboard: &mut Leaderboard) {
        // Simple bubble sort by net profit (profit - loss)
        let players = &mut leaderboard.top_players;
        let len = vector::length(players);
        let mut i = 0;
        
        while (i < len) {
            let mut j = 0;
            while (j < len - i - 1) {
                let stats_j = vector::borrow(players, j);
                let stats_j1 = vector::borrow(players, j + 1);
                
                let net_j = if (stats_j.total_profit > stats_j.total_loss) {
                    stats_j.total_profit - stats_j.total_loss
                } else { 0 };
                
                let net_j1 = if (stats_j1.total_profit > stats_j1.total_loss) {
                    stats_j1.total_profit - stats_j1.total_loss
                } else { 0 };
                
                if (net_j < net_j1) {
                    vector::swap(players, j, j + 1);
                };
                j = j + 1;
            };
            i = i + 1;
        };
        
        // Keep only top 20
        while (vector::length(players) > MAX_LEADERBOARD_SIZE) {
            vector::pop_back(players);
        };
    }

    // Get top players for display
    public fun get_leaderboard(leaderboard: &Leaderboard): vector<PlayerStats> {
        leaderboard.top_players
    }
}