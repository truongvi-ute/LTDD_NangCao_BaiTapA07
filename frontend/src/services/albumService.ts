import api from './api';
import { Moment } from './momentService';

export interface Album {
  id: number;
  name: string;
  description?: string;
  itemCount: number;
  createdAt: string;
  moments?: Moment[];
}

export interface CreateAlbumRequest {
  name: string;
  description?: string;
}

const albumService = {
  /**
   * Get all albums for current user
   */
  async getUserAlbums(): Promise<Album[]> {
    const response = await api.get('/albums');
    return response.data.data;
  },

  /**
   * Get album details with moments
   */
  async getAlbumDetails(albumId: number): Promise<Album> {
    const response = await api.get(`/albums/${albumId}`);
    return response.data.data;
  },

  /**
   * Create a new album
   */
  async createAlbum(request: CreateAlbumRequest): Promise<Album> {
    const response = await api.post('/albums', request);
    return response.data.data;
  },

  /**
   * Update album
   */
  async updateAlbum(albumId: number, request: CreateAlbumRequest): Promise<Album> {
    const response = await api.put(`/albums/${albumId}`, request);
    return response.data.data;
  },

  /**
   * Delete album
   */
  async deleteAlbum(albumId: number): Promise<void> {
    await api.delete(`/albums/${albumId}`);
  },

  /**
   * Add moment to album
   */
  async addMomentToAlbum(albumId: number, momentId: number): Promise<Album> {
    const response = await api.post(`/albums/${albumId}/moments/${momentId}`);
    return response.data.data;
  },

  /**
   * Remove moment from album
   */
  async removeMomentFromAlbum(albumId: number, momentId: number): Promise<Album> {
    const response = await api.delete(`/albums/${albumId}/moments/${momentId}`);
    return response.data.data;
  },
};

export default albumService;
