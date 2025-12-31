
import React from 'react';

export interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  category: 'entertainment' | 'services' | 'info';
}

export interface ModalContent {
  title: string;
  subtitle?: string;
  body: React.ReactNode;
  image?: string;
  type: 'menu' | 'info' | 'message' | 'alarm' | 'services';
}

export interface WeatherData {
  temp: number;
  condition: string;
  city: string;
  icon: string;
  forecast: Array<{
    day: string;
    temp: number;
    icon: string;
  }>;
}

export interface Alarm {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  repeat: number[];
}

export interface GuestInfo {
  name: string;
  room: string;
  tier: string;
}
