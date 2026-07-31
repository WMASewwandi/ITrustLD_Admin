import { apiFormRequest, apiRequest, getApiBaseUrl } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export function getBlogBannerUrl(blog) {
  if (!blog?.banner) return blog?.bannerUrl || null;
  const base = `${getApiBaseUrl()}/public/blog-banners/${encodeURIComponent(blog.banner)}`;
  const updatedAt = blog.updatedAt || blog.updated_at;
  if (updatedAt) {
    const version = new Date(updatedAt).getTime();
    if (!Number.isNaN(version)) {
      return `${base}?v=${version}`;
    }
  }
  return base;
}

export async function fetchBlogs() {
  return apiRequest('/admin/blogs', withToken());
}

export async function createBlog({ title, description, bannerFile }) {
  const formData = new FormData();
  formData.append('blog_title', title);
  formData.append('blog_description', description);
  formData.append('blog_banner', bannerFile);
  return apiFormRequest('/admin/blogs', withToken({ method: 'POST', formData }));
}

export async function updateBlog(blogId, { title, description, publishedState, bannerFile }) {
  const formData = new FormData();
  formData.append('blog_title', title);
  formData.append('blog_description', description);
  formData.append('is_published', publishedState === 'published' ? 'published' : 'not-published');
  if (bannerFile) {
    formData.append('blog_banner', bannerFile);
  }
  return apiFormRequest(`/admin/blogs/${blogId}/update`, withToken({ method: 'POST', formData }));
}

export async function deleteBlog(blogId) {
  return apiRequest(`/admin/blogs/${blogId}/delete`, withToken({ method: 'POST' }));
}
