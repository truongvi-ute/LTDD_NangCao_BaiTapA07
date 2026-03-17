import api from '../api';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export const apiClient = {
  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await api.get<ApiResponse<T>>(url);
    return response.data;
  },

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await api.post<ApiResponse<T>>(url, data);
    return response.data;
  },

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await api.put<ApiResponse<T>>(url, data);
    return response.data;
  },

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await api.delete<ApiResponse<T>>(url);
    return response.data;
  },

  async uploadFile<T = any>(url: string, file: { uri: string; name: string; type: string }): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await api.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
