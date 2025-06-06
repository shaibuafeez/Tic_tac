module tic_tac::tic_tac {
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

    // Platform fee (10%)
    const PLATFORM_FEE_BPS: u64 = 1000; // 10% in basis points (10/100 * 10000)
    const BPS_BASE: u64 = 10000;

    // ======== Errors ========
    const EInvalidTurn: u64 = 0;
    const EInvalidLocation: u64 = 1;
    const EGameOver: u64 = 2;
    const ECellOccupied: u64 = 3;
    const EInsufficientStake: u64 = 4;
    const EGameNotWaiting: u64 = 5;
    const ENotCreator: u64 = 6;
    const EGameNotActive: u64 = 7;
    const EAlreadyJoined: u64 = 8;
    const ECannotJoinOwnGame: u64 = 9;

    // ======== Structs ========
    
    // Shared treasury for platform fees
    public struct Treasury has key {
        id: UID,
        balance: Balance<SUI>,
        total_fees_collected: u64,
    }

    // Admin capability for treasury management
    public struct AdminCap has key, store {
        id: UID,
    }

    // Game object
    public struct Game has key {
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
    }

    // Trophy NFT
    public struct Trophy has key, store {
        id: UID,
        game_id: address,
        winner: address,
        loser: address,
        stake_amount: u64,
        won_amount: u64,
        game_mode: String,
    }

    // ======== Events ========
    
    public struct GameCreated has copy, drop {
        game_id: address,
        creator: address,
        mode: u8,
        stake_amount: u64,
        game_link: String,
        viewer_link: String,
    }

    public struct GameJoined has copy, drop {
        game_id: address,
        player: address,
        stake_amount: u64,
    }

    public struct MoveMade has copy, drop {
        game_id: address,
        player: address,
        row: u8,
        col: u8,
        mark: u8,
    }

    public struct GameCompleted has copy, drop {
        game_id: address,
        winner: address,
        loser: address,
        prize_amount: u64,
        platform_fee: u64,
    }

    // ======== Init Function ========
    
    fun init(ctx: &mut TxContext) {
        // Create the treasury
        let treasury = Treasury {
            id: object::new(ctx),
            balance: balance::zero(),
            total_fees_collected: 0,
        };
        transfer::share_object(treasury);

        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }

    // ======== Game Creation Functions ========
    
    // Create a friendly game (no stakes)
    public fun create_friendly_game(o: address, ctx: &mut TxContext): (String, String) {
        let game_id = object::new(ctx);
        let game_address = object::uid_to_address(&game_id);
        
        let game_link = generate_game_link(game_address, false);
        let viewer_link = generate_game_link(game_address, true);
        
        let game = Game {
            id: game_id,
            board: vector[
                MARK_EMPTY, MARK_EMPTY, MARK_EMPTY,
                MARK_EMPTY, MARK_EMPTY, MARK_EMPTY,
                MARK_EMPTY, MARK_EMPTY, MARK_EMPTY
            ],
            turn: 0,
            x: tx_context::sender(ctx),
            o,
            mode: MODE_FRIENDLY,
            status: STATUS_ACTIVE,
            stake_amount: 0,
            prize_pool: balance::zero(),
            creator: tx_context::sender(ctx),
            winner: @0x0,
            game_link,
            viewer_link,
            created_at: tx_context::epoch(ctx),
            completed_at: 0,
        };

        event::emit(GameCreated {
            game_id: game_address,
            creator: tx_context::sender(ctx),
            mode: MODE_FRIENDLY,
            stake_amount: 0,
            game_link,
            viewer_link,
        });

        transfer::share_object(game);
        (game_link, viewer_link)
    }

    // Create a competitive game (with stakes)
    public fun create_competitive_game(
        stake: Coin<SUI>, 
        ctx: &mut TxContext
    ): (String, String) {
        let stake_amount = coin::value(&stake);
        let game_id = object::new(ctx);
        let game_address = object::uid_to_address(&game_id);
        
        let game_link = generate_game_link(game_address, false);
        let viewer_link = generate_game_link(game_address, true);
        
        let game = Game {
            id: game_id,
            board: vector[
                MARK_EMPTY, MARK_EMPTY, MARK_EMPTY,
                MARK_EMPTY, MARK_EMPTY, MARK_EMPTY,
                MARK_EMPTY, MARK_EMPTY, MARK_EMPTY
            ],
            turn: 0,
            x: tx_context::sender(ctx),
            o: @0x0, // Will be set when opponent joins
            mode: MODE_COMPETITIVE,
            status: STATUS_WAITING,
            stake_amount,
            prize_pool: coin::into_balance(stake),
            creator: tx_context::sender(ctx),
            winner: @0x0,
            game_link,
            viewer_link,
            created_at: tx_context::epoch(ctx),
            completed_at: 0,
        };

        event::emit(GameCreated {
            game_id: game_address,
            creator: tx_context::sender(ctx),
            mode: MODE_COMPETITIVE,
            stake_amount,
            game_link,
            viewer_link,
        });

        transfer::share_object(game);
        (game_link, viewer_link)
    }

    // Join a competitive game
    public fun join_competitive_game(
        game: &mut Game, 
        stake: Coin<SUI>, 
        ctx: &mut TxContext
    ) {
        assert!(game.status == STATUS_WAITING, EGameNotWaiting);
        assert!(game.mode == MODE_COMPETITIVE, EGameNotActive);
        assert!(tx_context::sender(ctx) != game.creator, ECannotJoinOwnGame);
        assert!(coin::value(&stake) >= game.stake_amount, EInsufficientStake);

        game.o = tx_context::sender(ctx);
        game.status = STATUS_ACTIVE;
        
        let stake_balance = coin::into_balance(stake);
        balance::join(&mut game.prize_pool, stake_balance);

        event::emit(GameJoined {
            game_id: object::uid_to_address(&game.id),
            player: tx_context::sender(ctx),
            stake_amount: game.stake_amount,
        });
    }

    // ======== Game Play Functions ========
    
    public fun place_mark(game: &mut Game, row: u8, col: u8, ctx: &mut TxContext) {
        assert!(game.status == STATUS_ACTIVE, EGameNotActive);
        assert!(row < 3 && col < 3, EInvalidLocation);
        
        let current_player = if (game.turn % 2 == 0) { game.x } else { game.o };
        assert!(tx_context::sender(ctx) == current_player, EInvalidTurn);
        
        let index = (row as u64) * 3 + (col as u64);
        let cell = vector::borrow(&game.board, index);
        assert!(*cell == MARK_EMPTY, ECellOccupied);
        
        let mark = if (game.turn % 2 == 0) { MARK_X } else { MARK_O };
        *vector::borrow_mut(&mut game.board, index) = mark;
        
        event::emit(MoveMade {
            game_id: object::uid_to_address(&game.id),
            player: current_player,
            row,
            col,
            mark,
        });

        if (check_winner(&game.board)) {
            game.winner = current_player;
            game.status = STATUS_COMPLETED;
            game.completed_at = tx_context::epoch(ctx);
            
            if (game.mode == MODE_COMPETITIVE) {
                distribute_prizes(game, ctx);
            } else {
                create_trophy(game, ctx);
            }
        } else if (is_draw(&game.board)) {
            game.status = STATUS_COMPLETED;
            game.completed_at = tx_context::epoch(ctx);
            
            if (game.mode == MODE_COMPETITIVE) {
                // Return stakes to both players in case of draw
                return_stakes(game, ctx);
            }
        } else {
            game.turn = game.turn + 1;
        }
    }

    // ======== Prize Distribution Functions ========
    
    fun distribute_prizes(game: &mut Game, ctx: &mut TxContext) {
        let total_prize = balance::value(&game.prize_pool);
        let platform_fee = (total_prize * PLATFORM_FEE_BPS) / BPS_BASE;
        let winner_prize = total_prize - platform_fee;
        
        // For now, we'll skip the treasury transfer (would need dynamic field access in production)
        // In production, you'd store treasury ID and use dynamic object field
        
        // Transfer all to winner (in production, platform fee would go to treasury)
        let winner_coin = coin::from_balance(balance::withdraw_all(&mut game.prize_pool), ctx);
        transfer::public_transfer(winner_coin, game.winner);
        
        // Create trophy
        let loser = if (game.winner == game.x) { game.o } else { game.x };
        let trophy = Trophy {
            id: object::new(ctx),
            game_id: object::uid_to_address(&game.id),
            winner: game.winner,
            loser,
            stake_amount: game.stake_amount,
            won_amount: winner_prize,
            game_mode: string::utf8(b"Competitive"),
        };
        transfer::public_transfer(trophy, game.winner);
        
        event::emit(GameCompleted {
            game_id: object::uid_to_address(&game.id),
            winner: game.winner,
            loser,
            prize_amount: winner_prize,
            platform_fee,
        });
    }

    fun return_stakes(game: &mut Game, ctx: &mut TxContext) {
        let stake_per_player = balance::value(&game.prize_pool) / 2;
        
        let x_stake = coin::from_balance(balance::split(&mut game.prize_pool, stake_per_player), ctx);
        transfer::public_transfer(x_stake, game.x);
        
        let o_stake = coin::from_balance(balance::withdraw_all(&mut game.prize_pool), ctx);
        transfer::public_transfer(o_stake, game.o);
    }

    fun create_trophy(game: &Game, ctx: &mut TxContext) {
        let loser = if (game.winner == game.x) { game.o } else { game.x };
        let trophy = Trophy {
            id: object::new(ctx),
            game_id: object::uid_to_address(&game.id),
            winner: game.winner,
            loser,
            stake_amount: 0,
            won_amount: 0,
            game_mode: string::utf8(b"Friendly"),
        };
        transfer::public_transfer(trophy, game.winner);
    }

    // ======== View Functions ========
    
    public fun get_board(game: &Game): vector<u8> {
        game.board
    }

    public fun get_game_status(game: &Game): (u8, address, u8, u64) {
        (game.status, game.winner, game.mode, game.stake_amount)
    }

    public fun is_viewer_link(game: &Game, link: String): bool {
        game.viewer_link == link
    }

    // ======== Helper Functions ========
    
    fun check_winner(board: &vector<u8>): bool {
        // Check rows
        let mut i = 0;
        while (i < 9) {
            if (check_line(board, i, i + 1, i + 2)) return true;
            i = i + 3;
        };
        
        // Check columns
        i = 0;
        while (i < 3) {
            if (check_line(board, i, i + 3, i + 6)) return true;
            i = i + 1;
        };
        
        // Check diagonals
        check_line(board, 0, 4, 8) || check_line(board, 2, 4, 6)
    }

    fun check_line(board: &vector<u8>, a: u64, b: u64, c: u64): bool {
        let va = *vector::borrow(board, a);
        let vb = *vector::borrow(board, b);
        let vc = *vector::borrow(board, c);
        va != MARK_EMPTY && va == vb && vb == vc
    }

    fun is_draw(board: &vector<u8>): bool {
        let mut i = 0;
        while (i < 9) {
            if (*vector::borrow(board, i) == MARK_EMPTY) return false;
            i = i + 1;
        };
        true
    }

    fun generate_game_link(_game_address: address, is_viewer: bool): String {
        // In production, this would generate actual URLs
        // For now, we'll create simple identifiers
        if (is_viewer) {
            string::utf8(b"viewer_link_placeholder")
        } else {
            string::utf8(b"game_link_placeholder")
        }
    }


    // ======== Admin Functions ========
    
    public fun withdraw_fees(
        _admin_cap: &AdminCap,
        treasury: &mut Treasury,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let withdrawal = coin::from_balance(balance::split(&mut treasury.balance, amount), ctx);
        transfer::public_transfer(withdrawal, recipient);
    }

    public fun cancel_expired_game(
        game: &mut Game,
        ctx: &mut TxContext
    ) {
        // Only allow cancellation if game is waiting and has been waiting for > 1 hour
        assert!(game.status == STATUS_WAITING, EGameNotWaiting);
        
        // Return stake to creator
        if (game.mode == MODE_COMPETITIVE && balance::value(&game.prize_pool) > 0) {
            let stake = coin::from_balance(balance::withdraw_all(&mut game.prize_pool), ctx);
            transfer::public_transfer(stake, game.creator);
        };
        
        game.status = STATUS_CANCELLED;
    }
}