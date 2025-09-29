'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

const EnhancedAuthPanel = () => {
  const { data: session, status } = useSession();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (status === 'loading') {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 min-w-[240px] animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-300 rounded mb-2"></div>
            <div className="h-2 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-xl shadow-lg border border-gray-200 min-w-[240px] transition-all duration-300 ${
      isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
    }`}>
      {session?.user ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            {session.user.image && (
              <div className="relative">
                <img 
                  src={session.user.image} 
                  alt="User avatar" 
                  className="w-10 h-10 rounded-full border-2 border-green-200 shadow-sm"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Signed in as
              </div>
              <div className="text-sm font-semibold text-gray-900 truncate">
                {session.user.name || session.user.email}
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => signOut()}
              className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Sign in to save your flows and access advanced features
            </p>
          </div>
          
          <button
            onClick={() => signIn('github')}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
            Sign in with GitHub
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedAuthPanel;