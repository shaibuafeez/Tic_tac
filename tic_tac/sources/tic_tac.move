module tic_tac::tic_tac {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::clock::{Self, Clock};
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
    
    // Timeout constants
    const MOVE_TIMEOUT_MS: u64 = 900_000; // 15 minutes in milliseconds

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
    const ETimeoutNotReached: u64 = 11;
    const ECannotClaimOwnTimeout: u64 = 12;
    const EGameNotCompleted: u64 = 13;
    const ENotPlayer: u64 = 14;
    const ERematchAlreadyRequested: u64 = 15;
    const ENoRematchRequest: u64 = 16;
    const ECannotRejectOwnRequest: u64 = 17;

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
        created_at_ms: u64,
        completed_at_ms: u64,
        last_move_ms: u64,
        rematch_requested_by: address, // 0x0 if no rematch requested
        rematch_accepted: bool,
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

    public struct TimeoutVictory has copy, drop {
        game_id: address,
        winner: address,
        loser: address,
        time_elapsed: u64,
    }

    public struct RematchRequested has copy, drop {
        game_id: address,
        requester: address,
        opponent: address,
    }

    public struct RematchRejected has copy, drop {
        game_id: address,
        rejector: address,
        original_requester: address,
    }

    public struct RematchCreated has copy, drop {
        old_game_id: address,
        new_game_id: address,
        player_x: address,
        player_o: address,
        stake_amount: u64,
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
    public fun create_friendly_game(clock: &Clock, ctx: &mut TxContext): (String, String) {
        let game_id = object::new(ctx);
        let game_address = object::uid_to_address(&game_id);
        
        let game_link = generate_game_link(game_address, false);
        let viewer_link = generate_game_link(game_address, true);
        
        let current_time = clock::timestamp_ms(clock);
        
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
            mode: MODE_FRIENDLY,
            status: STATUS_WAITING,
            stake_amount: 0,
            prize_pool: balance::zero(),
            creator: tx_context::sender(ctx),
            winner: @0x0,
            game_link,
            viewer_link,
            created_at_ms: current_time,
            completed_at_ms: 0,
            last_move_ms: current_time,
            rematch_requested_by: @0x0,
            rematch_accepted: false,
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
        clock: &Clock,
        ctx: &mut TxContext
    ): (String, String) {
        let stake_amount = coin::value(&stake);
        let game_id = object::new(ctx);
        let game_address = object::uid_to_address(&game_id);
        
        let game_link = generate_game_link(game_address, false);
        let viewer_link = generate_game_link(game_address, true);
        
        let current_time = clock::timestamp_ms(clock);
        
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
            created_at_ms: current_time,
            completed_at_ms: 0,
            last_move_ms: current_time,
            rematch_requested_by: @0x0,
            rematch_accepted: false,
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

    // Join a friendly game (no stakes required)
    public fun join_friendly_game(game: &mut Game, clock: &Clock, ctx: &mut TxContext) {
        assert!(game.status == STATUS_WAITING, EGameNotWaiting);
        assert!(game.mode == MODE_FRIENDLY, EWrongGameMode);
        assert!(tx_context::sender(ctx) != game.creator, ECannotJoinOwnGame);

        game.o = tx_context::sender(ctx);
        game.status = STATUS_ACTIVE;
        game.last_move_ms = clock::timestamp_ms(clock); // Start timeout tracking

        event::emit(GameJoined {
            game_id: object::uid_to_address(&game.id),
            player: tx_context::sender(ctx),
            stake_amount: 0,
        });
    }

    // Join a competitive game
    public fun join_competitive_game(
        game: &mut Game, 
        stake: Coin<SUI>, 
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(game.status == STATUS_WAITING, EGameNotWaiting);
        assert!(game.mode == MODE_COMPETITIVE, EWrongGameMode);
        assert!(tx_context::sender(ctx) != game.creator, ECannotJoinOwnGame);
        assert!(coin::value(&stake) >= game.stake_amount, EInsufficientStake);

        game.o = tx_context::sender(ctx);
        game.status = STATUS_ACTIVE;
        game.last_move_ms = clock::timestamp_ms(clock); // Start timeout tracking
        
        let stake_balance = coin::into_balance(stake);
        balance::join(&mut game.prize_pool, stake_balance);

        event::emit(GameJoined {
            game_id: object::uid_to_address(&game.id),
            player: tx_context::sender(ctx),
            stake_amount: game.stake_amount,
        });
    }

    // ======== Game Play Functions ========
    
    public fun place_mark(
        game: &mut Game, 
        treasury: &mut Treasury, 
        clock: &Clock,
        row: u8, 
        col: u8, 
        ctx: &mut TxContext
    ) {
        assert!(game.status == STATUS_ACTIVE, EGameNotActive);
        assert!(row < 3 && col < 3, EInvalidLocation);
        
        let current_player = if (game.turn % 2 == 0) { game.x } else { game.o };
        assert!(tx_context::sender(ctx) == current_player, EInvalidTurn);
        
        let index = (row as u64) * 3 + (col as u64);
        let cell = vector::borrow(&game.board, index);
        assert!(*cell == MARK_EMPTY, ECellOccupied);
        
        let mark = if (game.turn % 2 == 0) { MARK_X } else { MARK_O };
        *vector::borrow_mut(&mut game.board, index) = mark;
        
        // Update last move time for timeout tracking
        game.last_move_ms = clock::timestamp_ms(clock);
        
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
            game.completed_at_ms = clock::timestamp_ms(clock);
            
            if (game.mode == MODE_COMPETITIVE) {
                distribute_prizes(game, treasury, ctx);
            } else {
                create_trophy(game, ctx);
            }
        } else if (is_draw(&game.board)) {
            game.status = STATUS_COMPLETED;
            game.completed_at_ms = clock::timestamp_ms(clock);
            
            if (game.mode == MODE_COMPETITIVE) {
                // Return stakes to both players in case of draw
                return_stakes(game, ctx);
            }
        } else {
            game.turn = game.turn + 1;
        }
    }

    // ======== Prize Distribution Functions ========
    
    fun distribute_prizes(game: &mut Game, treasury: &mut Treasury, ctx: &mut TxContext) {
        let total_prize = balance::value(&game.prize_pool);
        let platform_fee = (total_prize * PLATFORM_FEE_BPS) / BPS_BASE;
        let winner_prize = total_prize - platform_fee;
        
        // Transfer platform fee to treasury
        let fee_balance = balance::split(&mut game.prize_pool, platform_fee);
        balance::join(&mut treasury.balance, fee_balance);
        treasury.total_fees_collected = treasury.total_fees_collected + platform_fee;
        
        // Transfer remaining prize to winner
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


    // ======== Timeout Functions ========
    
    public fun claim_timeout_victory(
        game: &mut Game,
        treasury: &mut Treasury,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(game.status == STATUS_ACTIVE, EGameNotActive);
        
        // Check if enough time has passed since last move (1 hour in milliseconds)
        let current_time = clock::timestamp_ms(clock);
        let time_since_last_move = current_time - game.last_move_ms;
        assert!(time_since_last_move >= MOVE_TIMEOUT_MS, ETimeoutNotReached);
        
        // Determine who can claim victory (the player whose turn it ISN'T)
        let current_turn_player = if (game.turn % 2 == 0) { game.x } else { game.o };
        let claiming_player = tx_context::sender(ctx);
        
        // The player who is waiting for their opponent can claim victory
        assert!(claiming_player == game.x || claiming_player == game.o, EInvalidTurn);
        assert!(claiming_player != current_turn_player, ECannotClaimOwnTimeout);
        
        // Set winner to the claiming player
        game.winner = claiming_player;
        game.status = STATUS_COMPLETED;
        game.completed_at_ms = current_time;
        
        // Distribute prizes if competitive
        if (game.mode == MODE_COMPETITIVE) {
            distribute_prizes(game, treasury, ctx);
        } else {
            create_trophy(game, ctx);
        };
        
        // Emit timeout victory event
        event::emit(TimeoutVictory {
            game_id: object::uid_to_address(&game.id),
            winner: claiming_player,
            loser: current_turn_player,
            time_elapsed: time_since_last_move,
        });
    }

    // ======== Rematch Functions ========
    
    public fun request_rematch(
        game: &mut Game,
        ctx: &mut TxContext
    ) {
        // Game must be completed
        assert!(game.status == STATUS_COMPLETED, EGameNotCompleted);
        
        // Requester must be one of the players
        let sender = tx_context::sender(ctx);
        assert!(sender == game.x || sender == game.o, ENotPlayer);
        
        // No existing rematch request
        assert!(game.rematch_requested_by == @0x0, ERematchAlreadyRequested);
        
        // Set rematch request
        game.rematch_requested_by = sender;
        
        // Determine opponent
        let opponent = if (sender == game.x) { game.o } else { game.x };
        
        event::emit(RematchRequested {
            game_id: object::uid_to_address(&game.id),
            requester: sender,
            opponent,
        });
    }
    
    public fun reject_rematch(
        game: &mut Game,
        ctx: &mut TxContext
    ) {
        // Game must be completed
        assert!(game.status == STATUS_COMPLETED, EGameNotCompleted);
        
        // Must have an active rematch request
        assert!(game.rematch_requested_by != @0x0, ENoRematchRequest);
        
        // Rejector must be one of the players
        let sender = tx_context::sender(ctx);
        assert!(sender == game.x || sender == game.o, ENotPlayer);
        
        // Cannot reject your own request
        assert!(sender != game.rematch_requested_by, ECannotRejectOwnRequest);
        
        // Store the original requester before clearing
        let original_requester = game.rematch_requested_by;
        
        // Clear rematch request
        game.rematch_requested_by = @0x0;
        
        event::emit(RematchRejected {
            game_id: object::uid_to_address(&game.id),
            rejector: sender,
            original_requester,
        });
    }
    
    public fun accept_rematch(
        game: &mut Game,
        stake: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ): (String, String) {
        // Game must be completed
        assert!(game.status == STATUS_COMPLETED, EGameNotCompleted);
        
        // Must have a rematch request
        assert!(game.rematch_requested_by != @0x0, ENoRematchRequest);
        
        // Acceptor must be the other player
        let sender = tx_context::sender(ctx);
        assert!(sender == game.x || sender == game.o, ENotPlayer);
        assert!(sender != game.rematch_requested_by, EInvalidTurn);
        
        // For competitive games, check stake and use it
        let prize_pool = if (game.mode == MODE_COMPETITIVE) {
            assert!(coin::value(&stake) >= game.stake_amount, EInsufficientStake);
            coin::into_balance(stake)
        } else {
            // For friendly games, return the stake (should be 0 value)
            transfer::public_transfer(stake, sender);
            balance::zero()
        };
        
        // Create new game with swapped positions
        let new_game_id = object::new(ctx);
        let new_game_address = object::uid_to_address(&new_game_id);
        
        let game_link = generate_game_link(new_game_address, false);
        let viewer_link = generate_game_link(new_game_address, true);
        
        let current_time = clock::timestamp_ms(clock);
        
        // Swap X and O positions for rematch
        let new_x = game.o;
        let new_o = game.x;
        
        let new_game = Game {
            id: new_game_id,
            board: vector[
                MARK_EMPTY, MARK_EMPTY, MARK_EMPTY,
                MARK_EMPTY, MARK_EMPTY, MARK_EMPTY,
                MARK_EMPTY, MARK_EMPTY, MARK_EMPTY
            ],
            turn: 0,
            x: new_x,
            o: new_o,
            mode: game.mode,
            status: STATUS_ACTIVE, // Start active since both players are ready
            stake_amount: game.stake_amount,
            prize_pool,
            creator: game.rematch_requested_by,
            winner: @0x0,
            game_link,
            viewer_link,
            created_at_ms: current_time,
            completed_at_ms: 0,
            last_move_ms: current_time,
            rematch_requested_by: @0x0,
            rematch_accepted: false,
        };
        
        // Mark rematch as accepted in old game
        game.rematch_accepted = true;
        
        event::emit(RematchCreated {
            old_game_id: object::uid_to_address(&game.id),
            new_game_id: new_game_address,
            player_x: new_x,
            player_o: new_o,
            stake_amount: game.stake_amount,
        });
        
        transfer::share_object(new_game);
        
        (game_link, viewer_link)
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

    // ======== View Functions ========
    
    public fun get_treasury_balance(treasury: &Treasury): u64 {
        balance::value(&treasury.balance)
    }
    
    public fun get_total_fees_collected(treasury: &Treasury): u64 {
        treasury.total_fees_collected
    }
}