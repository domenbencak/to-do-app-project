import Post from "../models/Post.js";

// Get all posts (public - no authentication required)
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 }); // Sort by newest first
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error: error.message });
  }
};

// Create a new post (requires authentication)
export const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = new Post({ 
      title, 
      content, 
      author: req.user._id 
    });
    const savedPost = await post.save();
    const populatedPost = await Post.findById(savedPost._id).populate('author', 'username');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(400).json({ message: "Error creating post", error: error.message });
  }
};

// Update a post (only by author)
export const updatePost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      { title, content },
      { new: true }
    ).populate('author', 'username');
    
    if (!post) {
      return res.status(404).json({ message: "Post not found or you don't have permission to edit it" });
    }
    
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: "Error updating post", error: error.message });
  }
};

// Delete a post (only by author)
export const deletePost = async (req, res) => {
  try {
    const deletedPost = await Post.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id,
    });
    
    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found or you don't have permission to delete it" });
    }
    
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting post", error: error.message });
  }
};

// Like a post
export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Check if user already liked the post
    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "You have already liked this post" });
    }
    
    // Remove from dislikes if present
    post.dislikes = post.dislikes.filter(id => !id.equals(userId));
    
    // Add to likes
    post.likes.push(userId);
    await post.save();
    
    const updatedPost = await Post.findById(postId).populate('author', 'username');
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: "Error liking post", error: error.message });
  }
};

// Dislike a post
export const dislikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Check if user already disliked the post
    if (post.dislikes.includes(userId)) {
      return res.status(400).json({ message: "You have already disliked this post" });
    }
    
    // Remove from likes if present
    post.likes = post.likes.filter(id => !id.equals(userId));
    
    // Add to dislikes
    post.dislikes.push(userId);
    await post.save();
    
    const updatedPost = await Post.findById(postId).populate('author', 'username');
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: "Error disliking post", error: error.message });
  }
};

// Remove like/dislike from a post
export const removeReaction = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Remove from both likes and dislikes
    post.likes = post.likes.filter(id => !id.equals(userId));
    post.dislikes = post.dislikes.filter(id => !id.equals(userId));
    
    await post.save();
    
    const updatedPost = await Post.findById(postId).populate('author', 'username');
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: "Error removing reaction", error: error.message });
  }
};
