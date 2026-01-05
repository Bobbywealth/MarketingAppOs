import axios from "axios";

const SCRAPECREATORS_API_KEY = process.env.SCRAPECREATORS_API_KEY;
const BASE_URL = "https://api.scrapecreators.com/";

export interface AccountSnapshot {
  platform: string;
  handle: string;
  displayName?: string;
  profileUrl?: string;
  followers?: number;
  following?: number;
  postsCount?: number;
  likesCount?: number;
  viewsCount?: number;
  rawPayload: any;
}

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "x-api-key": SCRAPECREATORS_API_KEY || "",
  },
});

export async function fetchTikTokProfile(handle: string): Promise<AccountSnapshot> {
  const response = await client.get(`/v1/tiktok/profile?handle=${handle}`);
  const data = response.data;
  
  return {
    platform: "tiktok",
    handle,
    displayName: data.nickname || data.display_name,
    profileUrl: data.profile_url,
    followers: data.followers_count || data.stats?.followerCount,
    following: data.following_count || data.stats?.followingCount,
    postsCount: data.video_count || data.stats?.videoCount,
    likesCount: data.heart_count || data.stats?.heartCount,
    rawPayload: data,
  };
}

export async function fetchYouTubeProfile(handle: string): Promise<AccountSnapshot> {
  const response = await client.get(`/v1/youtube/profile?handle=${handle}`);
  const data = response.data;
  
  return {
    platform: "youtube",
    handle,
    displayName: data.title || data.display_name,
    profileUrl: data.url || data.profile_url,
    followers: data.subscriber_count || data.stats?.subscriberCount,
    postsCount: data.video_count || data.stats?.videoCount,
    viewsCount: data.view_count || data.stats?.viewCount,
    rawPayload: data,
  };
}

export async function fetchInstagramProfile(handle: string): Promise<AccountSnapshot> {
  const response = await client.get(`/v1/instagram/profile?handle=${handle}`);
  const data = response.data;
  
  return {
    platform: "instagram",
    handle,
    displayName: data.full_name || data.display_name,
    profileUrl: data.profile_url || `https://instagram.com/${handle}`,
    followers: data.follower_count || data.stats?.followerCount,
    following: data.following_count || data.stats?.followingCount,
    postsCount: data.media_count || data.stats?.mediaCount,
    rawPayload: data,
  };
}

export async function fetchSocialProfile(platform: string, handle: string): Promise<AccountSnapshot> {
  switch (platform.toLowerCase()) {
    case "tiktok":
      return fetchTikTokProfile(handle);
    case "youtube":
      return fetchYouTubeProfile(handle);
    case "instagram":
      return fetchInstagramProfile(handle);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

