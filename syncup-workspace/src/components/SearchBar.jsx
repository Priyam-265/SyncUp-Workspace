import React, { useState, useEffect, useRef, useMemo } from 'react';
import { userAPI } from '../services/api';
import { Search, Loader, X, Hash, User, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

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

const SearchBar = ({ channels = [], users = [], workspaceId: propWorkspaceId }) => {
  const [query, setQuery] = useState('');
  const [apiUsers, setApiUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const { workspaceId: paramWorkspaceId } = useParams();
  const searchRef = useRef(null);

  const wsId = propWorkspaceId || paramWorkspaceId;

  // Filter channels locally from props
  const filteredChannels = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return channels.filter(ch =>
      ch.name && ch.name.toLowerCase().includes(q)
    );
  }, [debouncedQuery, channels]);

  // Filter workspace members locally from props
  const filteredLocalUsers = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return users.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  }, [debouncedQuery, users]);

  // Also search users via API for broader results
  useEffect(() => {
    if (debouncedQuery.trim()) {
      setIsLoading(true);
      userAPI.search(debouncedQuery).then(data => {
        setApiUsers(Array.isArray(data) ? data : []);
        setIsLoading(false);
      }).catch(err => {
        console.error(err);
        setApiUsers([]);
        setIsLoading(false);
      });
    } else {
      setApiUsers([]);
    }
  }, [debouncedQuery]);

  // Merge local users and API users, deduplicating by id
  const mergedUsers = useMemo(() => {
    const seen = new Set();
    const result = [];
    
    // Local users first (workspace members)
    for (const u of filteredLocalUsers) {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        result.push({ _id: u.id, fullName: u.name, avatar: u.avatar, status: u.status });
      }
    }
    
    // API users (may include users outside workspace)
    for (const u of apiUsers) {
      if (!seen.has(u._id)) {
        seen.add(u._id);
        result.push(u);
      }
    }
    
    return result;
  }, [filteredLocalUsers, apiUsers]);

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

  const hasResults = filteredChannels.length > 0 || mergedUsers.length > 0;

  return (
    <div className="relative w-full max-w-xs" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search channels & people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white pl-10 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10 max-h-80 overflow-y-auto">
          {isLoading && mergedUsers.length === 0 && filteredChannels.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <Loader className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          ) : hasResults ? (
            <div>
              {/* Channel Results */}
              {filteredChannels.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase px-2 mb-1">Channels</h3>
                  <ul>
                    {filteredChannels.map(channel => (
                      <li
                        key={`ch-${channel._id}`}
                        onClick={() => handleResultClick(`/dashboard/${wsId}/channel/${channel._id}`)}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        {channel.isPrivate ? (
                          <Lock className="w-4 h-4 text-slate-500" />
                        ) : (
                          <Hash className="w-4 h-4 text-slate-500" />
                        )}
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{channel.name}</span>
                        {channel.members && (
                          <span className="text-xs text-slate-400 ml-auto">{channel.members.length} members</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* User Results */}
              {mergedUsers.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase px-2 mb-1">People</h3>
                  <ul>
                    {mergedUsers.map(user => (
                      <li
                        key={`usr-${user._id}`}
                        onClick={() => handleResultClick(`/dashboard/${wsId}/dm/${user._id}`)}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                          {user.avatar || (user.fullName || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block truncate">
                            {user.fullName || user.email}
                          </span>
                        </div>
                        {user.status && (
                          <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : user.status === 'away' ? 'bg-yellow-500' : 'bg-slate-400'}`} />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="p-4 text-sm text-slate-500">No results found for "{query}"</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
