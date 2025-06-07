module tic_tac::leaderboard {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::vector;

    // Constants
    const MAX_LEADERBOARD_SIZE: u64 = 20;

    // Errors
    const ENotAuthorized: u64 = 0;

    // Player statistics
    public struct PlayerStats has store, drop, copy {
        player: address,
        total_profit: u64,
        total_loss: u64,
        games_won: u64,
        games_lost: u64,
        games_drawn: u64,
        profit_is_positive: bool, // true if profit > loss
        net_amount: u64, // absolute value of net profit/loss
        last_updated: u64,
    }

    // Global leaderboard
    public struct Leaderboard has key {
        id: UID,
        top_players: vector<PlayerStats>,
        all_time_volume: u64,
        total_games: u64,
        total_players: u64,
    }

    // Events
    public struct LeaderboardUpdated has copy, drop {
        player: address,
        profit_is_positive: bool,
        net_amount: u64,
        new_rank: u64,
        games_won: u64,
        games_lost: u64,
    }

    // Initialize leaderboard
    fun init(ctx: &mut TxContext) {
        let leaderboard = Leaderboard {
            id: object::new(ctx),
            top_players: vector::empty(),
            all_time_volume: 0,
            total_games: 0,
            total_players: 0,
        };
        transfer::share_object(leaderboard);
    }

    // Update player stats after game
    public fun update_player_stats(
        leaderboard: &mut Leaderboard,
        player: address,
        won: bool,
        is_draw: bool,
        profit_or_loss: u64,
        ctx: &mut TxContext
    ) {
        let current_epoch = tx_context::epoch(ctx);
        let mut found = false;
        let mut i = 0;
        let players = &mut leaderboard.top_players;
        
        // Find existing player
        while (i < vector::length(players)) {
            let stats = vector::borrow_mut(players, i);
            if (stats.player == player) {
                // Update existing player
                if (is_draw) {
                    stats.games_drawn = stats.games_drawn + 1;
                } else if (won) {
                    stats.total_profit = stats.total_profit + profit_or_loss;
                    stats.games_won = stats.games_won + 1;
                } else {
                    stats.total_loss = stats.total_loss + profit_or_loss;
                    stats.games_lost = stats.games_lost + 1;
                };
                
                // Update net profit
                if (stats.total_profit >= stats.total_loss) {
                    stats.profit_is_positive = true;
                    stats.net_amount = stats.total_profit - stats.total_loss;
                } else {
                    stats.profit_is_positive = false;
                    stats.net_amount = stats.total_loss - stats.total_profit;
                };
                stats.last_updated = current_epoch;
                found = true;
                break
            };
            i = i + 1;
        };
        
        // Add new player if not found
        if (!found) {
            let (profit_is_positive, net_amount) = if (won && !is_draw) {
                (true, profit_or_loss)
            } else if (!won && !is_draw) {
                (false, profit_or_loss)
            } else {
                (true, 0) // Draw case
            };
            
            let new_stats = PlayerStats {
                player,
                total_profit: if (won && !is_draw) { profit_or_loss } else { 0 },
                total_loss: if (!won && !is_draw) { profit_or_loss } else { 0 },
                games_won: if (won && !is_draw) { 1 } else { 0 },
                games_lost: if (!won && !is_draw) { 1 } else { 0 },
                games_drawn: if (is_draw) { 1 } else { 0 },
                profit_is_positive,
                net_amount,
                last_updated: current_epoch,
            };
            vector::push_back(players, new_stats);
            leaderboard.total_players = leaderboard.total_players + 1;
        };
        
        // Update global stats
        if (!is_draw) {
            leaderboard.all_time_volume = leaderboard.all_time_volume + profit_or_loss;
        };
        leaderboard.total_games = leaderboard.total_games + 1;
        
        // Sort and trim leaderboard
        sort_leaderboard(leaderboard);
        
        // Emit event for the player
        let player_stats = get_player_stats(leaderboard, player);
        if (vector::length(&player_stats) > 0) {
            let stats = vector::borrow(&player_stats, 0);
            let rank = get_player_rank(leaderboard, player);
            
            event::emit(LeaderboardUpdated {
                player,
                profit_is_positive: stats.profit_is_positive,
                net_amount: stats.net_amount,
                new_rank: rank,
                games_won: stats.games_won,
                games_lost: stats.games_lost,
            });
        };
    }


    // Sort leaderboard by net profit (descending)
    fun sort_leaderboard(leaderboard: &mut Leaderboard) {
        let players = &mut leaderboard.top_players;
        let len = vector::length(players);
        
        // Bubble sort by net profit
        let mut i = 0;
        while (i < len) {
            let mut j = 0;
            while (j < len - i - 1) {
                let stats_j = vector::borrow(players, j);
                let stats_j1 = vector::borrow(players, j + 1);
                
                // Compare net profits: positive profits are better than negative
                let should_swap = if (stats_j.profit_is_positive && !stats_j1.profit_is_positive) {
                    false // j is better than j+1
                } else if (!stats_j.profit_is_positive && stats_j1.profit_is_positive) {
                    true // j+1 is better than j
                } else if (stats_j.profit_is_positive && stats_j1.profit_is_positive) {
                    stats_j.net_amount < stats_j1.net_amount // Both positive, higher amount wins
                } else {
                    stats_j.net_amount > stats_j1.net_amount // Both negative, lower loss wins
                };
                
                if (should_swap) {
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

    // Get player's rank (1-based, 0 if not in top 20)
    public fun get_player_rank(leaderboard: &Leaderboard, player: address): u64 {
        let mut i = 0;
        let players = &leaderboard.top_players;
        
        while (i < vector::length(players)) {
            let stats = vector::borrow(players, i);
            if (stats.player == player) {
                return i + 1 // 1-based rank
            };
            i = i + 1;
        };
        
        0 // Not in top 20
    }

    // Get player stats
    public fun get_player_stats(leaderboard: &Leaderboard, player: address): vector<PlayerStats> {
        let mut i = 0;
        let players = &leaderboard.top_players;
        let mut result = vector::empty<PlayerStats>();
        
        while (i < vector::length(players)) {
            let stats = vector::borrow(players, i);
            if (stats.player == player) {
                vector::push_back(&mut result, *stats);
                break
            };
            i = i + 1;
        };
        
        result
    }

    // View functions
    public fun get_top_players(leaderboard: &Leaderboard): vector<PlayerStats> {
        leaderboard.top_players
    }

    public fun get_total_volume(leaderboard: &Leaderboard): u64 {
        leaderboard.all_time_volume
    }

    public fun get_total_games(leaderboard: &Leaderboard): u64 {
        leaderboard.total_games
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}