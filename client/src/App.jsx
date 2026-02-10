import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar.jsx';
import ScoreDisplay from './components/ScoreDisplay.jsx';
import { getScores, getLeaderboard, getMatchCount } from './services/apiService.js';
import './App.css';
import messiImage from './assets/messi.png';
import ronaldoImage from './assets/ronaldo.png';

// Initialize socket connection with auto-reconnection
const socket = io('http://localhost:5001', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    timeout: 10000
});

function App() {
    // State to hold the array of goal objects
    const [scores, setScores] = useState([]);
    const [currentPage, setCurrentPage] = useState('preview'); // 'preview', 'teamSelection', 'memberInput', 'assignment', 'register', 'home', or 'scoreboard'
    const [gameStarted, setGameStarted] = useState(false);
    const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
    const videoRef = React.useRef(null);
    const [player1Name, setPlayer1Name] = useState('MESSI');
    const [player2Name, setPlayer2Name] = useState('RONALDO');
    const [member1Name, setMember1Name] = useState('');
    const [member2Name, setMember2Name] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [assignedToMessi, setAssignedToMessi] = useState('');
    const [assignedToRonaldo, setAssignedToRonaldo] = useState('');
    const [showCountdown, setShowCountdown] = useState(false);
    const [countdownNumber, setCountdownNumber] = useState(3);
    const [isConnected, setIsConnected] = useState(false); // WebSocket connection status
    const [notification, setNotification] = useState(null); // Goal notifications
    
    // 🏆 Tournament states
    const [teamSelection, setTeamSelection] = useState(''); // 'messi' or 'ronaldo'
    const [leaderboard, setLeaderboard] = useState([]); // Top 5 players
    const [matchCount, setMatchCount] = useState(0); // Total matches played
    const [showLeaderboard, setShowLeaderboard] = useState(false); // Show after 5 matches

    const fetchScores = async () => {
        const data = await getScores();
        setScores(data);
    };

    // 🏆 Fetch leaderboard data
    const fetchLeaderboard = async () => {
        const data = await getLeaderboard();
        setLeaderboard(data);
    };

    // 🏆 Fetch match count
    const fetchMatchCount = async () => {
        const count = await getMatchCount();
        setMatchCount(count);
        // Show leaderboard after every 5 matches
        if (count > 0 && count % 5 === 0) {
            setShowLeaderboard(true);
        }
    };

    const handleStartGame = async () => {
        // Show countdown animation
        setShowCountdown(true);
        setCountdownNumber(3);

        // Countdown sequence: 3, 2, 1, START BATTLE
        const countdownInterval = setInterval(() => {
            setCountdownNumber(prev => {
                if (prev === 1) {
                    clearInterval(countdownInterval);
                    // After "START BATTLE" text, reset and navigate
                    setTimeout(async () => {
                        setShowCountdown(false);
                        // Reset scores to 0-0 and navigate to scoreboard
                        try {
                            const response = await fetch('http://localhost:5001/api/goals/reset', {
                                method: 'POST',
                            });
                            const data = await response.json();
                            console.log(data.message);
                            setGameStarted(true);
                            setCurrentPage('scoreboard'); // Navigate to scoreboard page
                            fetchScores();
                        } catch (error) {
                            console.error('Error resetting game:', error);
                        }
                    }, 1000); // Wait 1 second after "START BATTLE"
                    return 0; // 0 will show "START BATTLE"
                }
                return prev - 1;
            });
        }, 1000); // Change every 1 second
    };

    const handleNavigation = (page) => {
        setCurrentPage(page);
    };

    useEffect(() => {
        if (currentPage === 'scoreboard') {
            // Initial fetch of scores
            fetchScores();
            // 🏆 Fetch leaderboard and match count
            fetchLeaderboard();
            fetchMatchCount();

            // 🔌 WebSocket: Listen for real-time score updates
            socket.on('scoreUpdate', (updatedScores) => {
                console.log('📡 Real-time score update received:', updatedScores);
                setScores(updatedScores);
            });

            // 🔌 WebSocket: Listen for goal scored notifications (DISABLED - Auto update only)
            // socket.on('goalScored', (data) => {
            //     console.log('⚽ GOAL SCORED:', data);
            //     setNotification({
            //         type: 'success',
            //         message: data.message,
            //         team: data.team
            //     });
            //     // Auto-hide notification after 3 seconds
            //     setTimeout(() => setNotification(null), 3000);
            // });

            // 🔌 WebSocket: Listen for blocked goal attempts (DISABLED - Auto update only)
            // socket.on('goalBlocked', (data) => {
            //     console.log('⏸️ GOAL BLOCKED:', data);
            //     setNotification({
            //         type: 'blocked',
            //         message: data.message,
            //         team: data.team
            //     });
            //     // Auto-hide notification after 3 seconds
            //     setTimeout(() => setNotification(null), 3000);
            // });

            // 🔌 WebSocket: Listen for game state updates (optional)
            socket.on('gameStateUpdate', (gameState) => {
                console.log('📡 Game state update received:', gameState);
                // You can handle game state changes here if needed
            });

            // Cleanup on unmount
            return () => {
                socket.off('scoreUpdate');
                // socket.off('goalScored');
                // socket.off('goalBlocked');
                socket.off('gameStateUpdate');
            };
        }
    }, [currentPage]);

    // 🔌 WebSocket connection status monitoring
    useEffect(() => {
        socket.on('connect', () => {
            console.log('✅ Connected to WebSocket server');
            setIsConnected(true);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from WebSocket server. Reason:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('🔴 WebSocket connection error:', error.message);
            setIsConnected(false);
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Reconnected to WebSocket server after', attemptNumber, 'attempts');
            setIsConnected(true);
            // Refresh scores after reconnection
            if (currentPage === 'scoreboard') {
                fetchScores();
            }
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('🔄 Attempting to reconnect... Attempt #', attemptNumber);
        });

        socket.on('reconnect_failed', () => {
            console.error('❌ Failed to reconnect to WebSocket server');
            setIsConnected(false);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('reconnect');
            socket.off('reconnect_attempt');
            socket.off('reconnect_failed');
        };
    }, [currentPage]);

    // Show welcome animation after 10 seconds on preview page
    useEffect(() => {
        if (currentPage === 'preview') {
            // Stop video at 10 seconds and show welcome animation
            const timer = setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.pause();
                }
                setShowWelcomeAnimation(true);
            }, 10000); // 10 seconds

            // Auto navigate to member input page after 8 seconds of welcome screen (total 18s)
            const autoNavigateTimer = setTimeout(() => {
                setCurrentPage('memberInput');
            }, 18000); // 18 seconds (10s video + 8s welcome)

            return () => {
                clearTimeout(timer);
                clearTimeout(autoNavigateTimer);
            };
        } else {
            setShowWelcomeAnimation(false);
        }
    }, [currentPage]);

    // Random assignment function with spinning animation
    const handleRandomAssignment = () => {
        if (!member1Name.trim() || !member2Name.trim()) {
            alert('Please enter both member names!');
            return;
        }

        setCurrentPage('assignment');
        setIsSpinning(true);

        // Simulate spinning for 3 seconds
        setTimeout(() => {
            // Random assignment
            const random = Math.random() < 0.5;
            const messiName = random ? member1Name.toUpperCase() : member2Name.toUpperCase();
            const ronaldoName = random ? member2Name.toUpperCase() : member1Name.toUpperCase();

            setAssignedToMessi(messiName);
            setAssignedToRonaldo(ronaldoName);
            setPlayer1Name(messiName);
            setPlayer2Name(ronaldoName);
            setIsSpinning(false);

            // Navigate to assignmentResult page after spinning
            setTimeout(() => {
                setCurrentPage('assignmentResult');
            }, 1000);

            // Auto navigate to register after 10 seconds from assignmentResult
            setTimeout(() => {
                setCurrentPage('register');
            }, 11000);
        }, 3000);
    };

    return (
        <div className="App" style={{ margin: 0, padding: 0, background: '#000000' }}>
            <Navbar onNavigate={handleNavigation} currentPage={currentPage} />
            
            {/* Main content - No extra padding needed as pages handle their own positioning */}
            {currentPage === 'preview' ? (
                    // PREVIEW/WELCOME PAGE
                    <div style={{
                        height: '100vh',
                        background: '#000000',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden',
                        paddingTop: '75px',
                    }}>
                        {/* Video Background - High Visibility */}
                        <video
                            ref={videoRef}
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                minWidth: '100%',
                                minHeight: '100%',
                                width: 'auto',
                                height: 'auto',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 0,
                                objectFit: 'cover',
                                opacity: 0.7,
                                filter: 'brightness(1.2) contrast(1.3) saturate(1.2)',
                            }}
                        >
                            <source src="/src/assets/225826_large.mp4" type="video/mp4" />
                        </video>

                        {/* Background Techno Music */}
                        <audio
                            autoPlay
                            loop
                            volume={0.3}
                            style={{ display: 'none' }}
                        >
                            <source src="/src/assets/techno-bg.mp3" type="audio/mpeg" />
                            {/* Fallback for different formats */}
                            <source src="/src/assets/techno-bg.ogg" type="audio/ogg" />
                        </audio>

                        {/* Subtle overlay - preserves stadium details */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.6) 100%)',
                            zIndex: 1,
                        }}></div>

                        {/* Stadium Lights - Top Left */}
                        <div style={{
                            position: 'absolute',
                            top: '-50px',
                            left: '10%',
                            width: '150px',
                            height: '300px',
                            background: 'linear-gradient(180deg, rgba(255, 255, 200, 0.3) 0%, rgba(255, 255, 200, 0.1) 40%, transparent 100%)',
                            clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
                            animation: 'stadiumLight 3s ease-in-out infinite',
                            filter: 'blur(20px)',
                            zIndex: 1,
                        }}></div>

                        {/* Stadium Lights - Top Right */}
                        <div style={{
                            position: 'absolute',
                            top: '-50px',
                            right: '10%',
                            width: '150px',
                            height: '300px',
                            background: 'linear-gradient(180deg, rgba(255, 255, 200, 0.3) 0%, rgba(255, 255, 200, 0.1) 40%, transparent 100%)',
                            clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
                            animation: 'stadiumLight 3s ease-in-out infinite 0.5s',
                            filter: 'blur(20px)',
                            zIndex: 1,
                        }}></div>

                        {/* Animated particles */}
                        <div style={{
                            position: 'absolute',
                            top: '10%',
                            left: '20%',
                            width: '30px',
                            height: '30px',
                            background: 'radial-gradient(circle, #FFD700, transparent)',
                            borderRadius: '50%',
                            animation: 'float 6s ease-in-out infinite',
                            filter: 'blur(5px)',
                            zIndex: 2,
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            top: '20%',
                            right: '15%',
                            width: '25px',
                            height: '25px',
                            background: 'radial-gradient(circle, #4169E1, transparent)',
                            borderRadius: '50%',
                            animation: 'float 7s ease-in-out infinite 1s',
                            filter: 'blur(4px)',
                            zIndex: 2,
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            bottom: '25%',
                            left: '15%',
                            width: '28px',
                            height: '28px',
                            background: 'radial-gradient(circle, #DC143C, transparent)',
                            borderRadius: '50%',
                            animation: 'float 8s ease-in-out infinite 2s',
                            filter: 'blur(5px)',
                            zIndex: 2,
                        }}></div>

                        {/* Command Prompt Terminal - Shows during video (0-20s) from right side */}
                        {!showWelcomeAnimation && (
                            <div style={{
                                position: 'absolute',
                                right: '50px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 3,
                                animation: 'slideInRight 1s ease-out',
                            }}>
                                <div style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                                    border: '3px solid #00FF00',
                                    borderRadius: '10px',
                                    padding: '30px 35px',
                                    fontFamily: '"Orbitron", "Rajdhani", "Electrolize", "Share Tech Mono", monospace',
                                    textAlign: 'left',
                                    minWidth: '500px',
                                    boxShadow: '0 0 40px rgba(0, 255, 0, 0.6), inset 0 0 20px rgba(0, 255, 0, 0.1)',
                                }}>
                                    {/* Command prompt header */}
                                    <div style={{
                                        color: '#00FF00',
                                        fontSize: '1.1rem',
                                        marginBottom: '12px',
                                        fontWeight: '700',
                                        borderBottom: '2px solid #00FF00',
                                        paddingBottom: '8px',
                                        textShadow: '0 0 10px rgba(0, 255, 0, 0.8)',
                                        letterSpacing: '1px',
                                    }}>
                                        C:\BATTLE_ARENA&gt; system_info.exe
                                    </div>

                                    {/* Typing animation lines */}
                                    <div style={{
                                        color: '#00FF00',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.6',
                                        fontWeight: '500',
                                    }}>
                                        <div style={{
                                            animation: 'typing 1s steps(40) 0.2s forwards',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            borderRight: '2px solid #00FF00',
                                            width: '0',
                                            textShadow: '0 0 8px rgba(0, 255, 0, 0.6)',
                                        }}>
                                            &gt; Loading BATTLE FOR THE GOAL...
                                        </div>
                                        <div style={{
                                            animation: 'typing 0.9s steps(35) 1.2s forwards',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            width: '0',
                                            color: '#00FF00',
                                            marginTop: '6px',
                                            textShadow: '0 0 8px rgba(0, 255, 0, 0.6)',
                                        }}>
                                            &gt; Initializing Arena Systems...
                                        </div>
                                        <div style={{
                                            animation: 'typing 0.8s steps(35) 2.1s forwards',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            width: '0',
                                            color: '#4169E1',
                                            marginTop: '6px',
                                            textShadow: '0 0 10px rgba(65, 105, 225, 0.8)',
                                        }}>
                                            [INFO] Robot Football Arena v2.0
                                        </div>
                                        <div style={{
                                            animation: 'typing 0.8s steps(35) 2.9s forwards',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            width: '0',
                                            color: '#FFD700',
                                            marginTop: '6px',
                                            textShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
                                        }}>
                                            [HARDWARE] ESP32 Microcontroller
                                        </div>
                                        <div style={{
                                            animation: 'typing 0.8s steps(38) 3.7s forwards',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            width: '0',
                                            color: '#00FFFF',
                                            marginTop: '6px',
                                            textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
                                        }}>
                                            [SENSORS] IR Goal Detection Active
                                        </div>
                                        <div style={{
                                            animation: 'typing 0.8s steps(35) 4.5s forwards',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            width: '0',
                                            color: '#4169E1',
                                            marginTop: '6px',
                                            textShadow: '0 0 10px rgba(65, 105, 225, 0.8)',
                                        }}>
                                            [TEAM-A] MESSI - GPIO Pin 25
                                        </div>
                                        <div style={{
                                            animation: 'typing 0.8s steps(35) 5.3s forwards',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            width: '0',
                                            color: '#DC143C',
                                            marginTop: '6px',
                                            textShadow: '0 0 10px rgba(220, 20, 60, 0.8)',
                                        }}>
                                            [TEAM-B] RONALDO - GPIO Pin 26
                                        </div>
                                        <div style={{
                                            animation: 'typing 0.8s steps(38) 6.1s forwards',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            width: '0',
                                            color: '#00FF00',
                                            marginTop: '6px',
                                            textShadow: '0 0 8px rgba(0, 255, 0, 0.6)',
                                        }}>
                                            [DATABASE] MongoDB Atlas Online
                                        </div>
                                        <div style={{
                                            animation: 'typing 0.8s steps(35) 6.9s forwards',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            width: '0',
                                            color: '#FFD700',
                                            marginTop: '6px',
                                            textShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
                                        }}>
                                            [SERVER] Node.js Port 5001
                                        </div>
                                        <div style={{
                                            animation: 'typing 0.8s steps(35) 7.7s forwards',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            width: '0',
                                            color: '#00FFFF',
                                            marginTop: '6px',
                                            textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
                                        }}>
                                            [CLIENT] React Vite Port 5176
                                        </div>
                                        <div style={{
                                            animation: 'typing 0.8s steps(35) 8.5s forwards',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            width: '0',
                                            color: '#00FF00',
                                            marginTop: '6px',
                                            textShadow: '0 0 8px rgba(0, 255, 0, 0.6)',
                                        }}>
                                            [API] Real-time Sync Enabled
                                        </div>
                                        <div style={{
                                            animation: 'typing 1.5s steps(30) 18.7s forwards, blink 1s step-end infinite 20.2s',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            width: '0',
                                            color: '#FF00FF',
                                            marginTop: '10px',
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                        }}>
                                            &gt;&gt; ALL SYSTEMS READY!
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3D Welcome Text Animation - Shows after 20 seconds */}
                        {showWelcomeAnimation && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(0, 0, 0, 0.95)',
                                zIndex: 10,
                                animation: 'fadeIn 1.5s ease-in-out',
                            }}>
                                {/* 3D Animated Game Title with Split Text */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '20px',
                                    marginBottom: '40px',
                                }}>
                                    {/* BATTLE - Animated word */}
                                    <h1 style={{
                                        fontSize: '9rem',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '25px',
                                        background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                                        backgroundSize: '200% 100%',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        filter: 'drop-shadow(0 0 80px rgba(255, 215, 0, 0.9)) drop-shadow(5px 5px 0px rgba(255, 165, 0, 0.8)) drop-shadow(10px 10px 0px rgba(255, 140, 0, 0.6)) drop-shadow(15px 15px 0px rgba(255, 120, 0, 0.4))',
                                        transform: 'perspective(1000px) rotateY(-10deg) rotateX(10deg)',
                                        animation: 'slideInLeft 1.5s ease-out, text3DRotate 4s ease-in-out infinite 1.5s, shimmerGold 3s linear infinite',
                                        margin: 0,
                                        fontFamily: '"Orbitron", sans-serif',
                                    }}>
                                        BATTLE
                                    </h1>
                                    
                                    {/* FOR THE - Animated word */}
                                    <h1 style={{
                                        fontSize: '7rem',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '20px',
                                        background: 'linear-gradient(90deg, #FFA500 0%, #FFD700 50%, #FFA500 100%)',
                                        backgroundSize: '200% 100%',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        filter: 'drop-shadow(0 0 60px rgba(255, 165, 0, 0.9)) drop-shadow(4px 4px 0px rgba(255, 140, 0, 0.7)) drop-shadow(8px 8px 0px rgba(255, 120, 0, 0.5))',
                                        transform: 'perspective(1000px) rotateY(0deg) rotateX(8deg)',
                                        animation: 'scaleIn 1.5s ease-out 0.3s backwards, text3DFloat 3s ease-in-out infinite 1.8s, shimmerGold 3s linear infinite 0.5s',
                                        margin: 0,
                                        fontFamily: '"Orbitron", sans-serif',
                                    }}>
                                        FOR THE
                                    </h1>
                                    
                                    {/* GOAL - Animated word */}
                                    <h1 style={{
                                        fontSize: '10rem',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '30px',
                                        background: 'linear-gradient(90deg, #FFD700 0%, #FF8C00 50%, #FFD700 100%)',
                                        backgroundSize: '200% 100%',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        filter: 'drop-shadow(0 0 100px rgba(255, 215, 0, 1)) drop-shadow(6px 6px 0px rgba(255, 140, 0, 0.9)) drop-shadow(12px 12px 0px rgba(255, 100, 0, 0.7)) drop-shadow(18px 18px 0px rgba(255, 80, 0, 0.5))',
                                        transform: 'perspective(1000px) rotateY(10deg) rotateX(12deg)',
                                        animation: 'slideInRight 1.5s ease-out 0.6s backwards, text3DRotate 4s ease-in-out infinite 2.1s reverse, shimmerGold 3s linear infinite 1s, bounceText 2s ease-in-out infinite 2s',
                                        margin: 0,
                                        fontFamily: '"Orbitron", sans-serif',
                                    }}>
                                        GOAL
                                    </h1>
                                </div>

                                {/* Subtitle */}
                                <p style={{
                                    fontSize: '2.5rem',
                                    color: '#FFD700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '8px',
                                    fontWeight: '600',
                                    textShadow: '0 0 40px rgba(255, 215, 0, 0.8)',
                                    animation: 'fadeInUp 2s ease-in-out, floatUpDown 3s ease-in-out infinite 2s',
                                    marginBottom: '40px',
                                    fontFamily: '"Rajdhani", sans-serif',
                                }}>
                                    ⚡ Robot Football Arena ⚡
                                </p>

                                {/* Enter Button */}
                                <button
                                    onClick={() => setCurrentPage('teamSelection')}
                                    style={{
                                        padding: '35px 100px',
                                        fontSize: '3rem',
                                        fontWeight: 'bold',
                                        background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
                                        backgroundSize: '200% 100%',
                                        color: '#000',
                                        border: '5px solid #FFD700',
                                        borderRadius: '15px',
                                        cursor: 'pointer',
                                        fontFamily: '"Orbitron", sans-serif',
                                        boxShadow: `
                                            0 0 60px rgba(255, 215, 0, 0.8),
                                            0 0 120px rgba(255, 215, 0, 0.6),
                                            inset 0 5px 20px rgba(255, 255, 255, 0.5)
                                        `,
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '8px',
                                        animation: 'buttonGlow 2.5s ease-in-out infinite, fadeInUp 2.5s ease-in-out',
                                        transform: 'perspective(500px) rotateX(5deg)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'perspective(500px) rotateX(5deg) scale(1.15) translateY(-10px)';
                                        e.target.style.boxShadow = '0 0 100px rgba(255, 215, 0, 1), 0 0 180px rgba(255, 215, 0, 0.8)';
                                        e.target.style.backgroundPosition = '100% 0';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'perspective(500px) rotateX(5deg) scale(1) translateY(0)';
                                        e.target.style.boxShadow = '0 0 60px rgba(255, 215, 0, 0.8), 0 0 120px rgba(255, 215, 0, 0.6)';
                                        e.target.style.backgroundPosition = '0% 0';
                                    }}
                                >
                                    ⚔️ GO TO BATTLE ⚔️
                                </button>

                                {/* Auto-redirect message */}
                                <p style={{
                                    marginTop: '40px',
                                    fontSize: '1.2rem',
                                    color: '#FFD700',
                                    letterSpacing: '3px',
                                    textTransform: 'uppercase',
                                    opacity: 0.7,
                                    animation: 'fadeInUp 3s ease-in-out, pulse 2s ease-in-out infinite',
                                }}>
                                    Auto-starting in a few seconds...
                                </p>

                                <style>
                                    {`
                                        @keyframes fadeIn {
                                            from { opacity: 0; }
                                            to { opacity: 1; }
                                        }
                                        
                                        @keyframes slideInLeft {
                                            0% { 
                                                transform: perspective(1000px) rotateY(-90deg) rotateX(10deg) translateX(-200px);
                                                opacity: 0;
                                            }
                                            100% { 
                                                transform: perspective(1000px) rotateY(-10deg) rotateX(10deg) translateX(0);
                                                opacity: 1;
                                            }
                                        }
                                        
                                        @keyframes slideInRight {
                                            0% { 
                                                transform: perspective(1000px) rotateY(90deg) rotateX(12deg) translateX(200px);
                                                opacity: 0;
                                            }
                                            100% { 
                                                transform: perspective(1000px) rotateY(10deg) rotateX(12deg) translateX(0);
                                                opacity: 1;
                                            }
                                        }
                                        
                                        @keyframes scaleIn {
                                            0% { 
                                                transform: perspective(1000px) rotateY(0deg) rotateX(8deg) scale(0);
                                                opacity: 0;
                                            }
                                            100% { 
                                                transform: perspective(1000px) rotateY(0deg) rotateX(8deg) scale(1);
                                                opacity: 1;
                                            }
                                        }
                                        
                                        @keyframes text3DFloat {
                                            0%, 100% { 
                                                transform: perspective(1000px) rotateY(0deg) rotateX(8deg) translateY(0px);
                                            }
                                            50% { 
                                                transform: perspective(1000px) rotateY(0deg) rotateX(8deg) translateY(-15px);
                                            }
                                        }
                                        
                                        @keyframes text3DRotate {
                                            0%, 100% { 
                                                transform: perspective(1000px) rotateY(-10deg) rotateX(10deg);
                                            }
                                            50% { 
                                                transform: perspective(1000px) rotateY(10deg) rotateX(10deg);
                                            }
                                        }
                                        
                                        @keyframes shimmerGold {
                                            0% { background-position: 0% 50%; }
                                            50% { background-position: 100% 50%; }
                                            100% { background-position: 0% 50%; }
                                        }
                                        
                                        @keyframes bounceText {
                                            0%, 100% { 
                                                transform: perspective(1000px) rotateY(10deg) rotateX(12deg) translateY(0);
                                            }
                                            50% { 
                                                transform: perspective(1000px) rotateY(10deg) rotateX(12deg) translateY(-25px);
                                            }
                                        }
                                        
                                        @keyframes textPulse {
                                            0%, 100% { filter: brightness(1); }
                                            50% { filter: brightness(1.3); }
                                        }
                                        
                                        @keyframes buttonGlow {
                                            0%, 100% { 
                                                box-shadow: 0 0 60px rgba(255, 215, 0, 0.8), 0 0 120px rgba(255, 215, 0, 0.6);
                                            }
                                            50% { 
                                                box-shadow: 0 0 100px rgba(255, 215, 0, 1), 0 0 160px rgba(255, 215, 0, 0.8);
                                            }
                                        }
                                        
                                        @keyframes slideDownFade {
                                            0% { 
                                                transform: translateY(-30px);
                                                opacity: 0;
                                            }
                                            20% {
                                                transform: translateY(0);
                                                opacity: 1;
                                            }
                                            80% {
                                                transform: translateY(0);
                                                opacity: 1;
                                            }
                                            100% { 
                                                transform: translateY(30px);
                                                opacity: 0;
                                            }
                                        }
                                        
                                        @keyframes floatUpDown {
                                            0%, 100% { transform: translateY(0px); }
                                            50% { transform: translateY(-10px); }
                                        }
                                        
                                        @keyframes typing {
                                            from { width: 0; }
                                            to { width: 100%; }
                                        }
                                        
                                        @keyframes blink {
                                            50% { border-color: transparent; }
                                        }
                                    `}
                                </style>
                            </div>
                        )}
                    </div>
                ) : currentPage === 'teamSelection' ? (
                    // 🏆 TEAM SELECTION PAGE
                    <div style={{
                        height: '100vh',
                        background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '95px 40px 40px 40px',
                        overflow: 'hidden',
                    }}>
                        <h1 style={{
                            fontSize: '4rem',
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontFamily: '"Orbitron", sans-serif',
                            marginBottom: '20px',
                            letterSpacing: '5px',
                            textAlign: 'center',
                        }}>
                            SELECT YOUR TEAM
                        </h1>

                        <p style={{
                            fontSize: '1.3rem',
                            color: '#888',
                            marginBottom: '60px',
                            letterSpacing: '3px',
                            fontFamily: '"Rajdhani", sans-serif',
                            textAlign: 'center',
                        }}>
                            Choose Messi or Ronaldo
                        </p>

                        <div style={{
                            display: 'flex',
                            gap: '80px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '40px',
                        }}>
                            {/* Messi Team Button */}
                            <button
                                onClick={() => {
                                    setTeamSelection('messi');
                                    setCurrentPage('memberInput');
                                }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '20px',
                                    padding: '40px 60px',
                                    background: teamSelection === 'messi' 
                                        ? 'linear-gradient(135deg, #4169E1, #1E90FF)' 
                                        : 'rgba(65, 105, 225, 0.1)',
                                    border: '3px solid #4169E1',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: teamSelection === 'messi'
                                        ? '0 0 60px rgba(65, 105, 225, 0.8)'
                                        : '0 0 20px rgba(65, 105, 225, 0.3)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 0 60px rgba(65, 105, 225, 0.8)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = teamSelection === 'messi'
                                        ? '0 0 60px rgba(65, 105, 225, 0.8)'
                                        : '0 0 20px rgba(65, 105, 225, 0.3)';
                                }}
                            >
                                <img 
                                    src={messiImage} 
                                    alt="Messi"
                                    style={{
                                        width: '300px',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        mixBlendMode: 'lighten',
                                    }}
                                />
                                <h2 style={{
                                    fontSize: '2.5rem',
                                    color: '#4169E1',
                                    margin: 0,
                                    fontFamily: '"Orbitron", sans-serif',
                                    textShadow: '0 0 20px rgba(65, 105, 225, 0.8)',
                                }}>
                                    🔵 MESSI
                                </h2>
                            </button>

                            {/* VS Divider */}
                            <div style={{
                                fontSize: '5rem',
                                fontWeight: 'bold',
                                color: '#FFD700',
                                fontFamily: '"Orbitron", sans-serif',
                                textShadow: '0 0 40px rgba(255, 215, 0, 0.8)',
                            }}>
                                VS
                            </div>

                            {/* Ronaldo Team Button */}
                            <button
                                onClick={() => {
                                    setTeamSelection('ronaldo');
                                    setCurrentPage('memberInput');
                                }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '20px',
                                    padding: '40px 60px',
                                    background: teamSelection === 'ronaldo' 
                                        ? 'linear-gradient(135deg, #DC143C, #FF1744)' 
                                        : 'rgba(220, 20, 60, 0.1)',
                                    border: '3px solid #DC143C',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: teamSelection === 'ronaldo'
                                        ? '0 0 60px rgba(220, 20, 60, 0.8)'
                                        : '0 0 20px rgba(220, 20, 60, 0.3)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 0 60px rgba(220, 20, 60, 0.8)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = teamSelection === 'ronaldo'
                                        ? '0 0 60px rgba(220, 20, 60, 0.8)'
                                        : '0 0 20px rgba(220, 20, 60, 0.3)';
                                }}
                            >
                                <img 
                                    src={ronaldoImage} 
                                    alt="Ronaldo"
                                    style={{
                                        width: '300px',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        mixBlendMode: 'lighten',
                                    }}
                                />
                                <h2 style={{
                                    fontSize: '2.5rem',
                                    color: '#DC143C',
                                    margin: 0,
                                    fontFamily: '"Orbitron", sans-serif',
                                    textShadow: '0 0 20px rgba(220, 20, 60, 0.8)',
                                }}>
                                    🔴 RONALDO
                                </h2>
                            </button>
                        </div>
                    </div>
                ) : currentPage === 'memberInput' ? (
                    // 🎮 SINGLE PLAYER NAME INPUT - SIMPLIFIED
                    <div style={{
                        height: '100vh',
                        background: 'linear-gradient(135deg, #000000 0%, #1a1a00 50%, #000000 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden',
                        padding: '0',
                        paddingTop: '95px',
                    }}>
                        {/* Grid Background */}
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
                            zIndex: 0,
                        }}></div>

                        {/* Title */}
                        <h1 style={{
                            fontSize: '4rem',
                            fontFamily: '"Orbitron", sans-serif',
                            fontWeight: 'bold',
                            background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textTransform: 'uppercase',
                            letterSpacing: '10px',
                            marginBottom: '20px',
                            textShadow: '0 0 40px rgba(255, 215, 0, 0.8)',
                            animation: 'glitchTitle 2s infinite',
                            position: 'relative',
                            zIndex: 1,
                        }}>
                            ⚡ ENTER PLAYER NAME ⚡
                        </h1>

                        <p style={{
                            fontSize: '1.5rem',
                            color: '#FFD700',
                            fontFamily: '"Rajdhani", sans-serif',
                            letterSpacing: '3px',
                            marginBottom: '50px',
                            textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                            zIndex: 1,
                        }}>
                            Warrior Identification
                        </p>

                        {/* Single Input Container */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '40px',
                            marginBottom: '50px',
                            zIndex: 1,
                            alignItems: 'center',
                        }}>
                            {/* Player Name Input - Team Color Based */}
                            <div style={{
                                position: 'relative',
                            }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '1.3rem',
                                    color: teamSelection === 'messi' ? '#4169E1' : '#DC143C',
                                    fontFamily: '"Orbitron", sans-serif',
                                    marginBottom: '10px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '3px',
                                    textShadow: teamSelection === 'messi' 
                                        ? '0 0 15px rgba(65, 105, 225, 0.8)' 
                                        : '0 0 15px rgba(220, 20, 60, 0.8)',
                                }}>
                                    {teamSelection === 'messi' ? '🔷 TEAM MESSI' : '🔶 TEAM RONALDO'}
                                </label>
                                <input
                                    type="text"
                                    value={member1Name}
                                    onChange={(e) => setMember1Name(e.target.value.toUpperCase())}
                                    placeholder="ENTER YOUR NAME"
                                    maxLength={15}
                                    style={{
                                        width: '500px',
                                        padding: '20px 25px',
                                        fontSize: '2rem',
                                        fontFamily: '"Electrolize", sans-serif',
                                        background: teamSelection === 'messi' 
                                            ? 'rgba(65, 105, 225, 0.05)' 
                                            : 'rgba(220, 20, 60, 0.05)',
                                        border: teamSelection === 'messi' 
                                            ? '3px solid #4169E1' 
                                            : '3px solid #DC143C',
                                        borderRadius: '0',
                                        color: teamSelection === 'messi' ? '#4169E1' : '#DC143C',
                                        textAlign: 'center',
                                        outline: 'none',
                                        textTransform: 'uppercase',
                                        letterSpacing: '4px',
                                        boxShadow: teamSelection === 'messi'
                                            ? '0 0 30px rgba(65, 105, 225, 0.3), inset 0 0 20px rgba(65, 105, 225, 0.1)'
                                            : '0 0 30px rgba(220, 20, 60, 0.3), inset 0 0 20px rgba(220, 20, 60, 0.1)',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.boxShadow = teamSelection === 'messi'
                                            ? '0 0 50px rgba(65, 105, 225, 0.8), inset 0 0 30px rgba(65, 105, 225, 0.2)'
                                            : '0 0 50px rgba(220, 20, 60, 0.8), inset 0 0 30px rgba(220, 20, 60, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = teamSelection === 'messi'
                                            ? '0 0 30px rgba(65, 105, 225, 0.3), inset 0 0 20px rgba(65, 105, 225, 0.1)'
                                            : '0 0 30px rgba(220, 20, 60, 0.3), inset 0 0 20px rgba(220, 20, 60, 0.1)';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Continue Button */}
                        <button
                            onClick={() => {
                                if (member1Name.trim()) {
                                    setPlayer1Name(member1Name.toUpperCase());
                                    setCurrentPage('register');
                                } else {
                                    alert('Please enter your name!');
                                }
                            }}
                            disabled={!member1Name.trim()}
                            style={{
                                padding: '25px 80px',
                                fontSize: '2.5rem',
                                fontFamily: '"Orbitron", sans-serif',
                                fontWeight: 'bold',
                                background: member1Name.trim()
                                    ? 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)'
                                    : 'rgba(128, 128, 128, 0.3)',
                                backgroundSize: '200% 200%',
                                color: member1Name.trim() ? '#000' : '#666',
                                border: member1Name.trim() ? '4px solid #FFD700' : '4px solid #666',
                                borderRadius: '0',
                                cursor: member1Name.trim() ? 'pointer' : 'not-allowed',
                                textTransform: 'uppercase',
                                letterSpacing: '5px',
                                boxShadow: member1Name.trim()
                                    ? '0 0 60px rgba(255, 215, 0, 0.8), 0 0 100px rgba(255, 215, 0, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.3)'
                                    : 'none',
                                transition: 'all 0.3s ease',
                                animation: member1Name.trim() ? 'pulseButton 2s infinite, gradientShift 3s infinite' : 'none',
                                position: 'relative',
                                zIndex: 1,
                                opacity: member1Name.trim() ? 1 : 0.5,
                            }}
                            onMouseEnter={(e) => {
                                if (member1Name.trim()) {
                                    e.target.style.transform = 'scale(1.1)';
                                    e.target.style.boxShadow = '0 0 100px rgba(255, 215, 0, 1), 0 0 150px rgba(255, 215, 0, 0.8)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (member1Name.trim()) {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = '0 0 60px rgba(255, 215, 0, 0.8), 0 0 100px rgba(255, 215, 0, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.3)';
                                }
                            }}
                        >
                            ⚡ CONTINUE ⚡
                        </button>

                        {/* CSS Animations */}
                        <style>
                            {`
                                @keyframes glitchTitle {
                                    0%, 100% { 
                                        transform: translate(0);
                                        text-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
                                    }
                                    25% { 
                                        transform: translate(-2px, 2px);
                                        text-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
                                    }
                                    50% { 
                                        transform: translate(2px, -2px);
                                        text-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
                                    }
                                    75% { 
                                        transform: translate(-2px, -2px);
                                        text-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
                                    }
                                }

                                @keyframes pulseButton {
                                    0%, 100% {
                                        box-shadow: 0 0 60px rgba(255, 215, 0, 0.8), 0 0 100px rgba(255, 215, 0, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.3);
                                    }
                                    50% {
                                        box-shadow: 0 0 80px rgba(255, 215, 0, 1), 0 0 120px rgba(255, 215, 0, 0.8), inset 0 0 40px rgba(255, 255, 255, 0.5);
                                    }
                                }

                                @keyframes gradientShift {
                                    0% { background-position: 0% 50%; }
                                    50% { background-position: 100% 50%; }
                                    100% { background-position: 0% 50%; }
                                }
                            `}
                        </style>
                    </div>
                ) : currentPage === 'assignment' ? (
                    // ASSIGNMENT SCREEN - SPINNING ANIMATION
                    <div style={{
                        height: '100vh',
                        background: '#000000',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden',
                        padding: '0',
                        paddingTop: '95px',
                    }}>
                        <h1 style={{
                            fontSize: '3.5rem',
                            fontFamily: '"Orbitron", sans-serif',
                            color: '#FFD700',
                            textTransform: 'uppercase',
                            letterSpacing: '8px',
                            marginBottom: '80px',
                            textShadow: '0 0 40px rgba(255, 215, 0, 1)',
                            animation: 'pulsate 1s infinite',
                        }}>
                            {isSpinning ? '⚡ RANDOMIZING WARRIORS ⚡' : '✅ ASSIGNMENT COMPLETE ✅'}
                        </h1>

                        {/* Character Assignment Display */}
                        <div style={{
                            display: 'flex',
                            gap: '120px',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            {/* Messi Assignment */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '30px',
                            }}>
                                <img 
                                    src={messiImage} 
                                    alt="Messi"
                                    style={{
                                        width: '300px',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        mixBlendMode: 'lighten',
                                        filter: isSpinning ? 'blur(5px)' : 'blur(0)',
                                        opacity: isSpinning ? 0.5 : 1,
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                                <h2 style={{
                                    fontSize: '2rem',
                                    color: '#4169E1',
                                    fontFamily: '"Orbitron", sans-serif',
                                    textShadow: '0 0 20px rgba(65, 105, 225, 0.8)',
                                }}>
                                    MESSI
                                </h2>
                                <div style={{
                                    fontSize: '2.5rem',
                                    color: '#4169E1',
                                    fontFamily: '"Electrolize", sans-serif',
                                    fontWeight: 'bold',
                                    letterSpacing: '5px',
                                    textShadow: '0 0 30px rgba(65, 105, 225, 1)',
                                    animation: isSpinning ? 'spinText 0.3s infinite' : 'none',
                                    minHeight: '50px',
                                }}>
                                    {isSpinning ? '????' : assignedToMessi}
                                </div>
                            </div>

                            {/* VS Divider */}
                            <div style={{
                                fontSize: '5rem',
                                fontWeight: 'bold',
                                color: '#FFD700',
                                fontFamily: '"Orbitron", sans-serif',
                                textShadow: '0 0 40px rgba(255, 215, 0, 1)',
                                animation: 'rotate360 2s linear infinite',
                            }}>
                                VS
                            </div>

                            {/* Ronaldo Assignment */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '30px',
                            }}>
                                <img 
                                    src={ronaldoImage} 
                                    alt="Ronaldo"
                                    style={{
                                        width: '300px',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        mixBlendMode: 'lighten',
                                        filter: isSpinning ? 'blur(5px)' : 'blur(0)',
                                        opacity: isSpinning ? 0.5 : 1,
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                                <h2 style={{
                                    fontSize: '2rem',
                                    color: '#DC143C',
                                    fontFamily: '"Orbitron", sans-serif',
                                    textShadow: '0 0 20px rgba(220, 20, 60, 0.8)',
                                }}>
                                    RONALDO
                                </h2>
                                <div style={{
                                    fontSize: '2.5rem',
                                    color: '#DC143C',
                                    fontFamily: '"Electrolize", sans-serif',
                                    fontWeight: 'bold',
                                    letterSpacing: '5px',
                                    textShadow: '0 0 30px rgba(220, 20, 60, 1)',
                                    animation: isSpinning ? 'spinText 0.3s infinite' : 'none',
                                    minHeight: '50px',
                                }}>
                                    {isSpinning ? '????' : assignedToRonaldo}
                                </div>
                            </div>
                        </div>

                        {!isSpinning && (
                            <p style={{
                                marginTop: '60px',
                                fontSize: '1.5rem',
                                color: '#888',
                                fontFamily: '"Rajdhani", sans-serif',
                                letterSpacing: '3px',
                            }}>
                                Auto-navigating to Character Screen in 15 seconds...
                            </p>
                        )}

                        {/* CSS Animations */}
                        <style>
                            {`
                                @keyframes spinText {
                                    0% { content: '${member1Name}'; }
                                    50% { content: '${member2Name}'; }
                                    100% { content: '${member1Name}'; }
                                }

                                @keyframes rotate360 {
                                    from { transform: rotate(0deg); }
                                    to { transform: rotate(360deg); }
                                }

                                @keyframes pulsate {
                                    0%, 100% { 
                                        opacity: 1;
                                        text-shadow: 0 0 40px rgba(255, 215, 0, 1);
                                    }
                                    50% { 
                                        opacity: 0.7;
                                        text-shadow: 0 0 60px rgba(255, 215, 0, 0.8);
                                    }
                                }
                            `}
                        </style>
                    </div>
                ) : currentPage === 'assignmentResult' ? (
                    // ASSIGNMENT RESULT DISPLAY PAGE (10 seconds)
                    <div style={{
                        height: '100vh',
                        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden',
                        padding: '0',
                    }}>
                        {/* Success Title */}
                        <h1 style={{
                            fontSize: '4rem',
                            background: 'linear-gradient(135deg, #00ff87, #60efff)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '60px',
                            fontFamily: '"Orbitron", sans-serif',
                            fontWeight: 'bold',
                            textShadow: '0 0 40px rgba(0, 255, 135, 0.5)',
                            animation: 'glow 2s ease-in-out infinite',
                        }}>
                            ⚔️ WARRIORS ASSIGNED ⚔️
                        </h1>

                        {/* Assignment Results Container */}
                        <div style={{
                            display: 'flex',
                            gap: '80px',
                            marginBottom: '60px',
                        }}>
                            {/* Messi Assignment */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                background: 'rgba(65, 105, 225, 0.1)',
                                padding: '40px',
                                borderRadius: '20px',
                                border: '3px solid #4169E1',
                                boxShadow: '0 0 30px rgba(65, 105, 225, 0.5)',
                                minWidth: '350px',
                                animation: 'slideInLeft 0.8s ease-out',
                            }}>
                                <img 
                                    src={messiImage} 
                                    alt="Messi"
                                    style={{
                                        width: '250px',
                                        height: 'auto',
                                        marginBottom: '20px',
                                        filter: 'drop-shadow(0 0 20px rgba(65, 105, 225, 0.8))',
                                    }}
                                />
                                <div style={{
                                    fontSize: '2rem',
                                    color: '#4169E1',
                                    fontFamily: '"Orbitron", sans-serif',
                                    marginBottom: '15px',
                                    letterSpacing: '2px',
                                }}>
                                    TEAM A
                                </div>
                                <div style={{
                                    fontSize: '3rem',
                                    color: '#FFD700',
                                    fontFamily: '"Orbitron", sans-serif',
                                    fontWeight: 'bold',
                                    textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                                }}>
                                    {assignedToMessi}
                                </div>
                            </div>

                            {/* VS Divider */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '4rem',
                                color: '#FFD700',
                                fontFamily: '"Orbitron", sans-serif',
                                fontWeight: 'bold',
                                textShadow: '0 0 30px rgba(255, 215, 0, 1)',
                                animation: 'pulse 1.5s ease-in-out infinite',
                            }}>
                                VS
                            </div>

                            {/* Ronaldo Assignment */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                background: 'rgba(255, 69, 0, 0.1)',
                                padding: '40px',
                                borderRadius: '20px',
                                border: '3px solid #FF4500',
                                boxShadow: '0 0 30px rgba(255, 69, 0, 0.5)',
                                minWidth: '350px',
                                animation: 'slideInRight 0.8s ease-out',
                            }}>
                                <img 
                                    src={ronaldoImage} 
                                    alt="Ronaldo"
                                    style={{
                                        width: '250px',
                                        height: 'auto',
                                        marginBottom: '20px',
                                        filter: 'drop-shadow(0 0 20px rgba(255, 69, 0, 0.8))',
                                    }}
                                />
                                <div style={{
                                    fontSize: '2rem',
                                    color: '#FF4500',
                                    fontFamily: '"Orbitron", sans-serif',
                                    marginBottom: '15px',
                                    letterSpacing: '2px',
                                }}>
                                    TEAM B
                                </div>
                                <div style={{
                                    fontSize: '3rem',
                                    color: '#FFD700',
                                    fontFamily: '"Orbitron", sans-serif',
                                    fontWeight: 'bold',
                                    textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                                }}>
                                    {assignedToRonaldo}
                                </div>
                            </div>
                        </div>

                        {/* Auto-navigation message */}
                        <p style={{
                            fontSize: '1.5rem',
                            color: '#888',
                            fontFamily: '"Rajdhani", sans-serif',
                            letterSpacing: '3px',
                            animation: 'fadeInOut 2s ease-in-out infinite',
                        }}>
                            Proceeding to Character Screen...
                        </p>

                        {/* CSS Animations */}
                        <style>
                            {`
                                @keyframes glow {
                                    0%, 100% { 
                                        text-shadow: 0 0 40px rgba(0, 255, 135, 0.5);
                                    }
                                    50% { 
                                        text-shadow: 0 0 60px rgba(96, 239, 255, 0.8);
                                    }
                                }

                                @keyframes slideInLeft {
                                    from {
                                        transform: translateX(-100px);
                                        opacity: 0;
                                    }
                                    to {
                                        transform: translateX(0);
                                        opacity: 1;
                                    }
                                }

                                @keyframes slideInRight {
                                    from {
                                        transform: translateX(100px);
                                        opacity: 0;
                                    }
                                    to {
                                        transform: translateX(0);
                                        opacity: 1;
                                    }
                                }

                                @keyframes fadeInOut {
                                    0%, 100% { opacity: 0.5; }
                                    50% { opacity: 1; }
                                }
                            `}
                        </style>
                    </div>
                ) : currentPage === 'register' ? (
                    // CHARACTER REGISTRATION PAGE
                    <div style={{
                        height: '100vh',
                        background: '#000000',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden',
                        padding: '0',
                        paddingTop: '95px',
                    }}>
                        {/* Title */}
                        <h1 style={{
                            fontSize: '3rem',
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '10px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '6px',
                            filter: 'drop-shadow(0 0 40px rgba(255, 215, 0, 0.8))',
                            fontFamily: '"Orbitron", sans-serif',
                            textAlign: 'center',
                        }}>
                            CHARACTER REGISTRATION
                        </h1>

                        <p style={{
                            fontSize: '1.2rem',
                            color: '#888',
                            marginBottom: '20px',
                            letterSpacing: '3px',
                            fontFamily: '"Rajdhani", sans-serif',
                            textAlign: 'center',
                        }}>
                            Enter Player Names for the Battle
                        </p>

                        {/* Character Selection Container */}
                        <div style={{
                            display: 'flex',
                            gap: '60px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            flexWrap: 'wrap',
                        }}>
                            {/* Player 1 - Messi (Blue Team) */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '20px',
                                padding: '20px',
                                boxShadow: 'none',
                                backdropFilter: 'none',
                                minWidth: '300px',
                            }}>
                                {/* Character Image - Messi (No Frame) */}
                                <img 
                                    src={messiImage} 
                                    alt="Messi"
                                    style={{
                                        width: '350px',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        mixBlendMode: 'lighten',
                                        backgroundColor: 'transparent',
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />

                                <h2 style={{
                                    fontSize: '1.8rem',
                                    color: '#4169E1',
                                    margin: '10px 0 5px 0',
                                    fontFamily: '"Orbitron", sans-serif',
                                    textShadow: '0 0 20px rgba(65, 105, 225, 0.8)',
                                }}>
                                    TEAM A
                                </h2>

                                {/* Input Field */}
                                <input
                                    type="text"
                                    value={player1Name}
                                    onChange={(e) => setPlayer1Name(e.target.value.toUpperCase())}
                                    placeholder="Enter Name"
                                    maxLength={15}
                                    style={{
                                        width: '100%',
                                        padding: '20px',
                                        fontSize: '1.8rem',
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        border: '2px solid #4169E1',
                                        borderRadius: '10px',
                                        color: '#4169E1',
                                        fontFamily: '"Orbitron", sans-serif',
                                        outline: 'none',
                                        boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
                                    }}
                                />
                            </div>

                            {/* VS Divider - 3D Rotating */}
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <div style={{
                                    fontSize: '4rem',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    fontFamily: '"Orbitron", sans-serif',
                                    textShadow: '0 0 40px rgba(255, 215, 0, 1)',
                                    filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.8)) drop-shadow(5px 5px 10px rgba(255, 165, 0, 0.6))',
                                    animation: 'rotate3DVS 4s ease-in-out infinite, pulseGlow 2s ease-in-out infinite',
                                    transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg)',
                                    letterSpacing: '10px',
                                }}>
                                    VS
                                </div>
                                
                                {/* Glowing ring around VS */}
                                <div style={{
                                    position: 'absolute',
                                    width: '120px',
                                    height: '120px',
                                    border: '3px solid #FFD700',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 40px rgba(255, 215, 0, 0.8), inset 0 0 40px rgba(255, 215, 0, 0.3)',
                                    animation: 'spinRing 8s linear infinite',
                                    zIndex: -1,
                                }}></div>
                            </div>

                            {/* Player 2 - Ronaldo (Red Team) */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '20px',
                                padding: '20px',
                                boxShadow: 'none',
                                backdropFilter: 'none',
                                minWidth: '300px',
                            }}>
                                {/* Character Image - Ronaldo (No Frame) */}
                                <img 
                                    src={ronaldoImage} 
                                    alt="Ronaldo"
                                    style={{
                                        width: '350px',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        mixBlendMode: 'lighten',
                                        backgroundColor: 'transparent',
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />

                                <h2 style={{
                                    fontSize: '1.8rem',
                                    color: '#DC143C',
                                    margin: '10px 0 5px 0',
                                    fontFamily: '"Orbitron", sans-serif',
                                    textShadow: '0 0 20px rgba(220, 20, 60, 0.8)',
                                }}>
                                    TEAM B
                                </h2>

                                {/* Input Field */}
                                <input
                                    type="text"
                                    value={player2Name}
                                    onChange={(e) => setPlayer2Name(e.target.value.toUpperCase())}
                                    placeholder="Enter Name"
                                    maxLength={15}
                                    style={{
                                        width: '100%',
                                        padding: '20px',
                                        fontSize: '1.8rem',
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        border: '2px solid #DC143C',
                                        borderRadius: '10px',
                                        color: '#DC143C',
                                        fontFamily: '"Orbitron", sans-serif',
                                        outline: 'none',
                                        boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* GO Button */}
                        <button
                            onClick={handleStartGame}
                            style={{
                                padding: '18px 60px',
                                fontSize: '1.8rem',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
                                backgroundSize: '200% 100%',
                                color: '#000',
                                border: '3px solid #FFD700',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                boxShadow: `
                                    0 0 50px rgba(255, 215, 0, 0.7),
                                    0 0 100px rgba(255, 215, 0, 0.5),
                                    inset 0 2px 10px rgba(255, 255, 255, 0.3)
                                `,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                textTransform: 'uppercase',
                                letterSpacing: '6px',
                                fontFamily: '"Orbitron", sans-serif',
                                animation: 'glowPulse 2s ease-in-out infinite',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.1) translateY(-5px)';
                                e.target.style.boxShadow = '0 0 70px rgba(255, 215, 0, 0.9), 0 0 120px rgba(255, 215, 0, 0.7)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1) translateY(0)';
                                e.target.style.boxShadow = '0 0 50px rgba(255, 215, 0, 0.7), 0 0 100px rgba(255, 215, 0, 0.5)';
                            }}
                        >
                            ⚡ GO TO BATTLE ⚡
                        </button>
                    </div>
                ) : currentPage === 'home' ? (
                    // HOME PAGE
                    <div style={{
                        height: '100vh',
                        background: '#000000',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden',
                        paddingTop: '75px',
                    }}>
                        <style>
                            {`
                                @keyframes liquidFlow {
                                    0% { background-position: 0% 50%; }
                                    50% { background-position: 100% 50%; }
                                    100% { background-position: 0% 50%; }
                                }
                                @keyframes float {
                                    0%, 100% { transform: translateY(0px); }
                                    50% { transform: translateY(-20px); }
                                }
                                @keyframes pulse {
                                    0%, 100% { transform: scale(1); }
                                    50% { transform: scale(1.05); }
                                }
                                @keyframes bounce {
                                    0%, 100% { transform: translateY(0); }
                                    50% { transform: translateY(-30px); }
                                }
                                @keyframes rotate3d {
                                    0% { transform: rotateY(0deg) rotateX(10deg); }
                                    100% { transform: rotateY(360deg) rotateX(10deg); }
                                }
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                                @keyframes kickBall {
                                    0%, 100% { transform: translateX(0) rotate(0deg); }
                                    25% { transform: translateX(50px) rotate(180deg); }
                                    50% { transform: translateX(100px) rotate(360deg); }
                                    75% { transform: translateX(50px) rotate(540deg); }
                                }
                                @keyframes carDrive {
                                    0%, 100% { transform: translateX(-30px); }
                                    50% { transform: translateX(30px); }
                                }
                                @keyframes carDriveLeft {
                                    0%, 100% { transform: translateX(30px) scaleX(1); }
                                    50% { transform: translateX(-30px) scaleX(1); }
                                }
                                @keyframes carDriveRight {
                                    0%, 100% { transform: translateX(-30px) scaleX(-1); }
                                    50% { transform: translateX(30px) scaleX(-1); }
                                }
                                @keyframes wheelSpin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                                @keyframes flicker {
                                    0%, 100% { opacity: 1; }
                                    50% { opacity: 0.8; }
                                }
                                @keyframes smokeRise {
                                    0% { transform: translateY(0) scale(1); opacity: 0.6; }
                                    100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
                                }
                                @keyframes stadiumLight {
                                    0%, 100% { opacity: 0.9; transform: scaleY(1); }
                                    50% { opacity: 1; transform: scaleY(1.1); }
                                }
                                @keyframes glowPulse {
                                    0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.4); }
                                    50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.6); }
                                }
                                @keyframes fadeInUp {
                                    0% { opacity: 0; transform: translateY(50px); }
                                    100% { opacity: 1; transform: translateY(0); }
                                }
                                @keyframes fadeOut {
                                    0% { opacity: 1; }
                                    100% { opacity: 0; }
                                }
                                @keyframes textGlow {
                                    0%, 100% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.6); }
                                    50% { text-shadow: 0 0 40px rgba(255, 215, 0, 1), 0 0 80px rgba(255, 215, 0, 0.8), 0 0 120px rgba(255, 215, 0, 0.6); }
                                }
                            `}
                        </style>
                        
                        {/* Grid floor effect */}
                        <div style={{
                            position: 'absolute',
                            top: '-50px',
                            left: '10%',
                            width: '150px',
                            height: '300px',
                            background: 'linear-gradient(180deg, rgba(255, 255, 200, 0.3) 0%, rgba(255, 255, 200, 0.1) 40%, transparent 100%)',
                            clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
                            animation: 'stadiumLight 3s ease-in-out infinite',
                            filter: 'blur(20px)',
                            zIndex: 2,
                        }}></div>

                        {/* Stadium Lights - Top Right */}
                        <div style={{
                            position: 'absolute',
                            top: '-50px',
                            right: '10%',
                            width: '150px',
                            height: '300px',
                            background: 'linear-gradient(180deg, rgba(255, 255, 200, 0.3) 0%, rgba(255, 255, 200, 0.1) 40%, transparent 100%)',
                            clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
                            animation: 'stadiumLight 3s ease-in-out infinite 0.5s',
                            filter: 'blur(20px)',
                            zIndex: 2,
                        }}></div>

                        {/* Smoke/Fog Effects */}
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            width: '100%',
                            height: '200px',
                            background: 'linear-gradient(180deg, transparent 0%, rgba(100, 100, 100, 0.1) 50%, rgba(80, 80, 80, 0.2) 100%)',
                            filter: 'blur(30px)',
                            animation: 'smokeRise 8s ease-in-out infinite',
                            zIndex: 2,
                        }}></div>

                        {/* Grid Floor */}
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            width: '100%',
                            height: '300px',
                            background: `
                                repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255, 215, 0, 0.03) 50px, rgba(255, 215, 0, 0.03) 51px),
                                repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255, 215, 0, 0.03) 50px, rgba(255, 215, 0, 0.03) 51px)
                            `,
                            transform: 'perspective(500px) rotateX(60deg)',
                            transformOrigin: 'bottom',
                            opacity: 0.4,
                            zIndex: 2,
                        }}></div>

                        {/* Particle Effects - Blue Side */}
                        <div style={{
                            position: 'absolute',
                            top: '20%',
                            left: '5%',
                            width: '15px',
                            height: '15px',
                            background: 'radial-gradient(circle, #00BFFF, transparent)',
                            borderRadius: '50%',
                            animation: 'float 4s ease-in-out infinite',
                            filter: 'blur(3px)',
                            zIndex: 2,
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            top: '40%',
                            left: '8%',
                            width: '20px',
                            height: '20px',
                            background: 'radial-gradient(circle, #4169E1, transparent)',
                            borderRadius: '50%',
                            animation: 'float 5s ease-in-out infinite 1s',
                            filter: 'blur(4px)',
                            zIndex: 2,
                        }}></div>

                        {/* Particle Effects - Red Side */}
                        <div style={{
                            position: 'absolute',
                            top: '30%',
                            right: '5%',
                            width: '15px',
                            height: '15px',
                            background: 'radial-gradient(circle, #FF6347, transparent)',
                            borderRadius: '50%',
                            animation: 'float 4.5s ease-in-out infinite',
                            filter: 'blur(3px)',
                            zIndex: 2,
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            right: '8%',
                            width: '20px',
                            height: '20px',
                            background: 'radial-gradient(circle, #DC143C, transparent)',
                            borderRadius: '50%',
                            animation: 'float 5.5s ease-in-out infinite 1.5s',
                            filter: 'blur(4px)',
                            zIndex: 2,
                        }}></div>
                        
                        {/* Background orbs */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `
                                radial-gradient(circle at 20% 50%, rgba(65, 105, 225, 0.08) 0%, transparent 50%),
                                radial-gradient(circle at 80% 80%, rgba(220, 20, 60, 0.08) 0%, transparent 50%),
                                radial-gradient(circle at 40% 20%, rgba(255, 215, 0, 0.04) 0%, transparent 50%)
                            `,
                            animation: 'float 8s ease-in-out infinite',
                            zIndex: 2,
                        }}></div>

                        {/* Background Robot Cars Playing Football - Team A (Blue) */}
                        <div style={{
                            position: 'absolute',
                            top: '15%',
                            left: '5%',
                            opacity: 0.7,
                            animation: 'carDriveLeft 6s ease-in-out infinite',
                            zIndex: 2,
                        }}>
                            {/* Car Body - Blue Team */}
                            <div style={{
                                width: '100px',
                                height: '60px',
                                background: 'linear-gradient(135deg, #4169E1 0%, #1E90FF 50%, #00BFFF 100%)',
                                borderRadius: '18px 18px 12px 12px',
                                position: 'relative',
                                boxShadow: `
                                    0 8px 25px rgba(65, 105, 225, 0.4),
                                    inset 0 -4px 8px rgba(0, 0, 0, 0.3),
                                    inset 0 4px 8px rgba(255, 255, 255, 0.3)
                                `,
                                border: '2px solid rgba(65, 105, 225, 0.5)',
                            }}>
                                {/* Car Roof */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    left: '15px',
                                    width: '70px',
                                    height: '25px',
                                    background: 'linear-gradient(135deg, #1E90FF, #4169E1)',
                                    borderRadius: '12px 12px 0 0',
                                    boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.4)',
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '4px',
                                        left: '8px',
                                        width: '54px',
                                        height: '17px',
                                        background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.6), rgba(100, 149, 237, 0.8))',
                                        borderRadius: '8px 8px 0 0',
                                    }}></div>
                                </div>
                                
                                {/* Robot Face - Team A */}
                                <div style={{ position: 'absolute', top: '12px', left: '28px' }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '6px',
                                        left: '6px',
                                        width: '10px',
                                        height: '10px',
                                        background: '#00ff00',
                                        borderRadius: '50%',
                                        boxShadow: '0 0 8px #00ff00',
                                    }}></div>
                                    <div style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '-20px',
                                        width: '10px',
                                        height: '10px',
                                        background: '#00ff00',
                                        borderRadius: '50%',
                                        boxShadow: '0 0 8px #00ff00',
                                    }}></div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-8px',
                                        left: '8px',
                                        width: '25px',
                                        height: '6px',
                                        borderBottom: '2px solid #fff',
                                        borderRadius: '0 0 12px 12px',
                                    }}></div>
                                </div>

                                {/* Wheels - Team A */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-18px',
                                    left: '8px',
                                    width: '30px',
                                    height: '30px',
                                    background: 'radial-gradient(circle, #222 40%, #555 60%, #222 100%)',
                                    borderRadius: '50%',
                                    border: '3px solid #4169E1',
                                    animation: 'wheelSpin 0.5s linear infinite',
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        width: '2px',
                                        height: '16px',
                                        background: '#4169E1',
                                        transform: 'translate(-50%, -50%)',
                                    }}></div>
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-18px',
                                    right: '8px',
                                    width: '30px',
                                    height: '30px',
                                    background: 'radial-gradient(circle, #222 40%, #555 60%, #222 100%)',
                                    borderRadius: '50%',
                                    border: '3px solid #4169E1',
                                    animation: 'wheelSpin 0.5s linear infinite',
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        width: '16px',
                                        height: '2px',
                                        background: '#4169E1',
                                        transform: 'translate(-50%, -50%)',
                                    }}></div>
                                </div>
                                
                                <div style={{
                                    position: 'absolute',
                                    top: '22px',
                                    left: '-4px',
                                    width: '8px',
                                    height: '12px',
                                    background: '#00ffff',
                                    borderRadius: '4px',
                                    boxShadow: '0 0 12px #00ffff',
                                }}></div>
                            </div>
                        </div>

                        {/* Background Robot Cars Playing Football - Team B (Red) */}
                        <div style={{
                            position: 'absolute',
                            bottom: '15%',
                            right: '5%',
                            opacity: 0.7,
                            animation: 'carDriveRight 7s ease-in-out infinite',
                            zIndex: 2,
                        }}>
                            {/* Car Body - Red Team */}
                            <div style={{
                                width: '100px',
                                height: '60px',
                                background: 'linear-gradient(135deg, #DC143C 0%, #FF6347 50%, #FF4500 100%)',
                                borderRadius: '18px 18px 12px 12px',
                                position: 'relative',
                                boxShadow: `
                                    0 8px 25px rgba(220, 20, 60, 0.4),
                                    inset 0 -4px 8px rgba(0, 0, 0, 0.3),
                                    inset 0 4px 8px rgba(255, 255, 255, 0.3)
                                `,
                                border: '2px solid rgba(220, 20, 60, 0.5)',
                            }}>
                                {/* Car Roof */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    left: '15px',
                                    width: '70px',
                                    height: '25px',
                                    background: 'linear-gradient(135deg, #FF6347, #DC143C)',
                                    borderRadius: '12px 12px 0 0',
                                    boxShadow: 'inset 0 2px 6px rgba(255, 255, 255, 0.4)',
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '4px',
                                        left: '8px',
                                        width: '54px',
                                        height: '17px',
                                        background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.6), rgba(100, 149, 237, 0.8))',
                                        borderRadius: '8px 8px 0 0',
                                    }}></div>
                                </div>
                                
                                {/* Robot Face - Team B */}
                                <div style={{ position: 'absolute', top: '12px', left: '28px' }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '6px',
                                        left: '6px',
                                        width: '10px',
                                        height: '10px',
                                        background: '#ff0000',
                                        borderRadius: '50%',
                                        boxShadow: '0 0 8px #ff0000',
                                    }}></div>
                                    <div style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '-20px',
                                        width: '10px',
                                        height: '10px',
                                        background: '#ff0000',
                                        borderRadius: '50%',
                                        boxShadow: '0 0 8px #ff0000',
                                    }}></div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-8px',
                                        left: '8px',
                                        width: '25px',
                                        height: '6px',
                                        borderBottom: '2px solid #fff',
                                        borderRadius: '0 0 12px 12px',
                                    }}></div>
                                </div>

                                {/* Wheels - Team B */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-18px',
                                    left: '8px',
                                    width: '30px',
                                    height: '30px',
                                    background: 'radial-gradient(circle, #222 40%, #555 60%, #222 100%)',
                                    borderRadius: '50%',
                                    border: '3px solid #DC143C',
                                    animation: 'wheelSpin 0.5s linear infinite',
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        width: '2px',
                                        height: '16px',
                                        background: '#DC143C',
                                        transform: 'translate(-50%, -50%)',
                                    }}></div>
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-18px',
                                    right: '8px',
                                    width: '30px',
                                    height: '30px',
                                    background: 'radial-gradient(circle, #222 40%, #555 60%, #222 100%)',
                                    borderRadius: '50%',
                                    border: '3px solid #DC143C',
                                    animation: 'wheelSpin 0.5s linear infinite',
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        width: '16px',
                                        height: '2px',
                                        background: '#DC143C',
                                        transform: 'translate(-50%, -50%)',
                                    }}></div>
                                </div>
                                
                                <div style={{
                                    position: 'absolute',
                                    top: '22px',
                                    left: '-4px',
                                    width: '8px',
                                    height: '12px',
                                    background: '#ffff00',
                                    borderRadius: '4px',
                                    boxShadow: '0 0 12px #ffff00',
                                }}></div>
                            </div>
                        </div>

                        {/* Main content */}
                        <div style={{
                            position: 'relative',
                            zIndex: 3,
                            textAlign: 'center',
                            padding: '40px',
                        }}>
                            {/* 3D Robot Car Playing Football - Animated Scene */}
                            <div style={{
                                marginBottom: '40px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '30px',
                                position: 'relative',
                                height: '200px',
                            }}>
                                {/* Robot Car */}
                                <div style={{
                                    position: 'relative',
                                    animation: 'carDrive 3s ease-in-out infinite',
                                }}>
                                    {/* Car Body - 3D Effect */}
                                    <div style={{
                                        width: '120px',
                                        height: '70px',
                                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
                                        borderRadius: '20px 20px 15px 15px',
                                        position: 'relative',
                                        boxShadow: `
                                            0 10px 30px rgba(255, 215, 0, 0.4),
                                            inset 0 -5px 10px rgba(0, 0, 0, 0.3),
                                            inset 0 5px 10px rgba(255, 255, 255, 0.3)
                                        `,
                                        border: '3px solid rgba(255, 215, 0, 0.5)',
                                    }}>
                                        {/* Car Roof */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '-25px',
                                            left: '20px',
                                            width: '80px',
                                            height: '30px',
                                            background: 'linear-gradient(135deg, #FFA500, #FF8C00)',
                                            borderRadius: '15px 15px 0 0',
                                            boxShadow: 'inset 0 3px 8px rgba(255, 255, 255, 0.4)',
                                        }}>
                                            {/* Windshield */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '5px',
                                                left: '10px',
                                                width: '60px',
                                                height: '20px',
                                                background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.6), rgba(100, 149, 237, 0.8))',
                                                borderRadius: '10px 10px 0 0',
                                                boxShadow: 'inset 0 2px 5px rgba(255, 255, 255, 0.5)',
                                            }}></div>
                                        </div>
                                        
                                        {/* Robot Face */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '15px',
                                            left: '35px',
                                            width: '50px',
                                            height: '35px',
                                        }}>
                                            {/* Eyes */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '8px',
                                                left: '8px',
                                                width: '12px',
                                                height: '12px',
                                                background: '#00ff00',
                                                borderRadius: '50%',
                                                boxShadow: '0 0 10px #00ff00, inset 0 2px 3px rgba(255, 255, 255, 0.6)',
                                            }}></div>
                                            <div style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                width: '12px',
                                                height: '12px',
                                                background: '#00ff00',
                                                borderRadius: '50%',
                                                boxShadow: '0 0 10px #00ff00, inset 0 2px 3px rgba(255, 255, 255, 0.6)',
                                            }}></div>
                                            {/* Smile */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '5px',
                                                left: '10px',
                                                width: '30px',
                                                height: '8px',
                                                borderBottom: '3px solid #333',
                                                borderRadius: '0 0 15px 15px',
                                            }}></div>
                                        </div>

                                        {/* Wheels */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-20px',
                                            left: '10px',
                                            width: '35px',
                                            height: '35px',
                                            background: 'radial-gradient(circle, #333 40%, #666 60%, #333 100%)',
                                            borderRadius: '50%',
                                            border: '4px solid #FFD700',
                                            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5), inset 0 -3px 8px rgba(255, 215, 0, 0.4)',
                                            animation: 'wheelSpin 0.5s linear infinite',
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                width: '3px',
                                                height: '20px',
                                                background: '#FFD700',
                                                transform: 'translate(-50%, -50%)',
                                            }}></div>
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                width: '20px',
                                                height: '3px',
                                                background: '#FFD700',
                                                transform: 'translate(-50%, -50%)',
                                            }}></div>
                                        </div>
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-20px',
                                            right: '10px',
                                            width: '35px',
                                            height: '35px',
                                            background: 'radial-gradient(circle, #333 40%, #666 60%, #333 100%)',
                                            borderRadius: '50%',
                                            border: '4px solid #FFD700',
                                            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5), inset 0 -3px 8px rgba(255, 215, 0, 0.4)',
                                            animation: 'wheelSpin 0.5s linear infinite',
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                width: '3px',
                                                height: '20px',
                                                background: '#FFD700',
                                                transform: 'translate(-50%, -50%)',
                                            }}></div>
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                width: '20px',
                                                height: '3px',
                                                background: '#FFD700',
                                                transform: 'translate(-50%, -50%)',
                                            }}></div>
                                        </div>

                                        {/* Headlights */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '25px',
                                            left: '-5px',
                                            width: '10px',
                                            height: '15px',
                                            background: '#ffff00',
                                            borderRadius: '5px',
                                            boxShadow: '0 0 15px #ffff00',
                                        }}></div>
                                    </div>

                                    {/* Robot Arm kicking */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-10px',
                                        right: '-25px',
                                        width: '30px',
                                        height: '8px',
                                        background: 'linear-gradient(90deg, #FFA500, #FF8C00)',
                                        borderRadius: '5px',
                                        transform: 'rotate(-30deg)',
                                        boxShadow: '0 2px 8px rgba(255, 165, 0, 0.5)',
                                    }}></div>
                                </div>

                                {/* 3D Football */}
                                <div style={{
                                    position: 'relative',
                                    width: '80px',
                                    height: '80px',
                                    animation: 'kickBall 4s ease-in-out infinite',
                                }}>
                                    {/* Ball with 3D effect */}
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f0f0 30%, #d0d0d0 60%, #a0a0a0 100%)',
                                        borderRadius: '50%',
                                        position: 'relative',
                                        boxShadow: `
                                            0 15px 35px rgba(0, 0, 0, 0.5),
                                            inset -10px -10px 20px rgba(0, 0, 0, 0.3),
                                            inset 10px 10px 20px rgba(255, 255, 255, 0.5)
                                        `,
                                        border: '2px solid rgba(0, 0, 0, 0.1)',
                                    }}>
                                        {/* Pentagon patterns (soccer ball) */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '15px',
                                            left: '15px',
                                            width: '20px',
                                            height: '20px',
                                            background: '#000',
                                            clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                                        }}></div>
                                        <div style={{
                                            position: 'absolute',
                                            top: '25px',
                                            right: '12px',
                                            width: '15px',
                                            height: '15px',
                                            background: '#000',
                                            clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                                        }}></div>
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '18px',
                                            left: '25px',
                                            width: '18px',
                                            height: '18px',
                                            background: '#000',
                                            clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                                        }}></div>
                                    </div>
                                </div>

                                {/* Goal Post */}
                                <div style={{
                                    position: 'absolute',
                                    right: '50px',
                                    bottom: '20px',
                                    width: '100px',
                                    height: '80px',
                                }}>
                                    {/* Left post */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '0',
                                        bottom: '0',
                                        width: '8px',
                                        height: '80px',
                                        background: 'linear-gradient(90deg, #fff, #ddd)',
                                        borderRadius: '4px',
                                        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.3)',
                                    }}></div>
                                    {/* Right post */}
                                    <div style={{
                                        position: 'absolute',
                                        right: '0',
                                        bottom: '0',
                                        width: '8px',
                                        height: '80px',
                                        background: 'linear-gradient(90deg, #ddd, #bbb)',
                                        borderRadius: '4px',
                                        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.3)',
                                    }}></div>
                                    {/* Top bar */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '0',
                                        left: '0',
                                        width: '100px',
                                        height: '8px',
                                        background: 'linear-gradient(180deg, #fff, #ddd)',
                                        borderRadius: '4px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                    }}></div>
                                    {/* Net pattern */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '8px',
                                        left: '8px',
                                        right: '8px',
                                        bottom: '0',
                                        background: `
                                            repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255, 255, 255, 0.2) 8px, rgba(255, 255, 255, 0.2) 10px),
                                            repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255, 255, 255, 0.2) 8px, rgba(255, 255, 255, 0.2) 10px)
                                        `,
                                    }}></div>
                                </div>
                            </div>

                            <h1 style={{
                                fontSize: '5rem',
                                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                marginBottom: '10px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '8px',
                                filter: 'drop-shadow(0 0 40px rgba(255, 215, 0, 0.8))',
                                textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                                fontFamily: '"Orbitron", sans-serif',
                            }}>
                                BATTLE FOR THE GOAL
                            </h1>
                            
                            <div style={{
                                display: 'flex',
                                gap: '20px',
                                justifyContent: 'center',
                                marginBottom: '40px',
                            }}>
                                <div style={{
                                    fontSize: '1rem',
                                    color: '#888',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontFamily: '"Rajdhani", sans-serif',
                                }}>
                                    <span style={{ fontSize: '1.5rem' }}>⚽</span> FOOTBALL
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    color: '#888',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontFamily: '"Rajdhani", sans-serif',
                                }}>
                                    <span style={{ fontSize: '1.5rem' }}>🚗</span> ROBOT CARS
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    color: '#888',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontFamily: '"Rajdhani", sans-serif',
                                }}>
                                    <span style={{ fontSize: '1.5rem' }}>🥅</span> GOALS
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    color: '#888',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontFamily: '"Rajdhani", sans-serif',
                                }}>
                                    <span style={{ fontSize: '1.5rem' }}>⏱️</span> REAL-TIME
                                </div>
                            </div>
                            
                            <p style={{
                                fontSize: '1.4rem',
                                color: '#666',
                                marginBottom: '50px',
                                letterSpacing: '4px',
                                fontFamily: '"Rajdhani", sans-serif',
                                textTransform: 'uppercase',
                                fontWeight: '600',
                            }}>
                                IoT Live Scoring Arena
                            </p>

                            <button
                                onClick={handleStartGame}
                                style={{
                                    padding: '28px 80px',
                                    fontSize: '2.2rem',
                                    fontWeight: 'bold',
                                    background: `
                                        linear-gradient(135deg, #FFD700, #FFA500),
                                        linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2))
                                    `,
                                    color: '#000',
                                    border: '3px solid #FFD700',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    boxShadow: `
                                        0 0 40px rgba(255, 215, 0, 0.6),
                                        0 0 80px rgba(255, 215, 0, 0.4),
                                        inset 0 2px 10px rgba(255, 255, 255, 0.3)
                                    `,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '4px',
                                    animation: 'glowPulse 2s ease-in-out infinite',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    fontFamily: '"Orbitron", sans-serif',
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.08) translateY(-3px)';
                                    e.target.style.boxShadow = '0 0 60px rgba(255, 215, 0, 0.8), 0 0 100px rgba(255, 215, 0, 0.6)';
                                    e.target.style.animation = 'none';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1) translateY(0)';
                                    e.target.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.6), 0 0 80px rgba(255, 215, 0, 0.4)';
                                    e.target.style.animation = 'glowPulse 2s ease-in-out infinite';
                                }}
                            >
                                ⚡ START BATTLE ⚡
                            </button>

                            <div style={{
                                marginTop: '80px',
                                display: 'flex',
                                gap: '30px',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                            }}>
                                <div style={{
                                    background: 'rgba(10, 15, 25, 0.8)',
                                    border: '2px solid rgba(65, 105, 225, 0.5)',
                                    borderRadius: '10px',
                                    padding: '20px 35px',
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: '0 0 20px rgba(65, 105, 225, 0.3), inset 0 1px 3px rgba(65, 105, 225, 0.2)',
                                }}>
                                    <p style={{ color: '#4169E1', fontSize: '1.3rem', margin: 0, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: '"Rajdhani", sans-serif' }}>
                                        ⚡ ESP32 Powered
                                    </p>
                                </div>
                                <div style={{
                                    background: 'rgba(10, 15, 25, 0.8)',
                                    border: '2px solid rgba(255, 215, 0, 0.5)',
                                    borderRadius: '10px',
                                    padding: '20px 35px',
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.3), inset 0 1px 3px rgba(255, 215, 0, 0.2)',
                                }}>
                                    <p style={{ color: '#FFD700', fontSize: '1.3rem', margin: 0, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: '"Rajdhani", sans-serif' }}>
                                        🎯 IR Sensors
                                    </p>
                                </div>
                                <div style={{
                                    background: 'rgba(10, 15, 25, 0.8)',
                                    border: '2px solid rgba(220, 20, 60, 0.5)',
                                    borderRadius: '10px',
                                    padding: '20px 35px',
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: '0 0 20px rgba(220, 20, 60, 0.3), inset 0 1px 3px rgba(220, 20, 60, 0.2)',
                                }}>
                                    <p style={{ color: '#DC143C', fontSize: '1.3rem', margin: 0, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: '"Rajdhani", sans-serif' }}>
                                        📊 Live Stats
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Countdown Overlay */}
                        {showCountdown && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100vw',
                                height: '100vh',
                                background: 'rgba(0, 0, 0, 0.95)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 9999,
                                animation: 'fadeIn 0.3s ease-in',
                            }}>
                                <style>
                                    {`
                                        @keyframes fadeIn {
                                            from { opacity: 0; }
                                            to { opacity: 1; }
                                        }
                                        @keyframes countdownPulse {
                                            0% { 
                                                transform: scale(0.5);
                                                opacity: 0;
                                            }
                                            50% { 
                                                transform: scale(1.2);
                                                opacity: 1;
                                            }
                                            100% { 
                                                transform: scale(1);
                                                opacity: 1;
                                            }
                                        }
                                        @keyframes countdownGlow {
                                            0%, 100% { 
                                                text-shadow: 0 0 40px rgba(255, 215, 0, 1),
                                                             0 0 80px rgba(255, 215, 0, 0.8),
                                                             0 0 120px rgba(255, 215, 0, 0.6);
                                            }
                                            50% { 
                                                text-shadow: 0 0 60px rgba(255, 215, 0, 1),
                                                             0 0 120px rgba(255, 215, 0, 0.9),
                                                             0 0 180px rgba(255, 215, 0, 0.7);
                                            }
                                        }
                                    `}
                                </style>
                                <div style={{
                                    fontSize: countdownNumber === 0 ? '5rem' : '15rem',
                                    fontWeight: 'bold',
                                    color: '#FFD700',
                                    fontFamily: '"Orbitron", sans-serif',
                                    animation: 'countdownPulse 0.6s ease-out, countdownGlow 1s ease-in-out infinite',
                                    textShadow: '0 0 40px rgba(255, 215, 0, 1), 0 0 80px rgba(255, 215, 0, 0.8)',
                                    letterSpacing: '10px',
                                    textTransform: 'uppercase',
                                }}>
                                    {countdownNumber === 0 ? '⚡ START BATTLE ⚡' : countdownNumber}
                                </div>
                            </div>
                        )}
                    </div>
                ) : currentPage === 'scoreboard' ? (
                    // SCOREBOARD PAGE
                    <div style={{ position: 'relative' }}>
                        {/* WebSocket Connection Status Indicator */}
                        <div style={{
                            position: 'fixed',
                            top: '10px',
                            right: '10px',
                            zIndex: 9999,
                            background: isConnected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            transition: 'all 0.3s ease'
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'white',
                                animation: isConnected ? 'pulse 2s infinite' : 'none'
                            }}></span>
                            {isConnected ? '🔌 Live' : '❌ Offline'}
                        </div>

                        {/* Goal Notification Toast */}
                        {notification && (
                            <div style={{
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 10000,
                                background: notification.type === 'success' 
                                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                                    : 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: 'white',
                                padding: '30px 50px',
                                borderRadius: '20px',
                                fontSize: '28px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                animation: 'slideIn 0.3s ease-out',
                                border: '3px solid rgba(255,255,255,0.3)',
                                minWidth: '400px'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                                    {notification.type === 'success' ? '⚽🎉' : '⏸️🚫'}
                                </div>
                                <div>{notification.message}</div>
                                <div style={{ 
                                    fontSize: '16px', 
                                    marginTop: '10px', 
                                    opacity: 0.9,
                                    fontWeight: 'normal'
                                }}>
                                    Team {notification.team}
                                </div>
                            </div>
                        )}
                        
                        <ScoreDisplay 
                            scores={scores} 
                            player1Name={player1Name} 
                            player2Name={player2Name} 
                            autoStart={true}
                            teamSelection={teamSelection}
                        />
                    </div>
                ) : currentPage === 'leaderboard' ? (
                    // 🏆 LEADERBOARD PAGE
                    <div style={{
                        height: '100vh',
                        background: 'linear-gradient(135deg, #000000 0%, #0a0520 100%)',
                        padding: '95px 40px 40px 40px',
                        color: '#e0e0e0',
                        overflow: 'auto',
                    }}>
                        <h1 style={{
                            fontSize: '4rem',
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontFamily: '"Orbitron", sans-serif',
                            textAlign: 'center',
                            marginBottom: '20px',
                            letterSpacing: '5px',
                            textShadow: '0 0 40px rgba(255, 215, 0, 0.8)',
                        }}>
                            🏆 HALL OF CHAMPIONS
                        </h1>

                        <p style={{
                            fontSize: '1.5rem',
                            color: '#888',
                            textAlign: 'center',
                            marginBottom: '60px',
                            letterSpacing: '3px',
                            fontFamily: '"Rajdhani", sans-serif',
                        }}>
                            Total Matches Played: {matchCount}
                        </p>

                        <div style={{
                            maxWidth: '900px',
                            margin: '0 auto',
                        }}>
                            {leaderboard.length === 0 ? (
                                <p style={{
                                    fontSize: '1.5rem',
                                    color: '#666',
                                    textAlign: 'center',
                                    fontFamily: '"Rajdhani", sans-serif',
                                }}>
                                    No matches played yet. Start your first battle!
                                </p>
                            ) : (
                                leaderboard.map((player, index) => (
                                    <div 
                                        key={index}
                                        style={{
                                            background: index === 0 
                                                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.1))'
                                                : 'rgba(10, 15, 25, 0.6)',
                                            border: index === 0 
                                                ? '3px solid #FFD700'
                                                : '2px solid rgba(100, 100, 150, 0.3)',
                                            borderRadius: '15px',
                                            padding: '30px',
                                            marginBottom: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: index === 0 
                                                ? '0 0 40px rgba(255, 215, 0, 0.4)'
                                                : '0 4px 20px rgba(0, 0, 0, 0.3)',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-5px)';
                                            e.currentTarget.style.boxShadow = '0 8px 30px rgba(100, 100, 255, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = index === 0 
                                                ? '0 0 40px rgba(255, 215, 0, 0.4)'
                                                : '0 4px 20px rgba(0, 0, 0, 0.3)';
                                        }}
                                    >
                                        {/* Rank */}
                                        <div style={{
                                            fontSize: index === 0 ? '4rem' : '3rem',
                                            fontWeight: 'bold',
                                            color: index === 0 ? '#FFD700' : '#888',
                                            fontFamily: '"Orbitron", sans-serif',
                                            minWidth: '80px',
                                            textAlign: 'center',
                                            textShadow: index === 0 ? '0 0 30px rgba(255, 215, 0, 0.8)' : 'none',
                                        }}>
                                            {index === 0 ? '👑' : `#${index + 1}`}
                                        </div>

                                        {/* Player Name */}
                                        <div style={{
                                            flex: 1,
                                            marginLeft: '30px',
                                        }}>
                                            <h2 style={{
                                                fontSize: index === 0 ? '2.5rem' : '2rem',
                                                color: index === 0 ? '#FFD700' : '#fff',
                                                margin: '0 0 10px 0',
                                                fontFamily: '"Orbitron", sans-serif',
                                                letterSpacing: '2px',
                                                textShadow: index === 0 ? '0 0 20px rgba(255, 215, 0, 0.6)' : 'none',
                                            }}>
                                                {player.name}
                                            </h2>
                                            <p style={{
                                                fontSize: '1.2rem',
                                                color: '#888',
                                                margin: 0,
                                                fontFamily: '"Rajdhani", sans-serif',
                                            }}>
                                                Last played: {new Date(player.lastPlayed).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Stats */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '40px',
                                            alignItems: 'center',
                                        }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{
                                                    fontSize: '2.5rem',
                                                    color: '#FFD700',
                                                    margin: 0,
                                                    fontWeight: 'bold',
                                                    fontFamily: '"Orbitron", sans-serif',
                                                }}>
                                                    {player.totalGoals}
                                                </p>
                                                <p style={{
                                                    fontSize: '1rem',
                                                    color: '#666',
                                                    margin: '5px 0 0 0',
                                                    fontFamily: '"Rajdhani", sans-serif',
                                                }}>
                                                    Total Goals
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{
                                                    fontSize: '2.5rem',
                                                    color: '#10b981',
                                                    margin: 0,
                                                    fontWeight: 'bold',
                                                    fontFamily: '"Orbitron", sans-serif',
                                                }}>
                                                    {player.bestScore}
                                                </p>
                                                <p style={{
                                                    fontSize: '1rem',
                                                    color: '#666',
                                                    margin: '5px 0 0 0',
                                                    fontFamily: '"Rajdhani", sans-serif',
                                                }}>
                                                    Best Score
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{
                                                    fontSize: '2.5rem',
                                                    color: '#4169E1',
                                                    margin: 0,
                                                    fontWeight: 'bold',
                                                    fontFamily: '"Orbitron", sans-serif',
                                                }}>
                                                    {player.matchesPlayed}
                                                </p>
                                                <p style={{
                                                    fontSize: '1rem',
                                                    color: '#666',
                                                    margin: '5px 0 0 0',
                                                    fontFamily: '"Rajdhani", sans-serif',
                                                }}>
                                                    Matches
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Back Button */}
                        <div style={{ textAlign: 'center', marginTop: '60px' }}>
                            <button
                                onClick={() => {
                                    setShowLeaderboard(false);
                                    setCurrentPage('teamSelection');
                                }}
                                style={{
                                    padding: '20px 60px',
                                    fontSize: '1.8rem',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #4169E1, #1E90FF)',
                                    color: '#fff',
                                    border: '3px solid #4169E1',
                                    borderRadius: '15px',
                                    cursor: 'pointer',
                                    fontFamily: '"Orbitron", sans-serif',
                                    boxShadow: '0 0 40px rgba(65, 105, 225, 0.6)',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 0 60px rgba(65, 105, 225, 0.8)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 0 40px rgba(65, 105, 225, 0.6)';
                                }}
                            >
                                ⚡ PLAY AGAIN
                            </button>
                        </div>
                    </div>
                ) : currentPage === 'about' ? (
                    // ABOUT PAGE
                    <div style={{
                        height: '100vh',
                        background: '#000000',
                        padding: '95px 40px 40px 40px',
                        color: '#e0e0e0',
                        overflow: 'auto',
                    }}>
                        <h1 style={{
                            fontSize: '3.5rem',
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textAlign: 'center',
                            marginBottom: '40px',
                        }}>
                            About Goal Counter
                        </h1>
                        <div style={{
                            maxWidth: '800px',
                            margin: '0 auto',
                            fontSize: '1.2rem',
                            lineHeight: '1.8',
                        }}>
                            <p>This is an IoT-powered real-time goal counting system built with:</p>
                            <ul style={{ marginLeft: '30px', marginTop: '20px' }}>
                                <li>ESP32 microcontroller with IR sensors</li>
                                <li>Node.js & Express backend with MongoDB</li>
                                <li>React frontend with real-time updates</li>
                                <li>WiFi connectivity for instant score tracking</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    // EXIT GAME / DEFAULT
                    <div style={{
                        minHeight: 'calc(100vh - 95px)',
                        background: '#0f0f0f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFD700',
                        fontSize: '2rem',
                    }}>
                        Thanks for playing! 🎮
                    </div>
                )}
        </div>
    );
}

export default App;
