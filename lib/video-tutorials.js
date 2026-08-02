import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchVideoTutorials() {
  return apiRequest('/admin/video-tutorials', withToken());
}

export async function createVideoTutorial(payload) {
  return apiRequest('/admin/video-tutorials', withToken({
    method: 'POST',
    body: {
      title: payload.title,
      subtitle: payload.subtitle || '',
      youtube_url: payload.youtubeUrl || payload.youtubeId || '',
      category: payload.category || 'New and Trending',
      duration: payload.duration || '',
      is_new: payload.isNew === true,
      sort_order: Number(payload.sortOrder) || 0,
      is_active: payload.isActive !== false,
    },
  }));
}

export async function updateVideoTutorial(id, payload) {
  return apiRequest(`/admin/video-tutorials/${id}/update`, withToken({
    method: 'POST',
    body: {
      title: payload.title,
      subtitle: payload.subtitle || '',
      youtube_url: payload.youtubeUrl || payload.youtubeId || '',
      category: payload.category || 'New and Trending',
      duration: payload.duration || '',
      is_new: payload.isNew === true,
      sort_order: Number(payload.sortOrder) || 0,
      is_active: payload.isActive !== false,
    },
  }));
}

export async function deleteVideoTutorial(id) {
  return apiRequest(`/admin/video-tutorials/${id}/delete`, withToken({ method: 'POST' }));
}

export const VIDEO_TUTORIAL_CATEGORIES = [
  { value: 'New and Trending', label: 'New and Trending' },
  { value: 'Wizarding World', label: 'Wizarding World' },
];
