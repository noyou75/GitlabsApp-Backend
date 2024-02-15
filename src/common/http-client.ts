import { HttpService } from '@nestjs/common';
import { AxiosRequestConfig, Method } from 'axios';
import { merge } from 'lodash';

export class HttpClient {
  constructor(private readonly httpService: HttpService, private readonly config?: AxiosRequestConfig) {
    // const interceptors = this.httpService.axiosRef.interceptors;
    // interceptors.request.use((request: AxiosRequestConfig) => {
    //   console.log('Starting Request', request);
    //   return request;
    // });
    // interceptors.response.use(response => {
    //   console.log('Response:', response);
    //   return response;
    // });
  }

  request<T>(config: AxiosRequestConfig) {
    return this.httpService.request<T>(merge({}, this.config, config) as any);
  }

  head<T>(url: string, config?: AxiosRequestConfig) {
    return this.httpService.head<T>(url, merge({}, this.config, config) as any);
  }

  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.httpService.get<T>(url, merge({}, this.config, config) as any);
  }

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.httpService.delete<T>(url, merge({}, this.config, config) as any);
  }

  post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.httpService.post<T>(url, data, merge({}, this.config, config) as any);
  }

  put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.httpService.put<T>(url, data, merge({}, this.config, config) as any);
  }

  patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.httpService.patch<T>(url, data, merge({}, this.config, config) as any);
  }
}
