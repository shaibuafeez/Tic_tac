#[test_only]
module tic_tac::tic_tac_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::test_utils;
    use tic_tac::tic_tac::{Self, Game, Treasury, AdminCap, Trophy};
    use std::string;

    // Test addresses
    const ADMIN: address = @0xAD;
    const PLAYER_X: address = @0xA;
    const PLAYER_O: address = @0xB;
    const PLAYER_C: address = @0xC;

    // Test constants
    const STAKE_AMOUNT: u64 = 1_000_000_000; // 1 SUI

    // ======== Init Tests ========
    
    #[test]
    fun test_init() {
        let mut scenario = test_scenario::begin(ADMIN);
        {
            tic_tac::init_for_testing(test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, ADMIN);
        
        // Check Treasury is created and shared
        {
            let treasury = test_scenario::take_shared<Treasury>(&scenario);
            assert!(tic_tac::get_treasury_balance(&treasury) == 0, 0);
            assert!(tic_tac::get_total_fees_collected(&treasury) == 0, 1);
            test_scenario::return_shared(treasury);
        };
        
        // Check AdminCap is transferred to sender
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            test_scenario::return_to_sender(&scenario, admin_cap);
        };
        
        test_scenario::end(scenario);
    }

    // ======== Friendly Game Tests ========
    
    #[test]
    fun test_create_and_play_friendly_game() {
        let mut scenario = test_scenario::begin(PLAYER_X);
        
        // Initialize
        {
            tic_tac::init_for_testing(test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Create friendly game
        {
            let (game_link, viewer_link) = tic_tac::create_friendly_game(
                test_scenario::ctx(&mut scenario)
            );
            assert!(game_link == string::utf8(b"game_link_placeholder"), 0);
            assert!(viewer_link == string::utf8(b"viewer_link_placeholder"), 1);
        };
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        
        // Join friendly game
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            tic_tac::join_friendly_game(&mut game, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Make moves and complete game
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            
            // X plays (0,0)
            tic_tac::place_mark(&mut game, &mut treasury, 0, 0, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            
            // O plays (1,1)
            tic_tac::place_mark(&mut game, &mut treasury, 1, 1, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            
            // X plays (0,1)
            tic_tac::place_mark(&mut game, &mut treasury, 0, 1, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            
            // O plays (2,2)
            tic_tac::place_mark(&mut game, &mut treasury, 2, 2, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            
            // X plays (0,2) - X wins!
            tic_tac::place_mark(&mut game, &mut treasury, 0, 2, test_scenario::ctx(&mut scenario));
            
            // Check game status
            let (status, winner, mode, stake) = tic_tac::get_game_status(&game);
            assert!(status == 2, 0); // COMPLETED
            assert!(winner == PLAYER_X, 1);
            assert!(mode == 0, 2); // FRIENDLY
            assert!(stake == 0, 3);
            
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Check trophy was minted
        {
            let trophy = test_scenario::take_from_sender<Trophy>(&scenario);
            test_scenario::return_to_sender(&scenario, trophy);
        };
        
        test_scenario::end(scenario);
    }

    // ======== Competitive Game Tests ========
    
    #[test]
    fun test_create_and_play_competitive_game() {
        let mut scenario = test_scenario::begin(PLAYER_X);
        
        // Initialize
        {
            tic_tac::init_for_testing(test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Create competitive game with stake
        {
            let stake = coin::mint_for_testing<SUI>(STAKE_AMOUNT, test_scenario::ctx(&mut scenario));
            let (game_link, viewer_link) = tic_tac::create_competitive_game(
                stake,
                test_scenario::ctx(&mut scenario)
            );
            assert!(game_link == string::utf8(b"game_link_placeholder"), 0);
            assert!(viewer_link == string::utf8(b"viewer_link_placeholder"), 1);
        };
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        
        // Join competitive game
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let stake = coin::mint_for_testing<SUI>(STAKE_AMOUNT, test_scenario::ctx(&mut scenario));
            tic_tac::join_competitive_game(&mut game, stake, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Play game - X wins
        play_x_wins_game(&mut scenario);
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Check treasury collected fees (10% of 2 SUI = 0.2 SUI)
        {
            let treasury = test_scenario::take_shared<Treasury>(&scenario);
            let expected_fee = (STAKE_AMOUNT * 2 * 1000) / 10000; // 10% fee
            assert!(tic_tac::get_treasury_balance(&treasury) == expected_fee, 0);
            assert!(tic_tac::get_total_fees_collected(&treasury) == expected_fee, 1);
            test_scenario::return_shared(treasury);
        };
        
        // Check winner received 90% of prize pool
        {
            let trophy = test_scenario::take_from_sender<Trophy>(&scenario);
            test_scenario::return_to_sender(&scenario, trophy);
            
            // Winner should have received coins (1.8 SUI)
            let expected_prize = (STAKE_AMOUNT * 2 * 9000) / 10000; // 90% of prize
            // Note: In real scenario, we'd check the coin balance
        };
        
        test_scenario::end(scenario);
    }

    // ======== Timeout Tests ========
    
    #[test]
    fun test_claim_timeout_victory() {
        let mut scenario = test_scenario::begin(PLAYER_X);
        
        // Initialize
        {
            tic_tac::init_for_testing(test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Create competitive game
        {
            let stake = coin::mint_for_testing<SUI>(STAKE_AMOUNT, test_scenario::ctx(&mut scenario));
            tic_tac::create_competitive_game(stake, test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        
        // Join game
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let stake = coin::mint_for_testing<SUI>(STAKE_AMOUNT, test_scenario::ctx(&mut scenario));
            tic_tac::join_competitive_game(&mut game, stake, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
        };
        
        // Fast forward time by more than 1 hour (3600+ epochs)
        test_scenario::next_epoch(&mut scenario, PLAYER_O);
        let mut i = 0;
        while (i < 3601) {
            test_scenario::next_epoch(&mut scenario, PLAYER_O);
            i = i + 1;
        };
        
        // Player O claims timeout victory (X didn't move)
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            
            tic_tac::claim_timeout_victory(
                &mut game, 
                &mut treasury, 
                test_scenario::ctx(&mut scenario)
            );
            
            // Check game status
            let (status, winner, _, _) = tic_tac::get_game_status(&game);
            assert!(status == 2, 0); // COMPLETED
            assert!(winner == PLAYER_O, 1); // O wins by timeout
            
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        
        // Check treasury collected fees
        {
            let treasury = test_scenario::take_shared<Treasury>(&scenario);
            let expected_fee = (STAKE_AMOUNT * 2 * 1000) / 10000; // 10% fee
            assert!(tic_tac::get_treasury_balance(&treasury) == expected_fee, 0);
            test_scenario::return_shared(treasury);
        };
        
        // Check winner got trophy
        {
            let trophy = test_scenario::take_from_sender<Trophy>(&scenario);
            test_scenario::return_to_sender(&scenario, trophy);
        };
        
        test_scenario::end(scenario);
    }

    // ======== Error Cases Tests ========
    
    #[test]
    #[expected_failure(abort_code = 0)] // EInvalidTurn
    fun test_invalid_turn() {
        let mut scenario = test_scenario::begin(PLAYER_X);
        
        setup_active_game(&mut scenario);
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // X tries to play twice
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            
            tic_tac::place_mark(&mut game, &mut treasury, 0, 0, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            
            // This should fail - not X's turn
            tic_tac::place_mark(&mut game, &mut treasury, 0, 1, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 3)] // ECellOccupied
    fun test_cell_occupied() {
        let mut scenario = test_scenario::begin(PLAYER_X);
        
        setup_active_game(&mut scenario);
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // X plays (0,0)
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            
            tic_tac::place_mark(&mut game, &mut treasury, 0, 0, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        
        // O tries to play same cell (0,0)
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            
            // This should fail - cell occupied
            tic_tac::place_mark(&mut game, &mut treasury, 0, 0, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 9)] // ECannotJoinOwnGame
    fun test_cannot_join_own_game() {
        let mut scenario = test_scenario::begin(PLAYER_X);
        
        // Initialize
        {
            tic_tac::init_for_testing(test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Create game
        {
            tic_tac::create_friendly_game(test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Try to join own game
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            // This should fail
            tic_tac::join_friendly_game(&mut game, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 4)] // EInsufficientStake
    fun test_insufficient_stake() {
        let mut scenario = test_scenario::begin(PLAYER_X);
        
        // Initialize
        {
            tic_tac::init_for_testing(test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Create competitive game
        {
            let stake = coin::mint_for_testing<SUI>(STAKE_AMOUNT, test_scenario::ctx(&mut scenario));
            tic_tac::create_competitive_game(stake, test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        
        // Try to join with insufficient stake
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let stake = coin::mint_for_testing<SUI>(STAKE_AMOUNT / 2, test_scenario::ctx(&mut scenario));
            // This should fail
            tic_tac::join_competitive_game(&mut game, stake, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(game);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 11)] // ETimeoutNotReached
    fun test_claim_timeout_too_early() {
        let mut scenario = test_scenario::begin(PLAYER_X);
        
        setup_active_game(&mut scenario);
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        
        // Try to claim timeout immediately (should fail)
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            
            // This should fail - timeout not reached
            tic_tac::claim_timeout_victory(
                &mut game, 
                &mut treasury, 
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        
        test_scenario::end(scenario);
    }

    // ======== Admin Tests ========
    
    #[test]
    fun test_admin_withdraw_fees() {
        let mut scenario = test_scenario::begin(ADMIN);
        
        // Initialize
        {
            tic_tac::init_for_testing(test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Play a competitive game to generate fees
        setup_and_complete_competitive_game(&mut scenario);
        test_scenario::next_tx(&mut scenario, ADMIN);
        
        // Admin withdraws fees
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            
            let balance_before = tic_tac::get_treasury_balance(&treasury);
            assert!(balance_before > 0, 0);
            
            // Withdraw half of the fees
            let withdraw_amount = balance_before / 2;
            tic_tac::withdraw_fees(
                &admin_cap,
                &mut treasury,
                withdraw_amount,
                ADMIN,
                test_scenario::ctx(&mut scenario)
            );
            
            assert!(tic_tac::get_treasury_balance(&treasury) == balance_before - withdraw_amount, 1);
            
            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(treasury);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_cancel_expired_game() {
        let mut scenario = test_scenario::begin(PLAYER_X);
        
        // Initialize
        {
            tic_tac::init_for_testing(test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Create competitive game
        {
            let stake = coin::mint_for_testing<SUI>(STAKE_AMOUNT, test_scenario::ctx(&mut scenario));
            tic_tac::create_competitive_game(stake, test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Cancel the game
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            tic_tac::cancel_expired_game(&mut game, test_scenario::ctx(&mut scenario));
            
            // Check game is cancelled
            let (status, _, _, _) = tic_tac::get_game_status(&game);
            assert!(status == 3, 0); // CANCELLED
            
            test_scenario::return_shared(game);
        };
        
        // Creator should have received stake back
        // Note: In real scenario, we'd check the coin balance
        
        test_scenario::end(scenario);
    }

    // ======== Draw Game Test ========
    
    #[test]
    fun test_draw_game() {
        let mut scenario = test_scenario::begin(PLAYER_X);
        
        setup_active_game(&mut scenario);
        
        // Play a draw game
        // X O X
        // X X O
        // O X O
        play_draw_game(&mut scenario);
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        // Check game ended in draw
        {
            let game = test_scenario::take_shared<Game>(&scenario);
            let (status, winner, _, _) = tic_tac::get_game_status(&game);
            assert!(status == 2, 0); // COMPLETED
            assert!(winner == @0x0, 1); // No winner
            test_scenario::return_shared(game);
        };
        
        // For competitive games, both players should get their stakes back
        // For friendly games, no trophies are minted
        
        test_scenario::end(scenario);
    }

    // ======== Helper Functions ========
    
    fun setup_active_game(scenario: &mut Scenario) {
        // Initialize
        {
            tic_tac::init_for_testing(test_scenario::ctx(scenario));
        };
        test_scenario::next_tx(scenario, PLAYER_X);
        
        // Create friendly game
        {
            tic_tac::create_friendly_game(test_scenario::ctx(scenario));
        };
        test_scenario::next_tx(scenario, PLAYER_O);
        
        // Join game
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            tic_tac::join_friendly_game(&mut game, test_scenario::ctx(scenario));
            test_scenario::return_shared(game);
        };
    }

    fun setup_and_complete_competitive_game(scenario: &mut Scenario) {
        test_scenario::next_tx(scenario, PLAYER_X);
        
        // Create competitive game
        {
            let stake = coin::mint_for_testing<SUI>(STAKE_AMOUNT, test_scenario::ctx(scenario));
            tic_tac::create_competitive_game(stake, test_scenario::ctx(scenario));
        };
        test_scenario::next_tx(scenario, PLAYER_O);
        
        // Join game
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let stake = coin::mint_for_testing<SUI>(STAKE_AMOUNT, test_scenario::ctx(scenario));
            tic_tac::join_competitive_game(&mut game, stake, test_scenario::ctx(scenario));
            test_scenario::return_shared(game);
        };
        test_scenario::next_tx(scenario, PLAYER_X);
        
        // Play game - X wins
        play_x_wins_game(scenario);
    }

    fun play_x_wins_game(scenario: &mut Scenario) {
        // X wins with top row
        // X X X
        // O O .
        // . . .
        
        // X plays (0,0)
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 0, 0, test_scenario::ctx(scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        test_scenario::next_tx(scenario, PLAYER_O);
        
        // O plays (1,0)
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 1, 0, test_scenario::ctx(scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        test_scenario::next_tx(scenario, PLAYER_X);
        
        // X plays (0,1)
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 0, 1, test_scenario::ctx(scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        test_scenario::next_tx(scenario, PLAYER_O);
        
        // O plays (1,1)
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 1, 1, test_scenario::ctx(scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        test_scenario::next_tx(scenario, PLAYER_X);
        
        // X plays (0,2) - X wins!
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 0, 2, test_scenario::ctx(scenario));
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
    }

    fun play_draw_game(scenario: &mut Scenario) {
        // Play all moves for a draw
        // Final board:
        // X O X
        // X X O  
        // O X O
        
        test_scenario::next_tx(scenario, PLAYER_X);
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 0, 0, test_scenario::ctx(scenario)); // X
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        
        test_scenario::next_tx(scenario, PLAYER_O);
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 0, 1, test_scenario::ctx(scenario)); // O
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        
        test_scenario::next_tx(scenario, PLAYER_X);
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 0, 2, test_scenario::ctx(scenario)); // X
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        
        test_scenario::next_tx(scenario, PLAYER_O);
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 1, 2, test_scenario::ctx(scenario)); // O
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        
        test_scenario::next_tx(scenario, PLAYER_X);
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 1, 0, test_scenario::ctx(scenario)); // X
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        
        test_scenario::next_tx(scenario, PLAYER_O);
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 2, 0, test_scenario::ctx(scenario)); // O
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        
        test_scenario::next_tx(scenario, PLAYER_X);
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 1, 1, test_scenario::ctx(scenario)); // X
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        
        test_scenario::next_tx(scenario, PLAYER_O);
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 2, 2, test_scenario::ctx(scenario)); // O
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
        
        test_scenario::next_tx(scenario, PLAYER_X);
        {
            let mut game = test_scenario::take_shared<Game>(scenario);
            let mut treasury = test_scenario::take_shared<Treasury>(scenario);
            tic_tac::place_mark(&mut game, &mut treasury, 2, 1, test_scenario::ctx(scenario)); // X - Draw!
            test_scenario::return_shared(game);
            test_scenario::return_shared(treasury);
        };
    }
}