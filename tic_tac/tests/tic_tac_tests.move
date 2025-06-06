#[test_only]
module tic_tac::tic_tac_tests {
    use tic_tac::tic_tac::{Self, Game, Trophy};
    use sui::test_scenario::{Self, Scenario};
    use sui::object;

    const PLAYER_X: address = @0xa;
    const PLAYER_O: address = @0xb;
    const INVALID_PLAYER: address = @0xc;

    fun create_game_scenario(): Scenario {
        let mut scenario = test_scenario::begin(PLAYER_X);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::new(PLAYER_X, PLAYER_O, ctx);
        };
        scenario
    }

    #[test]
    fun test_game_creation() {
        let mut scenario = create_game_scenario();
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        assert!(test_scenario::has_most_recent_shared<Game>(), 0);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_valid_first_move() {
        let mut scenario = create_game_scenario();
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::place_mark(&mut game, 0, 0, ctx);
            test_scenario::return_shared(game);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_alternating_turns() {
        let mut scenario = create_game_scenario();
        
        // Player X moves
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::place_mark(&mut game, 0, 0, ctx);
            test_scenario::return_shared(game);
        };
        
        // Player O moves
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::place_mark(&mut game, 1, 1, ctx);
            test_scenario::return_shared(game);
        };
        
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = 1)]
    fun test_invalid_location() {
        let mut scenario = create_game_scenario();
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::place_mark(&mut game, 3, 3, ctx);
            test_scenario::return_shared(game);
        };
        
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = 0)]
    fun test_wrong_turn() {
        let mut scenario = create_game_scenario();
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::place_mark(&mut game, 0, 0, ctx);
            test_scenario::return_shared(game);
        };
        
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = 3)]
    fun test_occupied_cell() {
        let mut scenario = create_game_scenario();
        
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::place_mark(&mut game, 0, 0, ctx);
            test_scenario::return_shared(game);
        };
        
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::place_mark(&mut game, 0, 0, ctx);
            test_scenario::return_shared(game);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_row_win() {
        let mut scenario = create_game_scenario();
        
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::place_mark(&mut game, 0, 0, ctx);
            test_scenario::return_shared(game);
        };
        
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::place_mark(&mut game, 1, 0, ctx);
            test_scenario::return_shared(game);
        };
        
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::place_mark(&mut game, 0, 1, ctx);
            test_scenario::return_shared(game);
        };
        
        test_scenario::next_tx(&mut scenario, PLAYER_O);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::place_mark(&mut game, 1, 1, ctx);
            test_scenario::return_shared(game);
        };
        
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        {
            let mut game = test_scenario::take_shared<Game>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            tic_tac::place_mark(&mut game, 0, 2, ctx);
            test_scenario::return_shared(game);
        };
        
        test_scenario::next_tx(&mut scenario, PLAYER_X);
        assert!(test_scenario::has_most_recent_for_sender<Trophy>(&scenario), 0);
        
        test_scenario::end(scenario);
    }
}
