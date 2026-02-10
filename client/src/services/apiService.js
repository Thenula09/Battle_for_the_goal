// client/src/services/apiService.js
const API_URL = 'http://localhost:5001/api/scores'; // ✅ Fixed: Server runs on port 5001
const GAME_STATE_URL = 'http://localhost:5001/api/game-state'; // Game state API
const MATCH_URL = 'http://localhost:5001/api/matches'; // 🏆 Tournament API

export const getScores = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Returns an array: [{ name: 'Team A', score: 0, _id: '...' }, ...]
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching scores:', error);
        return []; // Return empty array on error
    }
};

// Update game state (isRunning: true/false)
export const updateGameState = async (isRunning) => {
    try {
        const response = await fetch(GAME_STATE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isRunning }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating game state:', error);
        return null;
    }
};

// 🏆 Save match result
export const saveMatchResult = async (matchData) => {
    try {
        const response = await fetch(MATCH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(matchData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error saving match result:', error);
        return null;
    }
};

// 🏆 Get leaderboard
export const getLeaderboard = async () => {
    try {
        const response = await fetch(`${MATCH_URL}/leaderboard`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
};

// 🏆 Get match count
export const getMatchCount = async () => {
    try {
        const response = await fetch(`${MATCH_URL}/count`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.count;
    } catch (error) {
        console.error('Error fetching match count:', error);
        return 0;
    }
};

// 🔄 Reset all scores to 0
export const resetScores = async () => {
    try {
        const response = await fetch('http://localhost:5001/api/goals/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error resetting scores:', error);
        return null;
    }
};


