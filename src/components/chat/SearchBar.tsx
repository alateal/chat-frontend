import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import debounce from 'lodash/debounce';

const API_URL = import.meta.env.VITE_API_URL;

interface SearchResult {
  messages: Array<{
    id: string;
    content: string;
    created_at: string;
    channel_id?: string;
    conversation_id?: string;
    user: {
      id: string;
      username: string;
      imageUrl: string;
    };
  }>;
  users: Array<{
    id: string;
    username: string;
    imageUrl: string;
  }>;
  files: Array<{
    id: string;
    file_name: string;
    file_url: string;
  }>;
  channels: Array<{
    id: string;
    name: string;
    created_at: string;
    creator: {
      id: string;
      username: string;
      imageUrl: string;
    };
  }>;
}

const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Failed to fetch after retries');
};

const SearchBar = () => {
  const { getToken } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 1) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetchWithRetry(
        `${API_URL}/api/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      setResults(data);
      setError(null);
    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof Error && error.message.includes('authentication')) {
        setError(error.message);
      }
      setResults({
        messages: [],
        users: [],
        files: [],
        channels: []
      });
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsLoading(true);
    setShowResults(true);
    debouncedSearch(value);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search messages, files, and people..."
          className="w-full px-4 py-2 pl-10 bg-base-100 rounded-lg border border-base-300 
            focus:outline-none focus:border-primary transition-colors duration-200"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="loading loading-spinner loading-sm"></div>
          </div>
        )}
        {error && (
          <div className="absolute top-full mt-2 w-full p-2 bg-error/10 text-error rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results && (query.length >= 1) && (
        <div className="absolute top-full mt-2 w-full bg-base-100 rounded-lg shadow-xl 
          border border-base-300 max-h-96 overflow-y-auto z-50">
          {/* Messages Section - Always show */}
          <div className="p-2 border-b border-base-300">
            <h3 className="text-sm font-semibold text-base-content/70 px-2 py-1">
              Messages
            </h3>
            {results.messages.length > 0 ? (
              results.messages.map((message) => (
                <div
                  key={message.id}
                  className="p-2 hover:bg-base-200 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={message.user.imageUrl}
                      alt={message.user.username}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="font-medium">{message.user.username}</span>
                  </div>
                  <p className="ml-8 text-sm text-base-content/70 line-clamp-2">
                    {message.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-base-content/50 px-2 py-1">
                No messages found
              </p>
            )}
          </div>

          {/* Files Section - Always show */}
          <div className="p-2 border-b border-base-300">
            <h3 className="text-sm font-semibold text-base-content/70 px-2 py-1">
              Files
            </h3>
            {results.files.length > 0 ? (
              results.files.map((file) => (
                <a
                  key={file.id}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-lg"
                >
                  <svg
                    className="w-4 h-4 text-base-content/50"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm">{file.file_name}</span>
                </a>
              ))
            ) : (
              <p className="text-sm text-base-content/50 px-2 py-1">
                No files found
              </p>
            )}
          </div>

          {/* People Section - Always show */}
          <div className="p-2 border-b border-base-300">
            <h3 className="text-sm font-semibold text-base-content/70 px-2 py-1">
              People
            </h3>
            {query.length >= 3 ? (
              results.users.length > 0 ? (
                results.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-lg cursor-pointer"
                  >
                    <img
                      src={user.imageUrl}
                      alt={user.username}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm">{user.username}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-base-content/50 px-2 py-1">
                  No people found
                </p>
              )
            ) : (
              <p className="text-sm text-base-content/50 px-2 py-1">
                Type at least 3 characters to search for people
              </p>
            )}
          </div>

          {/* Channels Section - Always show */}
          <div className="p-2">
            <h3 className="text-sm font-semibold text-base-content/70 px-2 py-1">
              Channels
            </h3>
            {results.channels.length > 0 ? (
              results.channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-lg cursor-pointer"
                >
                  <span className="text-base-content/70">#</span>
                  <div className="flex-1">
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-xs text-base-content/50">
                      Created by {channel.creator.username}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-base-content/50 px-2 py-1">
                No channels found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar; 