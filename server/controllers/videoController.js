const { v4: uuidv4 } = require('uuid');
const Video = require('../models/Video');
const User = require('../models/User');
const Like = require('../models/Like');
const { getAvatarUrl, formatDateBR } = require('../utils/display');

const escapeRegex = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const buildRandomThumbnail = (videoUrl, duration) => {
  if (!videoUrl || !videoUrl.includes('/upload/')) {
    return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000';
  }

  const [minutes, seconds] = String(duration || '').split(':').map(Number);
  const totalSeconds = Number.isFinite(minutes) && Number.isFinite(seconds)
    ? (minutes * 60) + seconds
    : 10;
  const maxSample = Math.max(1, Math.min(totalSeconds - 1, 10));
  const sampleSecond = Math.max(0, Math.floor(Math.random() * maxSample));

  return videoUrl.replace('/upload/', `/upload/so_${sampleSecond},f_jpg/`);
};

/**
 * Controller for video-related operations
 */

const getVideos = async (req, res) => {
  try {
    const { category, sort, search, status, userId, withStats, page = 1, limit = 12 } = req.query;

    let query = { deletedAt: null };
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    if (status) {
      query.status = status;
    } else if (userId) {
      query.uploaderId = userId;
      // Only show private/draft if the authenticated requester is the owner
      const isOwner = req.user && req.user.id === userId;
      if (!isOwner) {
        query.status = 'public';
      }
    } else {
      query.status = { $in: ['public', null, undefined] };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } }
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'views') sortObj = { views: -1 };

    // Single aggregation — match + lookup uploader + optional stats.
    const match = { ...query };
    const pipeline = [
      { $match: match },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'users',
          localField: 'uploaderId',
          foreignField: 'id',
          as: 'uploader',
        },
      },
      { $unwind: { path: '$uploader', preserveNullAndEmptyArrays: true } },
    ];

    if (withStats === 'true') {
      pipeline.push(
        {
          $lookup: {
            from: 'likes',
            let: { vid: '$id' },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ['$videoId', '$$vid'] }, { $eq: ['$type', 'like'] }] } } },
              { $count: 'n' },
            ],
            as: 'likeAgg',
          },
        },
        {
          $lookup: {
            from: 'comments',
            let: { vid: '$id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$videoId', '$$vid'] } } },
              { $count: 'n' },
            ],
            as: 'commentAgg',
          },
        },
      );
    }

    const withStatsFlag = withStats === 'true';

    pipeline.push({
      $project: {
        _id: 0,
        id: 1,
        title: 1,
        description: 1,
        url: 1,
        thumbnail: 1,
        uploaderId: 1,
        views: 1,
        category: 1,
        tags: 1,
        status: 1,
        duration: 1,
        createdAt: 1,
        updatedAt: 1,
        userId: '$uploaderId',
        channel: { $ifNull: ['$uploader.username', 'Unknown'] },
        channelAvatar: {
          $ifNull: [
            '$uploader.profilePicture',
            { $ifNull: ['$uploader.avatar', '/assets/default-avatar.svg'] },
          ],
        },
        viewsCount: '$views',
        likes: { $literal: 0 },
        ...(withStatsFlag
          ? {
              likeCount: { $ifNull: [{ $arrayElemAt: ['$likeAgg.n', 0] }, 0] },
              commentCount: { $ifNull: [{ $arrayElemAt: ['$commentAgg.n', 0] }, 0] },
            }
          : {}),
      },
    });

    const [total, aggVideos] = await Promise.all([
      Video.countDocuments(query),
      Video.aggregate(pipeline),
    ]);

    const videos = aggVideos.map((v) => ({
      ...v,
      views: `${v.views} views`,
      timestamp: formatDateBR(v.createdAt),
    }));

    res.json({ videos, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json([]);

    const escaped = escapeRegex(q.trim());
    const videos = await Video.find({
      title: { $regex: escaped, $options: 'i' },
      status: 'public',
      deletedAt: null
    }).limit(10).select('title');

    res.json(videos.map(v => v.title));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadVideo = async (req, res) => {
  try {
    const { title, description, category, status, duration } = req.body;
    const userId = req.user.id;

    const videoFile = req.files['video'] ? req.files['video'][0] : null;
    const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

    if (!videoFile) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const user = await User.findOne({ id: userId });

    const newVideo = new Video({
      id: uuidv4(),
      title,
      description,
      category,
      status: status || 'public',
      duration: duration || '0:00',
      url: videoFile.path,
      thumbnail: thumbnailFile
        ? thumbnailFile.path
        : buildRandomThumbnail(videoFile.path, duration),
      uploaderId: userId,
      views: 0
    });

    await newVideo.save();

    const videoObj = {
      ...newVideo.toObject(),
      userId: newVideo.uploaderId,
      channel: user ? user.username : 'Unknown',
      channelAvatar: getAvatarUrl(user),
      viewsCount: 0,
      views: '0 views',
      timestamp: formatDateBR(newVideo.createdAt),
      likes: 0
    };

    res.status(201).json(videoObj);
  } catch (error) {
    console.error('Error during video upload:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      files: req.files ? Object.keys(req.files) : 'none'
    });

    let errorMsg = error.message || 'Server error';
    if (error.message?.includes('CLOUDINARY')) {
      errorMsg = `Cloudinary error: ${error.message}. Check API credentials.`;
    } else if (!req.files?.video?.[0]) {
      errorMsg = 'Video file is required';
    }

    res.status(500).json({ message: errorMsg, details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findOne({ id, deletedAt: null }).lean();
    if (!video) return res.status(404).json({ code: 'NOT_FOUND', message: 'Video not found' });

    const [uploader, likeCount, dislikeCount, userReactionDoc] = await Promise.all([
      User.findOne({ id: video.uploaderId }).lean(),
      Like.countDocuments({ videoId: id, type: 'like' }),
      Like.countDocuments({ videoId: id, type: 'dislike' }),
      req.user ? Like.findOne({ videoId: id, userId: req.user.id }).lean() : null,
    ]);

    const enriched = {
      ...video,
      userId: video.uploaderId,
      channel: uploader ? uploader.username : 'Unknown',
      channelAvatar: getAvatarUrl(uploader),
      viewsCount: video.views,
      views: `${video.views} views`,
      timestamp: formatDateBR(video.createdAt),
      likeCount,
      likesCount: likeCount,
      likes: likeCount,
      dislikeCount,
      userReaction: userReactionDoc ? userReactionDoc.type : null,
    };

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const recordView = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.user?.id;
    // 24h dedupe window — one counted view per viewer/day, anon by IP hash
    const anonKey = viewerId || `ip:${(req.ip || req.headers['x-forwarded-for'] || 'unknown').toString().slice(0, 64)}`;
    const dayBucket = new Date().toISOString().slice(0, 10);
    const viewKey = `${anonKey}:${dayBucket}`;

    const updatedVideo = await Video.findOneAndUpdate(
      { id, deletedAt: null, viewedBy: { $ne: viewKey } },
      { $inc: { views: 1 }, $addToSet: { viewedBy: viewKey } },
      { new: true }
    );

    if (updatedVideo) {
      return res.json({ success: true, views: updatedVideo.views });
    }

    const existingVideo = await Video.findOne({ id, deletedAt: null });
    if (existingVideo) {
      return res.json({ success: true, views: existingVideo.views });
    }

    res.status(404).json({ code: 'NOT_FOUND', message: 'Video not found' });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Server error' });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    const video = await Video.findOne({ id, deletedAt: null });
    if (!video) return res.status(404).json({ code: 'NOT_FOUND', message: 'Video not found' });

    const isOwner = video.uploaderId === requesterId;
    const isAdmin = requesterRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Unauthorized' });
    }

    // Soft delete
    video.deletedAt = new Date();
    video.status = 'private';
    await video.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Server error' });
  }
};

const checkVideoOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const video = await Video.findOne({ id, deletedAt: null });
    if (!video) return res.status(404).json({ code: 'NOT_FOUND', message: 'Video not found' });
    if (video.uploaderId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Unauthorized' });
    }
    req.targetVideo = video;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateVideo = async (req, res) => {
  try {
    const { title, description, category, status } = req.body;
    const video = req.targetVideo;

    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (category) video.category = category;
    if (status) video.status = status;
    if (req.file) video.thumbnail = req.file.path;

    await video.save();

    const uploader = await User.findOne({ id: video.uploaderId });
    res.json({
      ...video.toObject(),
      userId: video.uploaderId,
      channel: uploader ? uploader.username : 'Unknown',
      channelAvatar: getAvatarUrl(uploader),
      viewsCount: video.views,
      views: `${video.views} views`,
      timestamp: formatDateBR(video.createdAt)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getVideos,
  getSuggestions,
  uploadVideo,
  getVideoById,
  recordView,
  deleteVideo,
  checkVideoOwner,
  updateVideo,
  escapeRegex,
  buildRandomThumbnail
};
