#[test_only]
module tic_tac::tic_tac_tests {
    use tic_tac::tic_tac::{Self, Game, Treasury, AdminCap};
    use sui::test_scenario::{Self as test, Scenario, next_tx, ctx};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{Self, String};
    
    const PLAYER_X: address = @0xA;
    const PLAYER_O: address = @0xB;
    const PLAYER_C: address = @0xC;
    const ADMIN: address = @0xAD;

    fun start_game(): Scenario {
        test::begin(PLAYER_X)
    }

    #[test]
    fun test_init() {
        let mut scenario = test::begin(ADMIN);
        {
            tic_tac::init_for_testing(ctx(&mut scenario));
        };
        
        // Check treasury was created
        next_tx(&mut scenario, ADMIN);
        {
            assert!(test::has_most_recent_shared<Treasury>(), 0);
            let treasury = test::take_shared<Treasury>(&scenario);
            test::return_shared(treasury);
        };
        
        // Check admin cap was transferred
        {
            assert!(test::has_most_recent_for_sender<AdminCap>(&scenario), 0);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_create_friendly_game() {
        let mut scenario = start_game();
        
        // Create friendly game
        next_tx(&mut scenario, PLAYER_X);
        {
            let (game_link, viewer_link) = tic_tac::create_friendly_game(ctx(&mut scenario));
            assert!(string::length(&game_link) > 0, 0);
            assert!(string::length(&viewer_link) > 0, 1);
        };
        
        // Check game was created in waiting status
        next_tx(&mut scenario, PLAYER_X);
        {
            assert!(test::has_most_recent_shared<Game>(), 0);
            let game = test::take_shared<Game>(&scenario);
            let (status, winner, mode, stake) = tic_tac::get_game_status(&game);
            assert!(status == 0, 1); // STATUS_WAITING
            assert!(winner == @0x0, 2);
            assert!(mode == 0, 3); // MODE_FRIENDLY
            assert!(stake == 0, 4);
            test::return_shared(game);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_create_competitive_game() {
        let mut scenario = test::begin(PLAYER_X);
        
        // Create competitive game with 2 SUI stake
        {
            let stake = coin::mint_for_testing<SUI>(2_000_000_000, ctx(&mut scenario)); // 2 SUI
            let (game_link, viewer_link) = tic_tac::create_competitive_game(stake, ctx(&mut scenario));
            assert!(string::length(&game_link) > 0, 0);
            assert!(string::length(&viewer_link) > 0, 1);
        };
        
        // Check game was created in waiting status
        next_tx(&mut scenario, PLAYER_X);
        {
            assert!(test::has_most_recent_shared<Game>(), 0);
            let game = test::take_shared<Game>(&scenario);
            let (status, winner, mode, stake) = tic_tac::get_game_status(&game);
            assert!(status == 0, 1); // STATUS_WAITING
            assert!(winner == @0x0, 2);
            assert!(mode == 1, 3); // MODE_COMPETITIVE
            assert!(stake == 2_000_000_000, 4);
            test::return_shared(game);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_join_competitive_game() {
        let mut scenario = test::begin(PLAYER_X);
        
        // Create competitive game
        {
            let stake = coin::mint_for_testing<SUI>(2_000_000_000, ctx(&mut scenario));
            tic_tac::create_competitive_game(stake, ctx(&mut scenario));
        };
        
        // Player O joins the game
        next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test::take_shared<Game>(&scenario);
            let stake = coin::mint_for_testing<SUI>(2_000_000_000, ctx(&mut scenario));
            tic_tac::join_competitive_game(&mut game, stake, ctx(&mut scenario));
            
            // Check game is now active
            let (status, _, _, _) = tic_tac::get_game_status(&game);
            assert!(status == 1, 0); // STATUS_ACTIVE
            
            test::return_shared(game);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 4)] // EInsufficientStake
    fun test_join_with_insufficient_stake() {
        let mut scenario = test::begin(PLAYER_X);
        
        // Create competitive game with 2 SUI stake
        {
            let stake = coin::mint_for_testing<SUI>(2_000_000_000, ctx(&mut scenario));
            tic_tac::create_competitive_game(stake, ctx(&mut scenario));
        };
        
        // Player O tries to join with only 1 SUI
        next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test::take_shared<Game>(&scenario);
            let stake = coin::mint_for_testing<SUI>(1_000_000_000, ctx(&mut scenario)); // Only 1 SUI
            tic_tac::join_competitive_game(&mut game, stake, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_join_friendly_game() {
        let mut scenario = start_game();
        
        // Create friendly game
        next_tx(&mut scenario, PLAYER_X);
        {
            tic_tac::create_friendly_game(ctx(&mut scenario));
        };
        
        // Player O joins the game
        next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::join_friendly_game(&mut game, ctx(&mut scenario));
            
            // Check game is now active
            let (status, _, _, _) = tic_tac::get_game_status(&game);
            assert!(status == 1, 0); // STATUS_ACTIVE
            
            test::return_shared(game);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_valid_moves_friendly() {
        let mut scenario = start_game();
        
        // Create friendly game
        next_tx(&mut scenario, PLAYER_X);
        {
            tic_tac::create_friendly_game(ctx(&mut scenario));
        };
        
        // Player O joins
        next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::join_friendly_game(&mut game, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        // X makes first move
        next_tx(&mut scenario, PLAYER_X);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::place_mark(&mut game, 0, 0, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        // O makes move
        next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::place_mark(&mut game, 1, 1, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_competitive_game_with_winner() {
        let mut scenario = test::begin(ADMIN);
        
        // Initialize treasury
        {
            tic_tac::init_for_testing(ctx(&mut scenario));
        };
        
        // Create competitive game
        next_tx(&mut scenario, PLAYER_X);
        {
            let stake = coin::mint_for_testing<SUI>(1_000_000_000, ctx(&mut scenario)); // 1 SUI
            tic_tac::create_competitive_game(stake, ctx(&mut scenario));
        };
        
        // Player O joins
        next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test::take_shared<Game>(&scenario);
            let stake = coin::mint_for_testing<SUI>(1_000_000_000, ctx(&mut scenario));
            tic_tac::join_competitive_game(&mut game, stake, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        // Play moves for X to win
        // X plays (0, 0)
        next_tx(&mut scenario, PLAYER_X);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::place_mark(&mut game, 0, 0, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        // O plays (1, 0)
        next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::place_mark(&mut game, 1, 0, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        // X plays (0, 1)
        next_tx(&mut scenario, PLAYER_X);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::place_mark(&mut game, 0, 1, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        // O plays (1, 1)
        next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::place_mark(&mut game, 1, 1, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        // X plays (0, 2) and wins
        next_tx(&mut scenario, PLAYER_X);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::place_mark(&mut game, 0, 2, ctx(&mut scenario));
            
            // Check game is completed and X won
            let (status, winner, _, _) = tic_tac::get_game_status(&game);
            assert!(status == 2, 0); // STATUS_COMPLETED
            assert!(winner == PLAYER_X, 1);
            
            test::return_shared(game);
        };
        
        // Check that X received the prize
        // Total prize pool was 2 SUI (in production, 10% would go to treasury)
        next_tx(&mut scenario, PLAYER_X);
        {
            let coin = test::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == 2_000_000_000, 0); // 2 SUI (full amount in test)
            test::return_to_sender(&scenario, coin);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 0)] // EInvalidTurn
    fun test_invalid_turn() {
        let mut scenario = start_game();
        
        // Create friendly game and join
        next_tx(&mut scenario, PLAYER_X);
        {
            tic_tac::create_friendly_game(ctx(&mut scenario));
        };
        
        next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::join_friendly_game(&mut game, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        // O tries to move first (should fail)
        next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::place_mark(&mut game, 0, 0, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 3)] // ECellOccupied
    fun test_occupied_cell() {
        let mut scenario = start_game();
        
        // Create friendly game and join
        next_tx(&mut scenario, PLAYER_X);
        {
            tic_tac::create_friendly_game(ctx(&mut scenario));
        };
        
        next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::join_friendly_game(&mut game, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        // X makes first move
        next_tx(&mut scenario, PLAYER_X);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::place_mark(&mut game, 0, 0, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        // O tries to play same cell
        next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::place_mark(&mut game, 0, 0, ctx(&mut scenario));
            test::return_shared(game);
        };
        
        test::end(scenario);
    }

    #[test]
    fun test_cancel_expired_game() {
        let mut scenario = test::begin(PLAYER_X);
        
        // Create competitive game
        {
            let stake = coin::mint_for_testing<SUI>(1_000_000_000, ctx(&mut scenario));
            tic_tac::create_competitive_game(stake, ctx(&mut scenario));
        };
        
        // Cancel the game
        next_tx(&mut scenario, PLAYER_C);
        {
            let mut game = test::take_shared<Game>(&scenario);
            tic_tac::cancel_expired_game(&mut game, ctx(&mut scenario));
            
            // Check game is cancelled
            let (status, _, _, _) = tic_tac::get_game_status(&game);
            assert!(status == 3, 0); // STATUS_CANCELLED
            
            test::return_shared(game);
        };
        
        // Check creator got refund
        next_tx(&mut scenario, PLAYER_X);
        {
            let coin = test::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == 1_000_000_000, 0);
            test::return_to_sender(&scenario, coin);
        };
        
        test::end(scenario);
    }
}