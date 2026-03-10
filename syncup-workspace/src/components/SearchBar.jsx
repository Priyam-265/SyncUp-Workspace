import React, { useState, useEffect, useRef } from 'react';
import { searchApi } from '../services/api';
import { Search, Loader, X, Hash, User, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ channels: [], users: [], messages: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    if (debouncedQuery) {
      setIsLoading(true);
      searchApi(debouncedQuery).then(data => {
        setResults(data);
        setIsLoading(false);
      });
    } else {
      setResults({ channels: [], users: [], messages: [] });
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleResultClick = (path) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-xs" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : (
            (results.channels.length > 0 || results.users.length > 0 || results.messages.length > 0) ? (
              <div>
                {results.channels.length > 0 && (
                  <div className="p-2">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase px-2 mb-1">Channels</h3>
                    <ul>
                      {results.channels.map(channel => (
                        <li key={`ch-${channel.id}`} onClick={() => handleResultClick(`/dashboard/1/channel/${channel.id}`)} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                          <Hash className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{channel.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.users.length > 0 && (
                  <div className="p-2">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase px-2 mb-1">Users</h3>
                    <ul>
                      {results.users.map(user => (
                        <li key={`usr-${user.id}`} onClick={() => handleResultClick(`/dm/${user.id}`)} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                          <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.messages.length > 0 && (
                  <div className="p-2">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase px-2 mb-1">Messages</h3>
                    <ul>
                      {results.messages.map(message => (
                        <li key={`msg-${message.id}`} onClick={() => handleResultClick(`/dashboard/1/channel/${message.channelId}`)} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                          <MessageSquare className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{message.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              query && <p className="p-4 text-sm text-slate-500">No results found for "{query}"</p>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
