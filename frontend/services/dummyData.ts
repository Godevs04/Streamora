import { Video, User } from '../types';

// Dummy users
const dummyUsers: User[] = [
  {
    _id: 'user1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    username: 'alexj',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Tech enthusiast and content creator',
    roles: ['user'],
    createdAt: '2023-01-15T10:30:00Z',
    updatedAt: '2023-01-15T10:30:00Z',
  },
  {
    _id: 'user2',
    name: 'Sophia Williams',
    email: 'sophia@example.com',
    username: 'sophiaw',
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Digital artist and filmmaker',
    roles: ['user'],
    createdAt: '2023-02-20T14:15:00Z',
    updatedAt: '2023-02-20T14:15:00Z',
  },
  {
    _id: 'user3',
    name: 'Marcus Chen',
    email: 'marcus@example.com',
    username: 'marcusc',
    avatarUrl: 'https://randomuser.me/api/portraits/men/22.jpg',
    bio: 'Game developer and streamer',
    roles: ['user'],
    createdAt: '2023-03-10T09:45:00Z',
    updatedAt: '2023-03-10T09:45:00Z',
  },
  {
    _id: 'user4',
    name: 'Priya Patel',
    email: 'priya@example.com',
    username: 'priyap',
    avatarUrl: 'https://randomuser.me/api/portraits/women/67.jpg',
    bio: 'Mobile UI/UX designer',
    roles: ['user'],
    createdAt: '2023-04-05T16:20:00Z',
    updatedAt: '2023-04-05T16:20:00Z',
  },
];

// Dummy videos
const dummyVideos: Video[] = [
  {
    _id: 'video1',
    owner: dummyUsers[0],
    title: 'Designing a Premium Mobile UI',
    description: 'Learn how to create beautiful, premium-looking mobile interfaces with these essential design principles and techniques.',
    videoUrl: 'https://example.com/videos/premium-ui.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=600&auto=format&fit=crop',
    tags: ['design', 'ui', 'mobile'],
    likes: ['user2', 'user3'],
    likesCount: 2,
    views: 42900,
    createdAt: '2023-05-12T08:30:00Z',
    updatedAt: '2023-05-12T08:30:00Z',
    comments: [
      {
        _id: 'comment1',
        video: 'video1',
        author: dummyUsers[1],
        text: 'This was super helpful, thanks!',
        createdAt: '2023-05-12T10:15:00Z',
        updatedAt: '2023-05-12T10:15:00Z',
      },
    ],
  },
  {
    _id: 'video2',
    owner: dummyUsers[1],
    title: 'React Performance Secrets',
    description: 'Discover advanced techniques to optimize your React applications for maximum performance.',
    videoUrl: 'https://example.com/videos/react-performance.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop',
    tags: ['react', 'javascript', 'performance'],
    likes: ['user1', 'user3', 'user4'],
    likesCount: 3,
    views: 73800,
    createdAt: '2023-06-18T14:45:00Z',
    updatedAt: '2023-06-18T14:45:00Z',
    comments: [],
  },
  {
    _id: 'video3',
    owner: dummyUsers[2],
    title: 'Building a 3D Game with Three.js',
    description: 'Step-by-step guide to creating an immersive 3D web game using Three.js and modern JavaScript.',
    videoUrl: 'https://example.com/videos/threejs-game.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop',
    tags: ['threejs', 'webgl', 'gamedev'],
    likes: ['user1'],
    likesCount: 1,
    views: 31200,
    createdAt: '2023-07-22T11:20:00Z',
    updatedAt: '2023-07-22T11:20:00Z',
    comments: [],
  },
  {
    _id: 'video4',
    owner: dummyUsers[3],
    title: 'Mobile Animation Fundamentals',
    description: 'Learn how to create smooth, engaging animations for mobile applications that enhance user experience.',
    videoUrl: 'https://example.com/videos/mobile-animation.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?q=80&w=600&auto=format&fit=crop',
    tags: ['animation', 'mobile', 'ux'],
    likes: ['user1', 'user2'],
    likesCount: 2,
    views: 28500,
    createdAt: '2023-08-05T09:10:00Z',
    updatedAt: '2023-08-05T09:10:00Z',
    comments: [],
  },
  {
    _id: 'video5',
    owner: dummyUsers[0],
    title: 'Advanced CSS Grid Techniques',
    description: 'Master complex layouts with these advanced CSS Grid techniques that will take your web design to the next level.',
    videoUrl: 'https://example.com/videos/css-grid.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517134191118-9d595e4c8c2b?q=80&w=600&auto=format&fit=crop',
    tags: ['css', 'webdesign', 'layout'],
    likes: ['user3', 'user4'],
    likesCount: 2,
    views: 19700,
    createdAt: '2023-09-14T15:30:00Z',
    updatedAt: '2023-09-14T15:30:00Z',
    comments: [],
  },
  {
    _id: 'video6',
    owner: dummyUsers[1],
    title: 'Creating a Design System from Scratch',
    description: 'A comprehensive guide to building a consistent design system that scales with your product.',
    videoUrl: 'https://example.com/videos/design-system.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=600&auto=format&fit=crop',
    tags: ['design', 'designsystem', 'ui'],
    likes: ['user2'],
    likesCount: 1,
    views: 22300,
    createdAt: '2023-10-08T13:25:00Z',
    updatedAt: '2023-10-08T13:25:00Z',
    comments: [],
  },
];

/**
 * Get all dummy videos
 */
export const getDummyVideos = (): Video[] => {
  return [...dummyVideos];
};

/**
 * Get a dummy video by ID
 */
export const getDummyVideoById = (id: string): Video | undefined => {
  return dummyVideos.find((video) => video._id === id);
};

/**
 * Get all dummy users
 */
export const getDummyUsers = (): User[] => {
  return [...dummyUsers];
};

/**
 * Get a dummy user by ID
 */
export const getDummyUserById = (id: string): User | undefined => {
  return dummyUsers.find((user) => user._id === id);
};

/**
 * Toggle like on a video (dummy implementation)
 */
export const toggleDummyVideoLike = (videoId: string, userId: string): Video | undefined => {
  const videoIndex = dummyVideos.findIndex((v) => v._id === videoId);
  if (videoIndex === -1) return undefined;
  
  const video = { ...dummyVideos[videoIndex] };
  const likeIndex = video.likes.indexOf(userId);
  
  if (likeIndex === -1) {
    // Add like
    video.likes = [...video.likes, userId];
    video.likesCount += 1;
  } else {
    // Remove like
    video.likes = video.likes.filter((id) => id !== userId);
    video.likesCount -= 1;
  }
  
  return video;
};

/**
 * Subscribe to a user (dummy implementation)
 * This would normally update a subscriptions collection
 */
export const subscribeToDummyUser = (userId: string, subscriberId: string): boolean => {
  // In a real app, this would update a subscriptions collection
  console.log(`User ${subscriberId} subscribed to ${userId}`);
  return true;
};

export default {
  getDummyVideos,
  getDummyVideoById,
  getDummyUsers,
  getDummyUserById,
  toggleDummyVideoLike,
  subscribeToDummyUser,
};
