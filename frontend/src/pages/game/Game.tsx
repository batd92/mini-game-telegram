import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Balls } from '../../game/Balls';
import { Plank } from '../../game/Plank';
import { COLORS } from '../../game/Constants';

import ControlPanel from './ControlPanel';
import ModalEnd from './ModalEnd';
import './Game.css';

const GAME_DURATION = 1000;
const INITIAL_ATTEMPTS = 3;

interface GameState {
    isSoundOn: boolean;
    timeLeft: number;
    score: number;
    attempts: number;
    isGameRunning: boolean;
    isModalOpen: boolean;
}

const Game: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [backgroundImage] = useState(new Image());
    const navigate = useNavigate();

    // Game state
    const [gameState, setGameState] = useState({
        isSoundOn: true,
        timeLeft: GAME_DURATION,
        score: 0,
        attempts: INITIAL_ATTEMPTS,
        isGameRunning: true,
        isModalOpen: false,
    });

    const updateGameState = (newState: Partial<typeof gameState>) => {
        setGameState((prev: any) => ({ ...prev, ...newState }));
    };

    // References to game objects
    const ballsRef = useRef<Balls | null>(null);
    const planksRef = useRef<Plank | null>(null);

    const getClientCoordinates = (e: MouseEvent | TouchEvent) => {
        let clientX = 0;
        let clientY = 0;

        if ('changedTouches' in e && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('clientX' in e && 'clientY' in e) {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            clientX -= rect.left;
            clientY -= rect.top;
        }

        return { clientX, clientY };
    };

    /**
     * Initializes the canvas size based on the window dimensions
     */
    const setCanvasSize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Update canvas dimensions for game objects
        if (ballsRef.current) {
            ballsRef.current.canvasWidth = canvas.width;
            ballsRef.current.canvasHeight = canvas.height;
        }

        console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
    }, []);

    /**
     * Resets the game to its initial state
     */
    const resetGame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        context?.clearRect(0, 0, canvas.width, canvas.height);

        // Reset game objects
        if (ballsRef.current) {
            ballsRef.current.reset(canvas);
        }

    }, []);

    /**
     * Handles the "Play Again" action
     */
    const handlePlayAgain = useCallback(() => {
        if (gameState.attempts > 1) {
            updateGameState({ attempts: gameState.attempts - 1 });
            resetGame();
            updateGameState({
                timeLeft: GAME_DURATION,
                isGameRunning: true,
                isModalOpen: false,
            });
        } else {
            navigate('/');
        }
    }, [gameState.attempts, resetGame, navigate]);

    /**
     * Handles navigation back to the home screen
     */
    const handleBackToHome = useCallback(() => {
        if (!gameState.isGameRunning) {
            navigate('/');
        }
    }, [gameState.isGameRunning, navigate]);

    /**
     * Updates the remaining time every second
     */
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (gameState.isGameRunning) {
            timer = setInterval(() => {
                setGameState((prev: GameState) => ({
                    ...prev,
                    timeLeft: prev.timeLeft - 1,
                }));

                if (gameState.timeLeft <= 1) {
                    setGameState({
                        ...gameState,
                        isGameRunning: false,
                        isModalOpen: true,
                        isSoundOn: false,
                    });
                    clearInterval(timer);
                }
            }, 1000);
        }

        return () => {
            clearInterval(timer);
        };
    }, [gameState.isGameRunning]);

    /**
     * Opens the end game modal when time runs out
     */
    useEffect(() => {
        if (gameState.timeLeft <= 0) {
            updateGameState({
                isGameRunning: false,
                isModalOpen: true,
                isSoundOn: false,
            });
        }
    }, [gameState.timeLeft]);

    /**
     * Initializes the game objects and starts the game loop
     */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        setCanvasSize();

        // Initialize game objects
        ballsRef.current = new Balls(canvas);
        planksRef.current = new Plank();

        /**
         * The main game loop responsible for rendering and updating game objects
         */
        const gameLoop = () => {
            if (!gameState.isGameRunning) {
                if (ballsRef.current) {
                    resetGame();
                }
                return;
            }

            // Clear the canvas
            context.fillStyle = COLORS.BACKGROUND_COLOR;
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.drawImage(
                backgroundImage,
                0,
                0,
                canvas.width,
                canvas.height,
            );

            // Update and render game objects
            if (ballsRef.current && planksRef.current) {
                ballsRef.current.fr(context, planksRef.current);
                planksRef.current.draw(context);
            }

            catchGold();
            // Request the next animation frame
            window.requestAnimationFrame(gameLoop);
        };

        gameLoop();

        /**
         * Handles window resizing
         */
        const handleResize = () => setCanvasSize();
        window.addEventListener('resize', handleResize);

        /**
         * Handles user input (mouse and touch events)
         */
        const onActionUser = (e: MouseEvent | TouchEvent) => {
            const { clientX, clientY } = getClientCoordinates(e);
            const action = e.type;

            if (['touchstart', 'mousedown'].includes(action)) {
                planksRef.current?.start(clientX, clientY);
                return;
            }
            if (['mousemove', 'touchmove'].includes(action)) {
                planksRef.current?.roll(clientX, clientY);
                return;
            }

            if (['mouseup', 'touchend'].includes(action)) {
                planksRef.current?.fin(clientX, clientY);
                return;
            }
        };

        window.addEventListener('mousedown', onActionUser);
        window.addEventListener('mousemove', onActionUser);
        window.addEventListener('mouseup', onActionUser);
        window.addEventListener('touchstart', onActionUser);
        window.addEventListener('touchmove', onActionUser);
        window.addEventListener('touchend', onActionUser);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousedown', onActionUser);
            window.removeEventListener('mousemove', onActionUser);
            window.removeEventListener('mouseup', onActionUser);
            window.removeEventListener('touchstart', onActionUser);
            window.removeEventListener('touchmove', onActionUser);
            window.removeEventListener('touchend', onActionUser);
        };
    }, [gameState.isGameRunning, setCanvasSize, navigate]);

    /**
     * Renders text on the canvas with specified styling
     */
    const renderText = (
        context: CanvasRenderingContext2D,
        text: string,
        fontSize: string,
        color: string,
        x: number,
        y: number,
    ) => {
        const spacedText = text.split('').join(String.fromCharCode(0x2004));
        context.font = fontSize;
        context.fillStyle = color;
        context.fillText(spacedText, x, y);
    };

    /**
     * Handles collision detection between balls and the basket
     */
    const catchGold = () => {
        if (!ballsRef.current || !gameState.isGameRunning)
            return;
    };

    return (
        <div className="game-container">
            <canvas ref={canvasRef} />
            <ControlPanel
                handleBackToHome={handleBackToHome}
                isSoundOn={gameState.isSoundOn}
                score={gameState.score}
                timeLeft={gameState.timeLeft}
            />
            <ModalEnd
                isOpen={gameState.isModalOpen}
                onPlayAgain={handlePlayAgain}
                onBackToHome={handleBackToHome}
                attempts={gameState.attempts}
            />
        </div>
    );
};

export default Game;
