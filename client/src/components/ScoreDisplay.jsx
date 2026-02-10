import React, { useState, useEffect, useRef } from 'react';
import { updateGameState, saveMatchResult, resetScores } from '../services/apiService';

const ScoreDisplay = ({ scores, player1Name = 'MESSI', player2Name = 'RONALDO', autoStart = false, teamSelection = 'messi' }) => {
    const [timeRemaining, setTimeRemaining] = useState(60); // 🔥 1 minute = 60 seconds
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [matchSaved, setMatchSaved] = useState(false); // Track if match result is saved
    const previousScoresRef = useRef([]);
    const autoStartTriggeredRef = useRef(false);

    // Auto-start the game when autoStart prop is true
    useEffect(() => {
        if (autoStart && !autoStartTriggeredRef.current && !gameStarted) {
            autoStartTriggeredRef.current = true;
            // 🔄 Reset scores to 0 when starting new game
            resetScores().then(() => {
                console.log('✅ Scores reset to 0 for new game');
            });
            // Start game automatically after a short delay
            setTimeout(() => {
                setGameStarted(true);
                setIsTimerRunning(true);
                previousScoresRef.current = scores;
            }, 500); // Small delay to ensure component is mounted
        }
    }, [autoStart, gameStarted, scores]);

    // Sync timer state with backend
    useEffect(() => {
        updateGameState(isTimerRunning);
    }, [isTimerRunning]);

    // Timer countdown logic
    useEffect(() => {
        if (isTimerRunning && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        setIsTimerRunning(false);
                        setGameEnded(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isTimerRunning, timeRemaining]);

    // Detect goal scored and pause timer
    useEffect(() => {
        if (gameStarted && !gameEnded) {
            const currentTotal = scores.reduce((sum, team) => sum + team.score, 0);
            const previousTotal = previousScoresRef.current.reduce((sum, team) => sum + team.score, 0);

            if (currentTotal > previousTotal) {
                // Goal scored! Pause the timer
                setIsTimerRunning(false);
            }

            previousScoresRef.current = scores;
        }
    }, [scores, gameStarted, gameEnded]);

    // 🏆 Save match result when game ends
    useEffect(() => {
        if (gameEnded && !matchSaved && scores.length === 2) {
            const team1Score = scores[0].score;
            const team2Score = scores[1].score;
            const totalGoals = team1Score + team2Score; // Total goals scored in match

            const matchData = {
                teamSelection,
                playerName: player1Name, // Single player's name
                totalGoals,
                duration: 60, // 1 minute
            };

            saveMatchResult(matchData)
                .then((result) => {
                    if (result) {
                        console.log('🏆 Match result saved:', result);
                        setMatchSaved(true);
                    }
                })
                .catch((error) => {
                    console.error('Error saving match:', error);
                });
        }
    }, [gameEnded, matchSaved, scores, player1Name, teamSelection]);

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Start game
    const handleStartGame = () => {
        // 🔄 Reset scores to 0 when starting new game
        resetScores().then(() => {
            console.log('✅ Scores reset to 0 for new game');
        });
        setGameStarted(true);
        setIsTimerRunning(true);
        previousScoresRef.current = scores;
    };

    // Resume game
    const handleResumeGame = () => {
        setIsTimerRunning(true);
    };

    // Reset game
    const handleResetGame = () => {
        setTimeRemaining(60); // 🔥 1 minute
        setIsTimerRunning(false);
        setGameStarted(false);
        setGameEnded(false);
        setMatchSaved(false); // Reset match saved flag
        previousScoresRef.current = [];
        autoStartTriggeredRef.current = false; // Reset auto-start flag
    };

    return (
        <>
            <style>
                {`
                    @keyframes neonPulse {
                        0%, 100% {
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3);
                        }
                        50% {
                            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.5);
                        }
                    }
                    
                    @keyframes slideInUp {
                        from {
                            transform: translateY(50px);
                            opacity: 0;
                        }
                        to {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }
                    
                    @keyframes glowText {
                        0%, 100% {
                            text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
                        }
                        50% {
                            text-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 215, 0, 0.6);
                        }
                    }
                    
                    @keyframes gridMove {
                        0% {
                            background-position: 0 0;
                        }
                        100% {
                            background-position: 40px 40px;
                        }
                    }
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .liquid-background::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: 
                            radial-gradient(circle at 20% 50%, rgba(65, 105, 225, 0.08) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(220, 20, 60, 0.08) 0%, transparent 50%),
                            radial-gradient(circle at 40% 20%, rgba(255, 215, 0, 0.04) 0%, transparent 50%);
                        animation: float 8s ease-in-out infinite;
                    }
                    
                    .liquid-background::after {
                        content: '';
                        position: 'absolute';
                        top: -50%;
                        left: -50%;
                        right: -50%;
                        bottom: -50%;
                        background: linear-gradient(
                            45deg,
                            transparent,
                            rgba(255, 215, 0, 0.02),
                            transparent
                        );
                        animation: shimmer 3s infinite;
                    }
                `}
            </style>
            <div style={{ 
                height: '100vh',
                background: '#000000',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                paddingTop: '75px',
                overflow: 'auto',
            }}>
                {/* Animated Grid Background */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                        repeating-linear-gradient(0deg, rgba(255, 215, 0, 0.03) 0px, transparent 1px, transparent 40px, rgba(255, 215, 0, 0.03) 41px),
                        repeating-linear-gradient(90deg, rgba(255, 215, 0, 0.03) 0px, transparent 1px, transparent 40px, rgba(255, 215, 0, 0.03) 41px)
                    `,
                    animation: 'gridMove 20s linear infinite',
                    zIndex: 0,
                }}></div>

                <div style={{
                    textAlign: 'center', 
                    fontFamily: '"Orbitron", "Rajdhani", sans-serif', 
                    padding: '40px 20px',
                    position: 'relative',
                    zIndex: 1,
                }}>
                {/* Timer Display */}
                <div style={{
                    fontSize: '5rem',
                    fontWeight: 'bold',
                    color: timeRemaining <= 60 ? '#FF0000' : '#FFD700',
                    fontFamily: '"Orbitron", sans-serif',
                    textShadow: `0 0 40px ${timeRemaining <= 60 ? 'rgba(255, 0, 0, 1)' : 'rgba(255, 215, 0, 1)'}`,
                    marginBottom: '30px',
                    animation: timeRemaining <= 60 ? 'glowText 0.5s infinite' : 'glowText 2s infinite',
                }}>
                    ⏱️ {formatTime(timeRemaining)} ⏱️
                </div>

                {/* Game Control Buttons */}
                <div style={{
                    marginBottom: '40px',
                    display: 'flex',
                    gap: '20px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}>
                    {!gameStarted && (
                        <button
                            onClick={handleStartGame}
                            style={{
                                padding: '20px 60px',
                                fontSize: '2rem',
                                fontFamily: '"Orbitron", sans-serif',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #00ff00, #00cc00)',
                                color: '#000',
                                border: '3px solid #00ff00',
                                borderRadius: '0',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '3px',
                                boxShadow: '0 0 40px rgba(0, 255, 0, 0.6)',
                                transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.boxShadow = '0 0 60px rgba(0, 255, 0, 1)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 0 40px rgba(0, 255, 0, 0.6)';
                            }}
                        >
                            ▶️ START BATTLE
                        </button>
                    )}

                    {gameStarted && !isTimerRunning && !gameEnded && (
                        <button
                            onClick={handleResumeGame}
                            style={{
                                padding: '20px 60px',
                                fontSize: '2rem',
                                fontFamily: '"Orbitron", sans-serif',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                color: '#000',
                                border: '3px solid #FFD700',
                                borderRadius: '0',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '3px',
                                boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)',
                                transition: 'all 0.3s ease',
                                animation: 'neonPulse 1s infinite',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.boxShadow = '0 0 60px rgba(255, 215, 0, 1)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.6)';
                            }}
                        >
                            ⏯️ RESUME GAME
                        </button>
                    )}

                    {gameEnded && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            alignItems: 'center',
                        }}>
                            <h2 style={{
                                fontSize: '3rem',
                                color: '#FF0000',
                                fontFamily: '"Orbitron", sans-serif',
                                textShadow: '0 0 40px rgba(255, 0, 0, 1)',
                                animation: 'glowText 0.5s infinite',
                                letterSpacing: '5px',
                            }}>
                                🏁 TIME UP! GAME OVER! 🏁
                            </h2>
                            <button
                                onClick={handleResetGame}
                                style={{
                                    padding: '20px 60px',
                                    fontSize: '2rem',
                                    fontFamily: '"Orbitron", sans-serif',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #4169E1, #DC143C)',
                                    color: '#fff',
                                    border: '3px solid #FFD700',
                                    borderRadius: '0',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '3px',
                                    boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.1)';
                                    e.target.style.boxShadow = '0 0 60px rgba(255, 215, 0, 1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.6)';
                                }}
                            >
                                🔄 NEW GAME
                            </button>
                        </div>
                    )}
                </div>

                {/* Game Status Indicator */}
                {gameStarted && !gameEnded && (
                    <div style={{
                        fontSize: '1.8rem',
                        fontFamily: '"Rajdhani", sans-serif',
                        color: isTimerRunning ? '#00ff00' : '#ff0000',
                        textShadow: `0 0 20px ${isTimerRunning ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)'}`,
                        marginBottom: '30px',
                        letterSpacing: '3px',
                        fontWeight: 'bold',
                        animation: isTimerRunning ? 'none' : 'glowText 0.5s infinite',
                    }}>
                        {isTimerRunning ? '🟢 GAME IN PROGRESS' : '⏸️ PAUSED - GOAL SCORED!'}
                    </div>
                )}

                <h1 style={{
                    fontSize: '4rem',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 40px rgba(255, 215, 0, 0.5)',
                    marginBottom: '60px',
                    fontWeight: 'bold',
                    position: 'relative',
                    zIndex: 1,
                    letterSpacing: '6px',
                    textTransform: 'uppercase',
                    fontFamily: '"Orbitron", sans-serif',
                    animation: 'glowText 2s infinite',
                }}>
                    ⚽ {teamSelection === 'messi' ? 'MESSI' : 'RONALDO'} ARENA 🥅
                </h1>
            
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '80px', 
                marginTop: '50px',
                flexWrap: 'wrap',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* 🎯 TOTAL GOALS ONLY - No Team A/B separation */}
                {(() => {
                    // Calculate total goals from all teams
                    const totalGoals = scores.reduce((sum, goal) => sum + goal.score, 0);
                    
                    return (
                        <div 
                            style={{ 
                                border: '4px solid #FFD700',
                                padding: '50px 70px', 
                                borderRadius: '0', 
                                minWidth: '400px',
                                boxShadow: '0 0 60px rgba(255, 215, 0, 0.8)',
                                background: 'rgba(0, 0, 0, 0.9)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                position: 'relative',
                                zIndex: 1,
                                overflow: 'hidden',
                                animation: 'slideInUp 0.6s ease-out',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 0 80px rgba(255, 215, 0, 1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 0 60px rgba(255, 215, 0, 0.8)';
                            }}
                        >
                            <h2 style={{ 
                                color: '#FFD700',
                                fontWeight: 'bold',
                                fontSize: '3rem',
                                margin: '0 0 30px 0',
                                textTransform: 'uppercase',
                                letterSpacing: '5px',
                                textShadow: '0 0 30px rgba(255, 215, 0, 1)',
                                fontFamily: '"Orbitron", sans-serif',
                            }}>
                                ⭐ TOTAL GOALS ⭐
                            </h2>
                            <p style={{ 
                                fontSize: '12rem', 
                                margin: '20px 0', 
                                fontWeight: 'bold',
                                color: '#FFD700',
                                textShadow: '0 0 60px rgba(255, 215, 0, 1), 0 0 80px rgba(255, 215, 0, 0.8)',
                                lineHeight: '1',
                                fontFamily: '"Orbitron", sans-serif',
                                animation: 'neonPulse 2s infinite',
                            }}>
                                {totalGoals}
                            </p>
                            <p style={{
                                fontSize: '1.5rem',
                                color: '#FFD700',
                                marginTop: '20px',
                                letterSpacing: '3px',
                                textTransform: 'uppercase',
                                fontFamily: '"Rajdhani", sans-serif',
                                textShadow: '0 0 15px rgba(255, 215, 0, 0.6)',
                            }}>
                                ⚽ {teamSelection === 'messi' ? 'MESSI' : 'RONALDO'} SCORES ⚽
                            </p>
                        </div>
                    );
                })()}
            </div>
            
            <p style={{ 
                marginTop: '60px', 
                fontSize: '1.3rem', 
                color: '#FFD700',
                fontWeight: 'bold',
                position: 'relative',
                zIndex: 1,
                fontFamily: '"Rajdhani", sans-serif',
                letterSpacing: '2px',
                textShadow: '0 0 20px rgba(255, 215, 0, 0.6)',
            }}>
                🔄 LIVE UPDATE EVERY GOAL 🔄
            </p>
        </div>
            </div>
        </>
    );
};

export default ScoreDisplay;
