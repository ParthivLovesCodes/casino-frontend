// src/components/Login.jsx
import React, { useState } from 'react';

// 1. ADDED: Grabs your live Render link from the .env file
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 2. CHANGED: Now uses the BACKEND_URL variable instead of localhost
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // 1. Save the token to the browser so they stay logged in!
      localStorage.setItem('casinoToken', data.token);
      
      // 2. Pass the user data back up to App.jsx to unlock the game
      onLoginSuccess(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex items-center justify-center p-4">
      <div className="bg-[#0a2e1d] p-8 rounded-2xl shadow-2xl border border-green-900 w-full max-w-sm">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-widest uppercase">7 Up 7 Down</h2>
          <p className="text-green-500 text-sm mt-1 font-bold">VIP CASINO ENTRANCE</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-4 text-sm text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-green-400 text-xs font-bold mb-1 uppercase tracking-wider">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#051c11] text-white border border-green-800 rounded-lg p-3 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-green-400 text-xs font-bold mb-1 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#051c11] text-white border border-green-800 rounded-lg p-3 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black font-black uppercase tracking-widest py-3 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all transform active:scale-95 disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Authenticating...' : 'Enter Casino'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;