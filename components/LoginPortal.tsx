import React, { useState } from 'react';
import { UserRole } from '../types';
import { Library, User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

interface LoginPortalProps {
  onLogin: (role: UserRole, username: string) => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>(UserRole.STUDENT);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      if (activeTab === UserRole.ADMIN) {
        if (password === 'admin') {
          onLogin(UserRole.ADMIN, username || 'Admin');
        } else {
          setError('Invalid Admin credentials. (Hint: password is "admin")');
          setIsLoading(false);
        }
      } else {
        // Allow any student login for demo
        if (username.trim().length > 0) {
          onLogin(UserRole.STUDENT, username);
        } else {
          setError('Please enter your Student ID.');
          setIsLoading(false);
        }
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center animate-fade-in">
        <div className="mx-auto bg-indigo-600 p-3 rounded-xl w-16 h-16 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
          <Library className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Kiet Library</h1>
        <p className="text-slate-500 mt-2">Smart Management System</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => { setActiveTab(UserRole.STUDENT); setError(''); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
              activeTab === UserRole.STUDENT ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User size={18} />
              Student Portal
            </div>
            {activeTab === UserRole.STUDENT && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
            )}
          </button>
          <button
            onClick={() => { setActiveTab(UserRole.ADMIN); setError(''); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
              activeTab === UserRole.ADMIN ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
             <div className="flex items-center justify-center gap-2">
              <ShieldCheck size={18} />
              Admin Portal
            </div>
            {activeTab === UserRole.ADMIN && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
            )}
          </button>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {activeTab === UserRole.STUDENT ? 'Student ID' : 'Admin Username'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder={activeTab === UserRole.STUDENT ? 'e.g. S1024' : 'e.g. admin'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••"
              />
              {activeTab === UserRole.ADMIN && (
                <p className="text-xs text-slate-400 mt-1">For demo, use password: <strong>admin</strong></p>
              )}
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verifying...
                </>
              ) : (
                <>
                  Login to Portal
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-sm">
        © 2024 Kiet Group of Institutions. All rights reserved.
      </p>
    </div>
  );
};