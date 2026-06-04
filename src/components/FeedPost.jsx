import { useState } from 'react';
import { apiFeedLike, apiFeedComment } from '../api/feed';
import { useAuth } from '../hooks/useAuth';

function Avatar({ src, name, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  if (src) return <img src={src} alt={name} className={`${dim} rounded-full object-cover`} />;
  return (
    <div className={`${dim} rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

export default function FeedPost({ post: initialPost }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    const d = await apiFeedLike(post.id);
    if (d.success) {
      setPost((p) => ({
        ...p,
        liked_by_me: d.data.liked,
        like_count: d.data.count,
      }));
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const d = await apiFeedComment(post.id, commentText.trim());
    if (d.success) {
      setPost((p) => ({
        ...p,
        comments: [...p.comments, d.data],
        comment_count: p.comment_count + 1,
      }));
      setCommentText('');
    }
    setSubmitting(false);
  };

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar src={post.avatar_path} name={post.username} size="md" />
        <div>
          <p className="font-semibold text-white">{post.username}</p>
          <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-100 whitespace-pre-wrap">{post.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-sm transition-colors ${
            post.liked_by_me ? 'text-rose-400' : 'text-gray-400 hover:text-rose-400'
          }`}
        >
          <span>{post.liked_by_me ? '❤️' : '🤍'}</span>
          <span>{post.like_count}</span>
        </button>

        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-400 transition-colors"
        >
          <span>💬</span>
          <span>{post.comment_count}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="space-y-2 pt-2 border-t border-gray-700">
          {post.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar src={c.avatar_path} name={c.username} size="sm" />
              <div className="bg-gray-700 rounded-lg px-3 py-2 flex-1">
                <span className="text-xs font-semibold text-indigo-400 mr-2">{c.username}</span>
                <span className="text-sm text-gray-200">{c.body}</span>
              </div>
            </div>
          ))}

          <form onSubmit={handleComment} className="flex gap-2 mt-2">
            <Avatar src={user?.avatar_path} name={user?.username} size="sm" />
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 rounded-lg text-sm disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
