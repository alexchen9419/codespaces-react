import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import FeedPost from '../components/FeedPost';
import { apiFeedList, apiFeedPost } from '../api/feed';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = () =>
    apiFeedList().then((d) => {
      if (d.success) setPosts(d.data);
    });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() || posting) return;
    setPosting(true);
    const d = await apiFeedPost(content.trim());
    if (d.success) {
      setPosts((prev) => [d.data, ...prev]);
      setContent('');
    }
    setPosting(false);
  };

  return (
    <Layout>
      <h2 className="text-xl font-bold mb-4">Feed</h2>

      {/* Create post */}
      <form onSubmit={handlePost} className="bg-gray-800 rounded-xl p-4 mb-6 space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          className="w-full bg-gray-700 text-gray-100 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={posting || !content.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">👥</p>
          <p className="text-white font-semibold">還沒有動態</p>
          <p className="text-gray-400 text-sm">
            Feed 顯示你與好友的貼文。先去
            <Link to="/friends" className="text-indigo-400 hover:underline mx-1">加好友</Link>
            再來看動態！
          </p>
        </div>
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
