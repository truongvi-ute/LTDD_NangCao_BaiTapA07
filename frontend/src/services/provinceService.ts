import api from './api';

export interface Province {
  id: number;
  code: string;
  name: string;
  nameEn: string;
  region: string;
  latitude: number;
  longitude: number;
}

const provinceService = {
  async getAllProvinces(): Promise<Province[]> {
    const response = await api.get('/provinces');
    return response.data.data;
  },

  async searchProvinces(keyword: string): Promise<Province[]> {
    const response = await api.get('/provinces/search', {
      params: { keyword }
    });
    return response.data.data;
  },

  async getProvincesByRegion(region: string): Promise<Province[]> {
    const response = await api.get(`/provinces/region/${region}`);
    return response.data.data;
  },

  async getProvinceByCode(code: string): Promise<Province> {
    const response = await api.get(`/provinces/code/${code}`);
    return response.data.data;
  },

  async getClosestProvince(latitude: number, longitude: number): Promise<Province | null> {
    const response = await api.get('/provinces/closest', {
      params: { latitude, longitude }
    });
    return response.data.data;
  }
};

export default provinceService;
