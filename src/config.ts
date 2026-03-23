import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - prioritize process.env (from mcp.json) over .env file
if (!process.env.STORYBLOK_PERSONAL_ACCESS_TOKEN) {
  dotenv.config();
  try {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
  } catch (e) {
    // Ignore .env file errors if not found
  }
}

export function validateConfig(): string | null {
  if (!process.env.STORYBLOK_PERSONAL_ACCESS_TOKEN) return "STORYBLOK_PERSONAL_ACCESS_TOKEN environment variable is not set";
  return null;
}

export function validateSpaceConfig(): string | null {
  const configError = validateConfig();
  if (configError) return configError;
  if (!process.env.STORYBLOK_SPACE_ID) return "STORYBLOK_SPACE_ID environment variable is not set";
  return null;
}

export function getRegion(): string {
  return process.env.STORYBLOK_REGION || 'eu';
}

export function getApiBase(): string {
  const region = getRegion();
  if (region === 'us') {
    return 'https://api-us.storyblok.com';
  }
  if (region === 'ca') {
    return 'https://api-ca.storyblok.com';
  }
  if (region === 'ap') {
    return 'https://api-ap.storyblok.com';
  }
  return 'https://mapi.storyblok.com';
}

export function getSpaceId(): string {
  return process.env.STORYBLOK_SPACE_ID || '';
}
