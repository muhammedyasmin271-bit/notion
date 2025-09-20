import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send, User, CheckSquare, Target, FileText, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';

const CommentsPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'John Doe',
      content: 'Great progress on the project! The new features look amazing.',
      timestamp: new Date('2024-01-15T10:30:00'),
      replies: []
    },
    {
      id: 2,
      author: 'Jane Smith',
      content: 'I have some suggestions for the UI improvements. Can we schedule a meeting?',
      timestamp: new Date('2024-01-15T14:20:00'),
      replies: [
        {
          id: 21,
          author: 'Mike Johnson',
          content: 'Sure! How about tomorrow at 2 PM?',
          timestamp: new Date('2024-01-15T15:00:00')
        }
      ]
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showQuickNav, setShowQuickNav] = useState(false);

  const addComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        author: user?.name || 'Anonymous',
        content: newComment.trim(),
        timestamp: new Date(),
        replies: []
      };
      setComments([comment, ...comments]);
      setNewComment('');
    }
  };

  const addReply = (commentId) => {
    if (replyText.trim()) {
      const reply = {
        id: Date.now(),
        author: user?.name || 'Anonymous',
        content: replyText.trim(),
        timestamp: new Date()
      };
      setComments(comments.map(comment =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      ));
      setReplyText('');
      setReplyTo(null);
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-black text-gray-100' : 'bg-white text-black'} min-h-screen font-sans`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold">Comments</h1>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowQuickNav(!showQuickNav)}
              className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'text-gray-400 hover:bg-gray-800/60' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Menu className="w-4 h-4" />
            </button>
            {showQuickNav && (
              <div className={`absolute right-0 top-12 w-48 rounded-lg shadow-lg border z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="py-2">
                  <button onClick={() => { navigate('/tasks'); setShowQuickNav(false); }} className={`w-full px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center gap-2`}>
                    <CheckSquare className="w-4 h-4" />Tasks
                  </button>
                  <button onClick={() => { navigate('/comments'); setShowQuickNav(false); }} className={`w-full px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center gap-2`}>
                    <MessageSquare className="w-4 h-4" />Comments
                  </button>
                  <button onClick={() => { navigate('/goals'); setShowQuickNav(false); }} className={`w-full px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center gap-2`}>
                    <Target className="w-4 h-4" />Goals
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Comment */}
        <div className={`${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white/70 border-gray-200/50'} backdrop-blur-sm p-6 rounded-2xl border shadow-lg mb-6`}>
          <h2 className="text-xl font-semibold mb-4">Add Comment</h2>
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className={`w-full p-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                rows="3"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className={`${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white/70 border-gray-200/50'} backdrop-blur-sm p-6 rounded-2xl border shadow-lg`}>
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {comment.author.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{comment.author}</span>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {comment.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="mb-3">{comment.content}</p>
                  <button
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    Reply
                  </button>

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className={`flex gap-3 pl-4 border-l-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {reply.author.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{reply.author}</span>
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {reply.timestamp.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyTo === comment.id && (
                    <div className="mt-4 flex gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {(user?.name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className={`w-full p-2 rounded border resize-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          rows="2"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setReplyTo(null)}
                            className={`px-3 py-1 text-sm rounded ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => addReply(comment.id)}
                            disabled={!replyText.trim()}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
};

export default CommentsPage;