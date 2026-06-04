import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import FeedPost from '../components/FeedPost';
import { useAuth } from '../hooks/useAuth';
import { apiFeedList } from '../api/feed';

export default function ProfilePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFeedList()
      .then((d) => {
        if (d.success) {
          setPosts(d.data.filter((p) => p.user_id === user?.id));
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <Layout>
      {/* Profile card */}
      <div className="bg-gray-800 rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white shrink-0">
          {user.avatar_path ? (
            <img src={user.avatar_path} alt={user.username} className="w-full h-full rounded-full object-cover" />
          ) : (
            user.username[0].toUpperCase()
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{user.username}</h2>
          <p className="text-gray-400 text-sm">{user.email}</p>
          {user.bio && <p className="text-gray-300 mt-2 text-sm">{user.bio}</p>}
          <p className="text-gray-500 text-xs mt-2">
            Joined {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* User's posts */}
      <h3 className="text-lg font-bold mb-4">Your Posts</h3>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-gray-400 py-12">You haven&apos;t posted anything yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <FeedPost key={p.id} post={p} />
          ))}
        </div>
      )}
    </Layout>
  );
}
