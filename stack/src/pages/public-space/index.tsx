import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Heart, MessageCircle, Share2, Image, Video, X, Users, RefreshCw, Trash2, Lock } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";

interface Post {
  _id: string;
  content: string;
  image?: string;
  video?: string;
  userid: string;
  username: string;
  likes: string[];
  comments: Array<{
    commentbody: string;
    userid: string;
    username: string;
    commentedon: Date;
  }>;
  shares: number;
  postedon: Date;
}

interface PostingEligibility {
  friendCount: number;
  allowedPosts: number | string;
  todayPostsCount: number;
  remainingPosts: number | string;
  canPost: boolean;
  message: string;
  limit: number;
}

const PublicSpace = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [eligibility, setEligibility] = useState<PostingEligibility | null>(null);
  const [loadingEligibility, setLoadingEligibility] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }
    fetchPosts();
    fetchPostingEligibility();
  }, [user]);

  const fetchPostingEligibility = async () => {
    setLoadingEligibility(true);
    try {
      const res = await axiosInstance.get("/post/posting-eligibility");
      setEligibility(res.data);
    } catch (error) {
      console.error("Error fetching posting eligibility:", error);
    } finally {
      setLoadingEligibility(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await axiosInstance.get("/post/getall");
      setPosts(res.data.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Image size should be less than 100MB");
        return;
      }
      setSelectedImage(file);
      setSelectedVideo(null);
      setVideoPreview(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video size should be less than 100MB");
        return;
      }
      setSelectedVideo(file);
      setSelectedImage(null);
      setImagePreview(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !selectedImage && !selectedVideo) {
      toast.error("Please add some content, image, or video");
      return;
    }

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
      if (selectedVideo) {
        formData.append("video", selectedVideo);
      }

      const res = await axiosInstance.post("/post/create", formData);

      if (res.data.data) {
        toast.success("Post created successfully!");
        setContent("");
        setSelectedImage(null);
        setSelectedVideo(null);
        setImagePreview(null);
        setVideoPreview(null);
        fetchPosts();
        fetchPostingEligibility();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to create post";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.info("Please login to like posts");
      router.push("/auth");
      return;
    }

    try {
      const res = await axiosInstance.patch(`/post/like/${postId}`);
      if (res.data.data) {
        setPosts((prev) =>
          prev.map((post) => (post._id === postId ? res.data.data : post))
        );
      }
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const handleComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const res = await axiosInstance.post(`/post/comment/${postId}`, {
        commentbody: commentText,
      });
      if (res.data.data) {
        setPosts((prev) =>
          prev.map((post) => (post._id === postId ? res.data.data : post))
        );
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        setExpandedComments((prev) => ({ ...prev, [postId]: true }));
      }
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const res = await axiosInstance.patch(`/post/share/${postId}`);
      if (res.data.data) {
        setPosts((prev) =>
          prev.map((post) => (post._id === postId ? res.data.data : post))
        );
        toast.success("Post shared!");
      }
    } catch (error) {
      toast.error("Failed to share post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    
    try {
      const res = await axiosInstance.delete(`/post/delete/${postId}`);
      if (res.data.message) {
        toast.success("Post deleted");
        fetchPosts();
        fetchPostingEligibility();
      }
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const getPostingStatusDisplay = () => {
    if (!eligibility) return null;
    
    const { friendCount, remainingPosts, limit } = eligibility;
    
    if (friendCount === 0) {
      return {
        color: "text-red-600 bg-red-50 border-red-200",
        icon: <Lock className="w-5 h-5" />,
        title: "No Friends Yet",
        subtitle: "Add friends to start posting",
        progress: 0,
        maxProgress: 1,
      };
    }
    
    if (limit === Infinity || remainingPosts === "unlimited") {
      return {
        color: "text-green-600 bg-green-50 border-green-200",
        icon: <Users className="w-5 h-5" />,
        title: "Unlimited Posts",
        subtitle: "10+ friends - post as much as you want!",
        progress: 100,
        maxProgress: 100,
      };
    }
    
    const remaining = typeof remainingPosts === "number" ? remainingPosts : 0;
    if (remaining === 0) {
      return {
        color: "text-amber-600 bg-amber-50 border-amber-200",
        icon: <RefreshCw className="w-5 h-5" />,
        title: "Daily Limit Reached",
        subtitle: `Post again tomorrow. Add more friends for more posts!`,
        progress: 100,
        maxProgress: limit,
      };
    }
    
    return {
      color: "text-blue-600 bg-blue-50 border-blue-200",
      icon: <Users className="w-5 h-5" />,
      title: `${remaining} Post${remaining !== 1 ? "s" : ""} Remaining Today`,
      subtitle: `${friendCount} friend${friendCount !== 1 ? "s" : ""} - ${friendCount < 10 ? "Add more for more posts!" : "Unlimited!"}`,
      progress: limit - remaining,
      maxProgress: limit,
    };
  };

  if (loading) {
    return (
      <Mainlayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Mainlayout>
    );
  }

  const statusDisplay = getPostingStatusDisplay();

  return (
    <Mainlayout>
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Public Space</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPosts}
            className="text-xs sm:text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Posting Status Card */}
        {user && eligibility && statusDisplay && (
          <Card className={`mb-4 sm:mb-6 border-2 ${statusDisplay.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${statusDisplay.color.replace("text-", "bg-").replace("600", "100").replace("50", "100")}`}>
                  {statusDisplay.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm sm:text-base">{statusDisplay.title}</h3>
                  <p className="text-xs sm:text-sm opacity-80">{statusDisplay.subtitle}</p>
                </div>
                {typeof eligibility.remainingPosts === "number" && eligibility.remainingPosts > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{eligibility.remainingPosts}</div>
                    <div className="text-xs opacity-70">left today</div>
                  </div>
                )}
              </div>
              {eligibility.limit !== Infinity && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${statusDisplay.color.includes("red") ? "bg-red-500" : statusDisplay.color.includes("green") ? "bg-green-500" : statusDisplay.color.includes("amber") ? "bg-amber-500" : "bg-blue-500"}`}
                      style={{ width: `${(statusDisplay.progress / statusDisplay.maxProgress) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {statusDisplay.progress}/{statusDisplay.maxProgress} posts used today
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Post Creation Card */}
        {user && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                  <AvatarFallback className="text-sm sm:text-base">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base sm:text-lg">{user.name}</CardTitle>
                  <p className="text-xs sm:text-sm text-gray-500">Share something with the community</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 sm:pt-2">
              <Textarea
                placeholder="What's on your mind? Share pictures, videos, or just your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mb-4 min-h-[100px] text-sm sm:text-base"
                disabled={eligibility?.friendCount === 0}
              />

              {(imagePreview || videoPreview) && (
                <div className="relative mb-4">
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-96 rounded-lg object-cover"
                      />
                      <button
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {videoPreview && (
                    <div className="relative">
                      <video
                        src={videoPreview}
                        controls
                        className="max-w-full max-h-96 rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setSelectedVideo(null);
                          setVideoPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={eligibility?.friendCount === 0}
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                    disabled={eligibility?.friendCount === 0}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={eligibility?.friendCount === 0 || !!selectedVideo}
                    className="text-xs sm:text-sm"
                  >
                    <Image className="w-4 h-4 mr-1" />
                    Photo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={eligibility?.friendCount === 0 || !!selectedImage}
                    className="text-xs sm:text-sm"
                  >
                    <Video className="w-4 h-4 mr-1" />
                    Video
                  </Button>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={
                    eligibility?.friendCount === 0 ||
                    eligibility?.remainingPosts === 0 ||
                    isCreating ||
                    (!content.trim() && !selectedImage && !selectedVideo)
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                >
                  {isCreating ? "Posting..." : "Post"}
                </Button>
              </div>

              {eligibility?.friendCount === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <Lock className="w-5 h-5 mx-auto mb-2 text-red-500" />
                  <p className="text-sm text-red-700 font-medium">
                    You need at least 1 friend to post
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Visit the Users page to add friends and start posting!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Posts Feed */}
        <div className="space-y-4 sm:space-y-6">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 px-4 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No posts yet</h3>
                <p className="text-sm text-gray-500">Be the first to share something with the community!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post._id} className="overflow-hidden">
                {/* Post Header */}
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                        <AvatarFallback className="text-sm sm:text-base">
                          {post.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base sm:text-lg">{post.username}</CardTitle>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {new Date(post.postedon).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {user?._id === post.userid && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post._id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6">
                  {/* Post Content */}
                  {post.content && (
                    <p className="mb-3 sm:mb-4 text-gray-800 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                      {post.content}
                    </p>
                  )}

                  {/* Post Media */}
                  {post.image && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${post.image}`}
                        alt="Post image"
                        className="max-w-full rounded-lg"
                      />
                    </div>
                  )}

                  {post.video && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <video
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${post.video}`}
                        controls
                        className="max-w-full rounded-lg"
                      />
                    </div>
                  )}

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 sm:gap-6 mt-4 pt-4 border-t text-sm">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        user && post.likes.includes(user._id)
                          ? "text-red-500"
                          : "text-gray-600 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          user && post.likes.includes(user._id) ? "fill-current" : ""
                        }`}
                      />
                      <span>{post.likes.length} {post.likes.length === 1 ? "like" : "likes"}</span>
                    </button>

                    <button
                      onClick={() =>
                        setExpandedComments((prev) => ({
                          ...prev,
                          [post._id]: !prev[post._id],
                        }))
                      }
                      className="flex items-center gap-1.5 text-gray-600 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}</span>
                    </button>

                    <button
                      onClick={() => handleShare(post._id)}
                      className="flex items-center gap-1.5 text-gray-600 hover:text-green-500 transition-colors"
                    >
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{post.shares} shares</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[post._id] && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {post.comments.length > 0 ? (
                        <div className="space-y-3">
                          {post.comments.map((comment, idx) => (
                            <div key={idx} className="flex gap-3">
                              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                                <AvatarFallback className="text-xs sm:text-sm">
                                  {comment.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                                  <p className="font-medium text-xs sm:text-sm text-gray-900">{comment.username}</p>
                                  <p className="text-xs sm:text-sm text-gray-700 break-words">{comment.commentbody}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 px-1">
                                  {comment.commentedon ? new Date(comment.commentedon).toLocaleString() : "Just now"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                      )}

                      {user && (
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Write a comment..."
                            value={commentInputs[post._id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post._id]: e.target.value,
                              }))
                            }
                            className="flex-1 min-h-[60px] text-sm resize-none"
                          />
                          <Button
                            onClick={() => handleComment(post._id)}
                            size="sm"
                            className="self-end bg-blue-600 hover:bg-blue-700 text-sm"
                            disabled={!commentInputs[post._id]?.trim()}
                          >
                            Comment
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Comment Input (when comments not expanded) */}
                  {!expandedComments[post._id] && user && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Write a quick comment..."
                          value={commentInputs[post._id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [post._id]: e.target.value,
                            }))
                          }
                          className="flex-1 min-h-[50px] text-sm resize-none"
                          onFocus={() => setExpandedComments((prev) => ({ ...prev, [post._id]: true }))}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Mainlayout>
  );
};

export default PublicSpace;
