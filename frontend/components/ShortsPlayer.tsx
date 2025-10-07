import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Video as VideoType } from '../types';
import colors from '../constants/colors';

interface ShortsPlayerProps {
  video: VideoType;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSubscribe: () => void;
  isLiked: boolean;
  isSubscribed: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ShortsPlayer({
  video,
  onLike,
  onComment,
  onShare,
  onSubscribe,
  isLiked,
  isSubscribed,
}: ShortsPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isLikedState, setIsLikedState] = useState(isLiked);
  const [isSubscribedState, setIsSubscribedState] = useState(isSubscribed);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoPress = () => {
    setShowControls(true);
    handlePlayPause();
  };

  const handleLike = () => {
    setIsLikedState(!isLikedState);
    onLike();
  };

  const handleSubscribe = () => {
    setIsSubscribedState(!isSubscribedState);
    onSubscribe();
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={handleVideoPress}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          source={{ uri: video.videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlaying}
          isLooping={true}
          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
            }
          }}
        />

        {/* Play/Pause Overlay */}
        {showControls && (
          <View style={styles.playOverlay}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={60}
                color="rgba(255, 255, 255, 0.9)"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Video Info Overlay */}
        <View style={styles.videoInfo}>
          <View style={styles.videoDetails}>
            <Text style={styles.videoTitle}>{video.title || 'Untitled Video'}</Text>
            <Text style={styles.channelName}>{video.owner?.name || 'Unknown User'}</Text>
            <View style={styles.hashtags}>
              {(video.tags || []).slice(0, 3).map((tag, index) => (
                <Text key={index} style={styles.hashtag}>
                  #{tag}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={isLikedState ? 'heart' : 'heart-outline'}
              size={28}
              color={isLikedState ? colors.error : '#FFFFFF'}
            />
            <Text style={styles.actionText}>{formatCount(typeof video.likesCount === 'number' ? video.likesCount : 0)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <Ionicons name="chatbubble-outline" size={28} color="#FFFFFF" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Ionicons name="share-outline" size={28} color="#FFFFFF" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSubscribe}>
            <Ionicons
              name={isSubscribedState ? 'person-add' : 'person-add-outline'}
              size={28}
              color={isSubscribedState ? colors.primary : '#FFFFFF'}
            />
            <Text style={styles.actionText}>
              {isSubscribedState ? 'Subscribed' : 'Subscribe'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  videoContainer: {
    width: screenWidth,
    height: screenHeight,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 80,
  },
  videoDetails: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 22,
  },
  channelName: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hashtag: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 8,
    marginBottom: 4,
  },
  actionButtons: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});
