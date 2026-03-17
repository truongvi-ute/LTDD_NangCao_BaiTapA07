import api from './api';

export interface CreateMomentData {
  image: {
    uri: string;
    type: string;
    name: string;
  };
  caption: string;
  latitude: number;
  longitude: number;
  addressName: string;
  isPublic: boolean;
  category: string;
}

export interface Moment {
  id: number;
  authorId: number;
  authorName: string;
  authorAvatarUrl?: string;
  imageUrl: string;
  caption: string;
  latitude: number;
  longitude: number;
  addressName: string;
  isPublic: boolean;
  category: string;
  status: string;
  reactionCount: number;
  commentCount: number;
  saveCount: number;
  createdAt: string;
  provinceName?: string;
  provinceCode?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

const momentService = {
  async uploadImage(imageUri: string): Promise<string> {
    const formData = new FormData();
    
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1] || 'jpg';
    
    formData.append('image', {
      uri: imageUri,
      type: `image/${fileType}`,
      name: `moment_${Date.now()}.${fileType}`,
    } as any);
    
    const response = await api.post('/moments/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data.imageUrl;
  },

  async createMoment(data: CreateMomentData): Promise<Moment> {
    const formData = new FormData();
    
    // Append image
    formData.append('image', {
      uri: data.image.uri,
      type: data.image.type,
      name: data.image.name,
    } as any);
    
    // Append other fields
    formData.append('caption', data.caption);
    formData.append('latitude', data.latitude.toString());
    formData.append('longitude', data.longitude.toString());
    formData.append('addressName', data.addressName);
    formData.append('isPublic', data.isPublic.toString());
    formData.append('category', data.category);
    
    const response = await api.post('/moments/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data;
  },

  async getMyMoments(): Promise<Moment[]> {
    const response = await api.get('/moments/my-moments');
    return response.data.data;
  },

  async getMyMomentsPaginated(page: number = 0, size: number = 10, sortBy?: string): Promise<PageResponse<Moment>> {
    const response = await api.get('/moments/my-moments/paginated', {
      params: { page, size, sortBy }
    });
    return response.data.data;
  },

  async getSavedMoments(): Promise<Moment[]> {
    const response = await api.get('/moments/saved');
    return response.data.data;
  },

  async getSavedMomentsPaginated(page: number = 0, size: number = 10, sortBy?: string): Promise<PageResponse<Moment>> {
    const response = await api.get('/moments/saved/paginated', {
      params: { page, size, sortBy }
    });
    return response.data.data;
  },

  async getUserMoments(userId: number): Promise<Moment[]> {
    const response = await api.get(`/moments/user/${userId}`);
    return response.data.data;
  },

  async getUserMomentsPaginated(
    userId: number, 
    page: number = 0, 
    size: number = 10,
    sortBy?: string
  ): Promise<PageResponse<Moment>> {
    const response = await api.get(`/moments/user/${userId}/paginated`, {
      params: { page, size, sortBy }
    });
    return response.data.data;
  },

  async getFeedPaginated(page: number = 0, size: number = 10, sortBy?: string): Promise<PageResponse<Moment>> {
    const response = await api.get('/moments/feed/paginated', {
      params: { page, size, sortBy }
    });
    return response.data.data;
  },

  async getMomentsByProvince(provinceName: string): Promise<Moment[]> {
    const response = await api.get(`/moments/province/${provinceName}`);
    return response.data.data;
  },

  async getMomentsByProvincePaginated(
    provinceName: string, 
    page: number = 0, 
    size: number = 10,
    sortBy?: string
  ): Promise<PageResponse<Moment>> {
    const response = await api.get(`/moments/province/${provinceName}/paginated`, {
      params: { page, size, sortBy }
    });
    return response.data.data;
  },

  async getMomentsByCategory(category: string): Promise<Moment[]> {
    const response = await api.get(`/moments/category/${category}`);
    return response.data.data;
  },

  async getMomentsByCategoryPaginated(
    category: string, 
    page: number = 0, 
    size: number = 10,
    sortBy?: string
  ): Promise<PageResponse<Moment>> {
    const response = await api.get(`/moments/category/${category}/paginated`, {
      params: { page, size, sortBy }
    });
    return response.data.data;
  },

  async getMoment(momentId: number): Promise<Moment> {
    const response = await api.get(`/moments/${momentId}`);
    return response.data.data;
  },

  async deleteMoment(momentId: number): Promise<void> {
    await api.delete(`/moments/${momentId}`);
  },

  async toggleSaveMoment(momentId: number): Promise<{ saved: boolean; saveCount: number }> {
    const response = await api.post(`/moments/${momentId}/save`);
    return response.data.data;
  },

  async checkIsSaved(momentId: number): Promise<boolean> {
    const response = await api.get(`/moments/${momentId}/is-saved`);
    return response.data.data.saved;
  },
};

export default momentService;
