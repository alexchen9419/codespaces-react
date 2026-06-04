import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  apiFriendsList,
  apiFriendsPending,
  apiFriendRequest,
  apiFriendAccept,
  apiFriendRemove,
  apiUserSearch,
} from '../api/friends';
import { useNavigate } from 'react-router-dom';

function Avatar({ name, src }) {
  if (src) return <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover" />;
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

export default function FriendsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('friends'); // friends | requests | search
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const [f, p] = await Promise.all([apiFriendsList(), apiFriendsPending()]);
    if (f.success) setFriends(f.data);
    if (p.success) setPending(p.data);
  };

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchQ.trim() === '') { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const d = await apiUserSearch(searchQ.trim());
      if (d.success) setSearchResults(d.data);
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  const handleAccept = async (friendship_id) => {
    const d = await apiFriendAccept(friendship_id);
    if (d.success) loadAll();
  };

  const handleRemove = async (friendship_id) => {
    await apiFriendRemove(friendship_id);
    loadAll();
  };

  const handleRequest = async (receiver_id) => {
    const r = await apiFriendRequest(receiver_id);
    if (r.success) {
      const d = await apiUserSearch(searchQ.trim());
      if (d.success) setSearchResults(d.data);
    }
  };

  return (
    <Layout>
      <h2 className="text-xl font-bold mb-4">Friends</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'friends', label: `Friends (${friends.length})` },
          { key: 'requests', label: `Requests (${pending.length})` },
          { key: 'search', label: 'Find People' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
        </div>
      ) : (
        <>
          {/* Friends list */}
          {tab === 'friends' && (
            <div className="space-y-3">
              {friends.length === 0 ? (
                <p className="text-gray-400 text-center py-12">No friends yet. Search for people!</p>
              ) : (
                friends.map((f) => (
                  <div key={f.id} className="bg-gray-800 rounded-xl p-4 flex items-center gap-3">
                    <Avatar src={f.avatar_path} name={f.username} />
                    <div className="flex-1">
                      <p className="font-semibold text-white">{f.username}</p>
                      {f.bio && <p className="text-xs text-gray-400 truncate">{f.bio}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/chat/${f.id}`)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Message
                      </button>
                      <button
                        onClick={() => handleRemove(f.friendship_id)}
                        className="bg-gray-700 hover:bg-red-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pending requests */}
          {tab === 'requests' && (
            <div className="space-y-3">
              {pending.length === 0 ? (
                <p className="text-gray-400 text-center py-12">No pending requests</p>
              ) : (
                pending.map((f) => (
                  <div key={f.friendship_id} className="bg-gray-800 rounded-xl p-4 flex items-center gap-3">
                    <Avatar src={f.avatar_path} name={f.username} />
                    <div className="flex-1">
                      <p className="font-semibold text-white">{f.username}</p>
                      <p className="text-xs text-gray-400">Wants to be your friend</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(f.friendship_id)}
                        className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRemove(f.friendship_id)}
                        className="bg-gray-700 hover:bg-red-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Search */}
          {tab === 'search' && (
            <div className="space-y-3">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="輸入用戶名搜尋..."
                autoFocus
                className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searching && <p className="text-gray-400 text-sm text-center">Searching...</p>}
              {!searching && searchQ.trim() !== '' && searchResults.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-6">找不到用戶「{searchQ}」</p>
              )}
              {searchResults.map((u) => (
                <div key={u.id} className="bg-gray-800 rounded-xl p-4 flex items-center gap-3">
                  <Avatar src={u.avatar_path} name={u.username} />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{u.username}</p>
                    {u.friendship_status === 'accepted' && (
                      <p className="text-xs text-green-400">Already friends</p>
                    )}
                    {u.friendship_status === 'pending' && (
                      <p className="text-xs text-yellow-400">Request sent</p>
                    )}
                  </div>
                  {!u.friendship_status && (
                    <button
                      onClick={() => handleRequest(u.id)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Add Friend
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
