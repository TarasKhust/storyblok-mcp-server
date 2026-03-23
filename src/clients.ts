import axios from 'axios';
import { getApiBase } from './config.js';

export function createManagementClient() {
  return axios.create({
    baseURL: `${getApiBase()}/v1`,
    headers: {
      'Authorization': process.env.STORYBLOK_PERSONAL_ACCESS_TOKEN || '',
      'Content-Type': 'application/json',
    },
  });
}
