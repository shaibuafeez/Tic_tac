module tic_tac::tic_tac {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::vector;

    const MARK__: u8 = 0;
    const MARK_X: u8 = 1;
    const MARK_O: u8 = 2;

    const EInvalidTurn: u64 = 0;
    const EInvalidLocation: u64 = 1;
    const EGameOver: u64 = 2;
    const ECellOccupied: u64 = 3;

    public struct Game has key {
        id: UID,
        board: vector<u8>,
        turn: u8,
        x: address,
        o: address,
    }

    public struct Trophy has key, store {
        id: UID,
        game_id: address,
    }

    public fun new(x: address, o: address, ctx: &mut TxContext) {
        transfer::share_object(Game {
            id: object::new(ctx),
            board: vector[
                MARK__, MARK__, MARK__,
                MARK__, MARK__, MARK__,
                MARK__, MARK__, MARK__
            ],
            turn: 0,
            x,
            o,
        });
    }

    public fun place_mark(game: &mut Game, row: u8, col: u8, ctx: &mut TxContext) {
        assert!(row < 3 && col < 3, EInvalidLocation);
        
        let current_player = if (game.turn % 2 == 0) { game.x } else { game.o };
        assert!(tx_context::sender(ctx) == current_player, EInvalidTurn);
        
        let index = (row as u64) * 3 + (col as u64);
        let cell = vector::borrow(&game.board, index);
        assert!(*cell == MARK__, ECellOccupied);
        
        let mark = if (game.turn % 2 == 0) { MARK_X } else { MARK_O };
        *vector::borrow_mut(&mut game.board, index) = mark;
        
        if (has_winner(game)) {
            let trophy = Trophy {
                id: object::new(ctx),
                game_id: object::uid_to_address(&game.id),
            };
            transfer::transfer(trophy, current_player);
        } else {
            game.turn = game.turn + 1;
        }
    }

    fun has_winner(game: &Game): bool {
        let board = &game.board;
        
        // Check rows
        if (check_line(board, 0, 1, 2) ||
            check_line(board, 3, 4, 5) ||
            check_line(board, 6, 7, 8)) {
            return true
        };
        
        // Check columns
        if (check_line(board, 0, 3, 6) ||
            check_line(board, 1, 4, 7) ||
            check_line(board, 2, 5, 8)) {
            return true
        };
        
        // Check diagonals
        if (check_line(board, 0, 4, 8) ||
            check_line(board, 2, 4, 6)) {
            return true
        };
        
        false
    }

    fun check_line(board: &vector<u8>, a: u64, b: u64, c: u64): bool {
        let mark_a = *vector::borrow(board, a);
        let mark_b = *vector::borrow(board, b);
        let mark_c = *vector::borrow(board, c);
        
        mark_a != MARK__ && mark_a == mark_b && mark_b == mark_c
    }
}


