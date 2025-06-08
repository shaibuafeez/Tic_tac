"use client";

import { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { GameBoard } from "./GameBoard";
import { GameModeSelection } from "./GameModeSelection";
import { JoinGame } from "./JoinGame";
import { GameList } from "./GameList";
import { ShareGame } from "./ShareGame";
import { WalletButton } from "./WalletButton";
import { MyGames } from "./MyGames";
import {
  CONTRACT_CONFIG,
  GAME_CONSTANTS,
  GAME_MODE,
  GAME_STATUS,
} from "@/config/constants";
import { useRouter } from "next/navigation";
import { useGameSync } from "@/hooks/useGameSync";
import { useLanguage } from "@/hooks/useLanguage";
import { isZeroAddress } from "@/utils/sui-helpers";

export interface GameState {
  id: string;
  board: number[];
  turn: number;
  x: string;
  o: string;
  mode: number;
  status: number;
  stakeAmount: number;
  creator: string;
  winner: string;
  lastMoveEpoch?: number;
  gameLink?: string;
  viewerLink?: string;
}

interface TicTacToeGameProps {
  gameId?: string;
}

export function TicTacToeGame({ gameId }: TicTacToeGameProps = {}) {
  const { t } = useLanguage();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGameList, setShowGameList] = useState(false);
  const [showMyGames, setShowMyGames] = useState(false);
  const [showJoinGame, setShowJoinGame] = useState(false);
  const [showShareGame, setShowShareGame] = useState(false);
  const [shareLinks, setShareLinks] = useState({
    gameLink: "",
    viewerLink: "",
  });
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showObjectChanges: true,
          showEvents: true,
          showInput: true,
          showBalanceChanges: true,
        },
      }),
  });
  const suiClient = useSuiClient();
  const router = useRouter();

  // Use real-time sync when waiting for opponent (for both game types)
  // or when in active game to see opponent moves
  const shouldSync =
    gameState !== null &&
    !gameState.id.startsWith("game-") &&
    (gameState.status === GAME_STATUS.WAITING ||
      gameState.status === GAME_STATUS.ACTIVE);

  useGameSync({
    gameId: shouldSync ? gameState.id : null,
    onGameUpdate: (updatedGame) => {
      console.log("🔄 Game sync update received:", updatedGame);
      console.log("📊 Game sync - Current state vs Updated:", {
        currentStatus: gameState?.status,
        updatedStatus: updatedGame.status,
        currentPlayer: account?.address
      });
      
      if (
        updatedGame.status === GAME_STATUS.ACTIVE &&
        gameState?.status === GAME_STATUS.WAITING
      ) {
        // Game has started! Hide join screen and update state
        setShowJoinGame(false);
        setGameState(updatedGame);
      } else {
        // Update game state even if status hasn't changed to ACTIVE
        setGameState(updatedGame);
      }
    },
    enabled: shouldSync,
    interval: 3000,
  });

  // Load game if gameId is provided
  useEffect(() => {
    if (gameId) {
      loadGame(gameId);
    }
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGame = async (id: string) => {
    setIsLoading(true);
    try {
      // Check if this is a demo game
      if (id.startsWith("demo-game-")) {
        alert(
          "This is a demo game link. The game was created locally and cannot be shared. Please ask the game creator to create a new competitive game to get a shareable link."
        );
        router.push("/");
        return;
      }

      console.log("Loading game with ID:", id);

      const object = await suiClient.getObject({
        id,
        options: {
          showContent: true,
        },
      });

      if (!object.data) {
        console.error("Game object not found for ID:", id);
        alert(
          "Game not found. This could mean:\n1. The game was created in demo mode and cannot be shared\n2. The game ID is invalid\n3. The game was deleted\n\nPlease ask the game creator to create a new competitive game."
        );
        router.push("/");
        return;
      }

      // Parse game data from the actual Move object
      const content = object.data.content;
      if (!content || !("fields" in content)) {
        alert("Invalid game data format");
        router.push("/");
        return;
      }

      const fields = content.fields as Record<string, unknown>;
      console.log("Game fields from blockchain:", fields);

      // Parse the board array properly
      let board = Array(9).fill(GAME_CONSTANTS.MARK_EMPTY);
      if (fields.board && Array.isArray(fields.board)) {
        board = fields.board.map((cell) => Number(cell));
      }

      const gameState: GameState = {
        id,
        board,
        turn: Number(fields.turn) || 0,
        x: String(fields.x) || "",
        o: String(fields.o) || "",
        mode:
          fields.mode !== undefined
            ? Number(fields.mode)
            : GAME_MODE.COMPETITIVE,
        status:
          fields.status !== undefined
            ? Number(fields.status)
            : GAME_STATUS.WAITING,
        stakeAmount: Number(fields.stake_amount) || 0,
        creator: String(fields.creator) || "",
        winner: String(fields.winner) || "",
        lastMoveEpoch: Number(fields.last_move_ms) || 0,
        gameLink: `${window.location.origin}/game/${id}`,
        viewerLink: `${window.location.origin}/view/${id}`,
      };

      console.log("Parsed game state:", gameState);
      console.log("Current account:", account?.address);
      console.log("Game creator:", gameState.creator);
      console.log("Player X:", gameState.x);
      console.log("Player O:", gameState.o);
      console.log("Game mode value:", gameState.mode);
      console.log("Is competitive?", gameState.mode === GAME_MODE.COMPETITIVE);
      console.log("Is friendly?", gameState.mode === GAME_MODE.FRIENDLY);

      setGameState(gameState);

      // If it's a game waiting for players and user is not the creator, show join screen
      if (
        gameState.status === GAME_STATUS.WAITING &&
        gameState.creator !== account?.address
      ) {
        setShowJoinGame(true);
      }
    } catch (error) {
      console.error("Error loading game:", error);
      console.error("Game ID that failed:", id);
      alert(
        "Failed to load game. This could mean:\n1. The game ID is invalid\n2. Network connection issues\n3. The game was created in demo mode\n\nPlease check your connection and try again, or ask for a new game link."
      );
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const createGame = async (mode: number, stakeAmount?: number) => {
    if (!account) return;

    setIsLoading(true);
    try {
      const transaction = new Transaction();

      if (mode === GAME_MODE.FRIENDLY) {
        transaction.moveCall({
          target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::create_friendly_game`,
          arguments: [transaction.object('0x6')], // Clock object
        });
      } else if (mode === GAME_MODE.COMPETITIVE && stakeAmount) {
        // Split coins for the stake
        const [coin] = transaction.splitCoins(transaction.gas, [
          transaction.pure.u64(stakeAmount),
        ]);

        transaction.moveCall({
          target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::create_competitive_game`,
          arguments: [coin, transaction.object('0x6')], // Stake and Clock
        });
      }

      signAndExecute(
        { transaction },
        {
          onSuccess: (result) => {
            console.log("Game created successfully");
            console.log("Transaction digest:", result.digest);
            console.log("Full transaction result:", result);

            let gameId: string | null = null;

            // Extract from objectChanges (now available due to options)
            const resultWithChanges = result as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            if (resultWithChanges.objectChanges) {
              const createdObjects = resultWithChanges.objectChanges.filter(
                (change: any) => change.type === "created" // eslint-disable-line @typescript-eslint/no-explicit-any
              );
              console.log(
                "Created objects from transaction result:",
                createdObjects
              );

              const gameObject = createdObjects.find((obj: { objectType?: string; objectId?: string }) => {
                return (
                  obj.objectType && obj.objectType.includes("tic_tac::Game")
                );
              });

              if (gameObject) {
                gameId = gameObject.objectId;
                console.log(
                  "Successfully extracted game ID from objectChanges:",
                  gameId
                );
              }
            }

            // Fallback: Extract from events
            if (!gameId && resultWithChanges.events) {
              console.log(
                "Trying to extract from events:",
                resultWithChanges.events
              );
              const gameCreatedEvent = resultWithChanges.events.find(
                (
                  event: { type?: string; parsedJson?: unknown }
                ) => event.type && event.type.includes("GameCreated")
              );

              if (gameCreatedEvent && gameCreatedEvent.parsedJson) {
                const eventData = gameCreatedEvent.parsedJson as { game_id?: string };
                if (eventData.game_id) {
                  gameId = eventData.game_id;
                  console.log(
                    "Successfully extracted game ID from events:",
                    gameId
                  );
                }
              }
            }

            if (!gameId) {
              console.error(
                "Failed to extract game ID from transaction result"
              );
              alert("Failed to create game properly. Please try again.");
              return;
            }

            const gameLink = `${window.location.origin}/game/${gameId}`;
            const viewerLink = `${window.location.origin}/view/${gameId}`;

            // Set share links and show share modal
            setShareLinks({ gameLink, viewerLink });
            setShowShareGame(true);

            // Create a local game state
            setGameState({
              id: gameId,
              board: Array(9).fill(GAME_CONSTANTS.MARK_EMPTY),
              turn: 0,
              x: account.address,
              o: "", // Empty for both game types until someone joins
              mode,
              status: GAME_STATUS.WAITING, // Both game types start in waiting state
              stakeAmount: stakeAmount || 0,
              creator: account.address,
              winner: "",
              lastMoveEpoch: Math.floor(Date.now() / 1000), // Set creation time
              gameLink,
              viewerLink,
            });

            // Both game types show join screen for sharing
            setShowJoinGame(true);
          },
          onError: (error) => {
            console.error("Failed to create game:", error);
            alert("Failed to create game. Please try again.");
          },
        }
      );
    } catch (error) {
      console.error("Error creating game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinFriendlyGame = async () => {
    if (!account || !gameState) return;

    console.log("Joining friendly game:", {
      gameId: gameState.id,
      gameMode: gameState.mode,
      expectedMode: GAME_MODE.FRIENDLY,
    });

    setIsLoading(true);
    try {
      const transaction = new Transaction();

      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::join_friendly_game`,
        arguments: [transaction.object(gameState.id), transaction.object('0x6')], // Game and Clock
      });

      signAndExecute(
        { transaction },
        {
          onSuccess: async (result) => {
            console.log("Joined friendly game:", result);

            // Reload the game from blockchain to get the updated state
            try {
              await loadGame(gameState.id);
              setShowJoinGame(false);
            } catch (error) {
              console.error("Error reloading game after join:", error);
              // Fallback to manual update
              setGameState({
                ...gameState,
                o: account.address,
                status: GAME_STATUS.ACTIVE,
              });
              setShowJoinGame(false);
            }
          },
          onError: (error) => {
            console.error("Failed to join friendly game:", error);
            alert("Failed to join game. Please try again.");
          },
        }
      );
    } catch (error) {
      console.error("Error joining friendly game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinCompetitiveGame = async () => {
    if (!account || !gameState) return;

    console.log("Joining competitive game:", {
      gameId: gameState.id,
      gameMode: gameState.mode,
      expectedMode: GAME_MODE.COMPETITIVE,
      stakeAmount: gameState.stakeAmount,
    });

    setIsLoading(true);
    try {
      const transaction = new Transaction();

      // Split coins for the stake
      const [coin] = transaction.splitCoins(transaction.gas, [
        transaction.pure.u64(gameState.stakeAmount),
      ]);

      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::join_competitive_game`,
        arguments: [transaction.object(gameState.id), coin, transaction.object('0x6')], // Game, Stake, and Clock
      });

      signAndExecute(
        { transaction },
        {
          onSuccess: async (result) => {
            console.log("Joined game:", result);

            // Reload the game from blockchain to get the updated state
            try {
              await loadGame(gameState.id);
              setShowJoinGame(false);
            } catch (error) {
              console.error("Error reloading game after join:", error);
              // Fallback to manual update
              setGameState({
                ...gameState,
                o: account.address,
                status: GAME_STATUS.ACTIVE,
              });
              setShowJoinGame(false);
            }
          },
          onError: (error) => {
            console.error("Failed to join game:", error);
            alert("Failed to join game. Please try again.");
          },
        }
      );
    } catch (error) {
      console.error("Error joining game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const makeMove = async (row: number, col: number) => {
    if (!account || !gameState) return;

    // For local games, handle locally
    if (gameState.id.startsWith("game-")) {
      const newBoard = [...gameState.board];
      const index = row * 3 + col;
      newBoard[index] =
        gameState.turn % 2 === 0
          ? GAME_CONSTANTS.MARK_X
          : GAME_CONSTANTS.MARK_O;

      setGameState({
        ...gameState,
        board: newBoard,
        turn: gameState.turn + 1,
      });

      return;
    }

    // For real games, make blockchain transaction
    setIsLoading(true);
    try {
      const transaction = new Transaction();

      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::place_mark`,
        arguments: [
          transaction.object(gameState.id),
          transaction.object(CONTRACT_CONFIG.TREASURY_ID),
          transaction.object('0x6'), // Clock
          transaction.pure.u8(row),
          transaction.pure.u8(col),
        ],
      });

      signAndExecute(
        { transaction },
        {
          onSuccess: (result) => {
            console.log("Move made:", result);

            // Update local game state
            const newBoard = [...gameState.board];
            const index = row * 3 + col;
            newBoard[index] =
              gameState.turn % 2 === 0
                ? GAME_CONSTANTS.MARK_X
                : GAME_CONSTANTS.MARK_O;

            setGameState({
              ...gameState,
              board: newBoard,
              turn: gameState.turn + 1,
              lastMoveEpoch: Date.now(), // Current time in milliseconds (matching blockchain storage)
            });
          },
          onError: (error) => {
            console.error("Failed to make move:", error);
            alert("Failed to make move. Please try again.");
          },
        }
      );
    } catch (error) {
      console.error("Error making move:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setGameState(null);
    setShowGameList(false);
    setShowMyGames(false);
    setShowJoinGame(false);
  };

  const cancelGame = async () => {
    if (!account || !gameState) return;

    setIsLoading(true);
    try {
      const transaction = new Transaction();

      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::cancel_expired_game`,
        arguments: [transaction.object(gameState.id)],
      });

      signAndExecute(
        { transaction },
        {
          onSuccess: (result) => {
            console.log("Game cancelled:", result);
            alert(
              `Game cancelled! Your ${(
                gameState.stakeAmount / 1_000_000_000
              ).toFixed(2)} SUI has been returned.`
            );
            resetGame();
          },
          onError: (error) => {
            console.error("Failed to cancel game:", error);
            alert(
              "Failed to cancel game. The game might have already started or been cancelled."
            );
          },
        }
      );
    } catch (error) {
      console.error("Error cancelling game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimTimeoutVictory = async () => {
    if (!account || !gameState) return;

    try {
      // Get current time and convert lastMoveEpoch from milliseconds to seconds
      const currentTimeMs = Date.now();
      const currentTimeSeconds = Math.floor(currentTimeMs / 1000);
      const lastMoveMs = gameState.lastMoveEpoch || 0; // This is in milliseconds from blockchain
      const lastMoveSeconds = Math.floor(lastMoveMs / 1000);
      const timeElapsedSeconds = currentTimeSeconds - lastMoveSeconds;
      const timeoutDurationSeconds = 900; // 15 minutes = 900 seconds (MOVE_TIMEOUT_MS / 1000)
      
      console.log("Debug timeout claim:", {
        currentTimeMs,
        currentTimeSeconds,
        lastMoveMs,
        lastMoveSeconds,
        timeElapsedSeconds,
        timeoutDurationSeconds,
        hasEnoughTimePassed: timeElapsedSeconds >= timeoutDurationSeconds,
        gameState,
        currentPlayer: account.address,
        isPlayerX: gameState.x === account.address,
        isPlayerO: gameState.o === account.address,
        currentTurnPlayer: gameState.turn % 2 === 0 ? gameState.x : gameState.o,
        note: "Times converted from milliseconds to seconds for comparison",
      });

      // First check if we have valid timing data
      if (!lastMoveMs || lastMoveMs === 0) {
        alert("Game timing data is invalid. Please refresh and try again.");
        return;
      }

      // Check for potential underflow condition
      if (currentTimeSeconds < lastMoveSeconds) {
        alert("Timing error detected. Please refresh the page and try again.");
        return;
      }

      // Validate conditions before making blockchain call
      if (timeElapsedSeconds < timeoutDurationSeconds) {
        const remainingSeconds = timeoutDurationSeconds - timeElapsedSeconds;
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        alert(`Timeout not reached yet. Please wait ${remainingMinutes} more minutes. (${remainingSeconds} seconds remaining)`);
        return;
      }

      const currentTurnPlayer = gameState.turn % 2 === 0 ? gameState.x : gameState.o;
      if (account.address === currentTurnPlayer) {
        alert("You cannot claim timeout victory on your own turn. It's your turn to move!");
        return;
      }

      if (gameState.x !== account.address && gameState.o !== account.address) {
        alert("You are not a player in this game.");
        return;
      }

      // Additional validation: make sure we're not trying to claim on an empty opponent slot
      if (gameState.o === "" || gameState.o === "0x0") {
        alert("Game is still waiting for an opponent to join.");
        return;
      }

      setIsLoading(true);
      const transaction = new Transaction();

      transaction.moveCall({
        target: `${CONTRACT_CONFIG.PACKAGE_ID}::tic_tac::claim_timeout_victory`,
        arguments: [
          transaction.object(gameState.id),
          transaction.object(CONTRACT_CONFIG.TREASURY_ID),
          transaction.object('0x6'), // Clock
        ],
      });

      signAndExecute(
        { transaction },
        {
          onSuccess: (result) => {
            console.log("Timeout victory claimed:", result);
            const winAmount = gameState.mode === GAME_MODE.COMPETITIVE && gameState.stakeAmount > 0
              ? (gameState.stakeAmount * 2 * 0.9) / 1_000_000_000
              : 0;
            
            if (winAmount > 0) {
              alert(`🎉 Victory by timeout! You won ${winAmount.toFixed(2)} SUI!`);
            } else {
              alert("🎉 Victory by timeout! You earned an NFT trophy!");
            }
            
            // Update game state to show victory
            setGameState({
              ...gameState,
              status: GAME_STATUS.COMPLETED,
              winner: account.address,
            });
          },
          onError: (error) => {
            console.error("Failed to claim timeout victory:", error);
            
            // Provide more specific error messages based on common failure cases
            let errorMessage = "Failed to claim timeout victory. ";
            if (error.toString().includes("ETimeoutNotReached")) {
              errorMessage += "The 1-hour timeout period has not been reached yet.";
            } else if (error.toString().includes("ECannotClaimOwnTimeout")) {
              errorMessage += "You cannot claim timeout on your own turn.";
            } else if (error.toString().includes("EGameNotActive")) {
              errorMessage += "The game is not active.";
            } else if (error.toString().includes("EInvalidTurn")) {
              errorMessage += "You are not a valid player in this game.";
            } else {
              errorMessage += "Please check the game state and try again.";
            }
            
            alert(errorMessage);
          },
        }
      );
    } catch (error) {
      console.error("Error claiming timeout victory:", error);
    } finally {
      setIsLoading(false);
    }
  };




  const selectGame = (game: GameState) => {
    setGameState(game);
    setShowGameList(false);

    // If it's a game waiting for players, show join screen
    if (game.status === GAME_STATUS.WAITING) {
      setShowJoinGame(true);
    }
  };

  if (!account) {
    return (
      <div className="bg-white border-2 border-black rounded-lg p-8 text-center max-w-md mx-auto animate-fade-in">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-black rounded-lg flex items-center justify-center animate-pulse">
            <div className="text-white text-3xl font-bold">X</div>
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">
            {gameId ? t("joinGame") : t("gameTitle")}
          </h2>
          <p className="text-black">
            {gameId ? t("connectWalletToJoin") : t("gameDescription")}
          </p>
        </div>

        {gameId && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg animate-fade-in">
            <p className="text-sm text-blue-800 mb-2 font-semibold">
              🎮 {t("invitedToGame")}
            </p>
            <p className="text-xs text-blue-600 font-mono">
              {gameId.slice(0, 8)}...{gameId.slice(-8)}
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <WalletButton />
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-black">
          <span>{t("builtOnSui")}</span>
          <span>•</span>
          <span>{t("winNftTrophies")}</span>
          <span>•</span>
          <span>{t("stakeAndEarn")}</span>
        </div>
      </div>
    );
  }

  if (showJoinGame && gameState) {
    return (
      <>
        <JoinGame
          gameId={gameState.id}
          stakeAmount={gameState.stakeAmount}
          creator={gameState.creator}
          mode={gameState.mode}
          onJoin={
            gameState.mode === GAME_MODE.COMPETITIVE
              ? joinCompetitiveGame
              : joinFriendlyGame
          }
          onCancel={resetGame}
          onCancelGame={cancelGame}
          isLoading={isLoading}
          currentPlayer={account.address}
        />
        {showShareGame && (
          <ShareGame
            gameLink={shareLinks.gameLink}
            viewerLink={shareLinks.viewerLink}
            onClose={() => setShowShareGame(false)}
            stakeAmount={gameState.stakeAmount}
            mode={gameState.mode}
          />
        )}
      </>
    );
  }

  if (!gameState) {
    if (showMyGames) {
      return (
        <MyGames
          currentPlayer={account.address}
          onSelectGame={selectGame}
          onBack={() => setShowMyGames(false)}
        />
      );
    }

    if (showGameList) {
      return (
        <div className="space-y-4">
          <GameList onSelectGame={selectGame} currentPlayer={account.address} />
          <button
            onClick={() => setShowGameList(false)}
            className="w-full max-w-md mx-auto block text-center py-2 text-black hover:text-white hover:bg-black transition-colors"
          >
            ← {t("backToCreateGame")}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <GameModeSelection
          onSelectMode={createGame}
          isLoading={isLoading}
          currentPlayer={account.address}
        />
        <div className="max-w-md mx-auto space-y-2">
          <button
            onClick={() => setShowMyGames(true)}
            className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
          >
            📋 {t("myGames")}
          </button>
          <button
            onClick={() => setShowGameList(true)}
            className="w-full py-2 text-black hover:text-white hover:bg-black transition-colors"
          >
            {t("orBrowseGames")} →
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <GameBoard
        gameState={gameState}
        onMakeMove={makeMove}
        onResetGame={resetGame}
        onHome={resetGame}
        onCancelGame={cancelGame}
        onClaimTimeoutVictory={claimTimeoutVictory}
        isLoading={isLoading}
        currentPlayer={account.address}
      />

      {showShareGame && (
        <ShareGame
          gameLink={shareLinks.gameLink}
          viewerLink={shareLinks.viewerLink}
          onClose={() => setShowShareGame(false)}
          stakeAmount={gameState.stakeAmount}
          mode={gameState.mode}
        />
      )}
    </>
  );
}
