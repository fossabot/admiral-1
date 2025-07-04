/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';

/**
 * HTTP response status.
 *
 * Responses are grouped in five classes:
 *  - Informational responses (100–199)
 *  - Successful responses (200–299)
 *  - Redirects (300–399)
 *  - Client errors (400–499)
 *  - Server errors (500–599)
 */
interface HttpStatus {
  code: number;
  text: string;
}

interface AdmiralError extends Error {
  status: HttpStatus;
  message: string;
  data?: any;
}

const successInterceptor = (response: AxiosResponse): AxiosResponse => response;

const errorInterceptor = (error: AxiosError): Promise<AdmiralError> => {
  const response = error?.response;
  if (response === undefined) {
    const clientError = {
      status: {
        code: 500,
        text: 'Client Error',
      },
      message: error.message,
      name: 'Client Error',
    } as AdmiralError;
    return Promise.reject(clientError);
  }

  const { status, statusText, data } = response;

  // This section handles authentication redirects.
  if (status === 401) {
    const redirectUrl: string = window.location.pathname + window.location.search;
    window.location.href = `/auth/login?redirect_url=${encodeURIComponent(redirectUrl)}`;
  }

  const message = typeof data === 'string' ? data : error.message || statusText || 'An error occurred';

  const err: AdmiralError = {
    status: {
      code: status,
      text: statusText,
    } as HttpStatus,
    message,
    data: data,
  } as AdmiralError;

  return Promise.reject(err);
};

const createClient = (): AxiosInstance => {
  const axiosClient: AxiosInstance = axios.create({
    validateStatus: (status: number): boolean => status < 400,
  });

  axiosClient.interceptors.response.use(successInterceptor, errorInterceptor);

  return axiosClient;
};

function isAdmiralError(error: unknown): error is AdmiralError {
  return error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    'message' in error;
}


const client: AxiosInstance = createClient();

export { client as default, errorInterceptor, successInterceptor, isAdmiralError };
