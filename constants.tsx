
import React from 'react';
import {
  Tv,
  Utensils,
  Waves,
  Info,
  ConciergeBell,
  Film,
  Settings,
  Headphones,
  Cast
} from 'lucide-react';
import { Service } from './types';

export const SERVICES: Service[] = [
  {
    id: 'tv',
    title: 'Live TV',
    description: 'International news & entertainment',
    image: '/assets/tv_service.jpg',
    icon: <Tv className="w-8 h-8" />,
    category: 'entertainment'
  },
  {
    id: 'cast',
    title: 'Cast to TV',
    description: 'Stream from your device',
    image: '/assets/cast_to_tv_background.png',
    icon: <Cast className="w-8 h-8" />,
    category: 'entertainment'
  },
  {
    id: 'dining',
    title: 'Room Service',
    description: 'Exquisite culinary delights',
    image: '/assets/room_service.png',
    icon: <Utensils className="w-8 h-8" />,
    category: 'services'
  },
  {
    id: 'spa',
    title: 'Wellness & Spa',
    description: 'Relax and rejuvenate',
    image: '/assets/spa_service.jpg',
    icon: <Waves className="w-8 h-8" />,
    category: 'services'
  },
  {
    id: 'concierge',
    title: 'Concierge',
    description: 'Instant guest assistance',
    image: '/assets/concierge_service.png',
    icon: <ConciergeBell className="w-8 h-8" />,
    category: 'services'
  },
  {
    id: 'info',
    title: 'Hotel Info',
    description: 'Explore the Radix Grand',
    image: '/assets/hotel_info.png',
    icon: <Info className="w-8 h-8" />,
    category: 'info'
  },
];

export interface AppIcon {
  id: string;
  name: string;
  logo: string;
  package: string;
}

export const STREAMING_APPS: AppIcon[] = [
  { id: 'netflix', name: 'Netflix', logo: '/assets/netflix_logo.svg', package: 'com.netflix.ninja' },
  { id: 'youtube', name: 'YouTube', logo: '/assets/youtube_logo.svg', package: 'com.google.android.youtube.tv' },
  { id: 'disney', name: 'Disney+', logo: '/assets/disney_logo.svg', package: 'com.disney.disneyplus' },
  { id: 'prime', name: 'Prime Video', logo: '/assets/prime_logo.svg', package: 'com.amazon.amazonvideo.livingroom' },
];
