import axios from 'axios';
import * as cheerio from 'cheerio';

interface WebsiteAuditResult {
  url: string;
  seo: {
    title: string | null;
    description: string | null;
    keywords: string | null;
    hasSSL: boolean;
    h1Tags: number;
    imageCount: number;
    imagesWithoutAlt: number;
  };
  performance: {
    loadTime: number;
    pageSize: number;
  };
  social: {
    hasFacebookPixel: boolean;
    hasGoogleAnalytics: boolean;
    hasOpenGraph: boolean;
  };
  recommendations: string[];
}

interface SocialMediaAuditResult {
  platform: string;
  url: string;
  isValid: boolean;
  username?: string;
  stats?: {
    followers?: number;
    following?: number;
    posts?: number;
    engagement?: number;
  };
  recommendations: string[];
}

export class AuditService {
  /**
   * Perform comprehensive website audit
   */
  static async auditWebsite(url: string): Promise<WebsiteAuditResult> {
    const startTime = Date.now();
    const recommendations: string[] = [];

    try {
      // Fetch website content
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MarketingAuditBot/1.0)',
        },
      });

      const loadTime = Date.now() - startTime;
      const pageSize = Buffer.byteLength(response.data);
      const $ = cheerio.load(response.data);

      // SEO Analysis
      const title = $('title').text() || null;
      const description = $('meta[name="description"]').attr('content') || null;
      const keywords = $('meta[name="keywords"]').attr('content') || null;
      const hasSSL = url.startsWith('https://');
      const h1Tags = $('h1').length;
      const imageCount = $('img').length;
      const imagesWithoutAlt = $('img:not([alt])').length;

      // Social & Analytics Detection
      const pageHTML = response.data;
      const hasFacebookPixel = pageHTML.includes('facebook.com/tr') || pageHTML.includes('fbq(');
      const hasGoogleAnalytics = pageHTML.includes('google-analytics.com/analytics.js') || 
                                  pageHTML.includes('googletagmanager.com/gtag/js');
      const hasOpenGraph = $('meta[property^="og:"]').length > 0;

      // Generate recommendations
      if (!title || title.length < 30) {
        recommendations.push('🚨 Add a descriptive page title (50-60 characters)');
      }
      if (!description || description.length < 120) {
        recommendations.push('🚨 Add a compelling meta description (150-160 characters)');
      }
      if (!hasSSL) {
        recommendations.push('🔒 Enable HTTPS/SSL for security and SEO');
      }
      if (h1Tags === 0) {
        recommendations.push('📝 Add at least one H1 heading tag');
      }
      if (h1Tags > 1) {
        recommendations.push('⚠️ Use only one H1 tag per page');
      }
      if (imagesWithoutAlt > 0) {
        recommendations.push(`🖼️ Add alt text to ${imagesWithoutAlt} images for accessibility & SEO`);
      }
      if (!hasFacebookPixel) {
        recommendations.push('📊 Install Facebook Pixel for ad tracking');
      }
      if (!hasGoogleAnalytics) {
        recommendations.push('📈 Install Google Analytics for traffic tracking');
      }
      if (!hasOpenGraph) {
        recommendations.push('🔗 Add Open Graph tags for better social media sharing');
      }
      if (loadTime > 3000) {
        recommendations.push('⚡ Improve page load speed (currently ' + (loadTime / 1000).toFixed(2) + 's)');
      }
      if (pageSize > 2 * 1024 * 1024) { // 2MB
        recommendations.push('📦 Optimize page size for faster loading');
      }

      return {
        url,
        seo: {
          title,
          description,
          keywords,
          hasSSL,
          h1Tags,
          imageCount,
          imagesWithoutAlt,
        },
        performance: {
          loadTime,
          pageSize,
        },
        social: {
          hasFacebookPixel,
          hasGoogleAnalytics,
          hasOpenGraph,
        },
        recommendations,
      };
    } catch (error: any) {
      return {
        url,
        seo: {
          title: null,
          description: null,
          keywords: null,
          hasSSL: url.startsWith('https://'),
          h1Tags: 0,
          imageCount: 0,
          imagesWithoutAlt: 0,
        },
        performance: {
          loadTime: Date.now() - startTime,
          pageSize: 0,
        },
        social: {
          hasFacebookPixel: false,
          hasGoogleAnalytics: false,
          hasOpenGraph: false,
        },
        recommendations: [`❌ Unable to audit website: ${error.message}`],
      };
    }
  }

  /**
   * Fetch Instagram stats using public scraping (no API required)
   */
  static async fetchInstagramStats(username: string): Promise<any> {
    try {
      const response = await axios.get(`https://www.instagram.com/${username}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 10000,
      });

      const html = response.data;
      
      // Try to extract data from meta tags first
      const $ = cheerio.load(html);
      const metaDescription = $('meta[property="og:description"]').attr('content') || '';
      
      // Parse followers from meta description (format: "X Followers, Y Following, Z Posts")
      const followersMatch = metaDescription.match(/([\d,]+)\s*Followers/i);
      const followingMatch = metaDescription.match(/([\d,]+)\s*Following/i);
      const postsMatch = metaDescription.match(/([\d,]+)\s*Posts/i);

      if (followersMatch) {
        return {
          followers: parseInt(followersMatch[1].replace(/,/g, '')),
          following: followingMatch ? parseInt(followingMatch[1].replace(/,/g, '')) : undefined,
          posts: postsMatch ? parseInt(postsMatch[1].replace(/,/g, '')) : undefined,
        };
      }

      // Fallback: try to find JSON data in script tags
      const scriptTags = $('script[type="application/ld+json"]');
      for (let i = 0; i < scriptTags.length; i++) {
        try {
          const jsonData = JSON.parse($(scriptTags[i]).html() || '{}');
          if (jsonData['@type'] === 'ProfilePage' && jsonData.mainEntity) {
            const interactionStatistic = jsonData.mainEntity.interactionStatistic;
            if (interactionStatistic) {
              const followersData = interactionStatistic.find((stat: any) => 
                stat['@type'] === 'InteractionCounter' && stat.interactionType?.includes('FollowAction')
              );
              if (followersData) {
                return {
                  followers: followersData.userInteractionCount,
                };
              }
            }
          }
        } catch (e) {
          // Continue to next script tag
        }
      }

      return null;
    } catch (error) {
      console.error('Instagram fetch error:', error);
      return null;
    }
  }

  /**
   * Fetch TikTok stats using public data
   */
  static async fetchTikTokStats(username: string): Promise<any> {
    try {
      const response = await axios.get(`https://www.tiktok.com/@${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 10000,
      });

      const html = response.data;
      
      // TikTok stores data in script tags
      const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.*?)<\/script>/);
      if (scriptMatch) {
        try {
          const data = JSON.parse(scriptMatch[1]);
          const userDetail = data?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo;
          if (userDetail?.stats) {
            return {
              followers: userDetail.stats.followerCount,
              following: userDetail.stats.followingCount,
              posts: userDetail.stats.videoCount,
            };
          }
        } catch (e) {
          console.error('TikTok parse error:', e);
        }
      }

      return null;
    } catch (error) {
      console.error('TikTok fetch error:', error);
      return null;
    }
  }

  /**
   * Validate and audit social media URLs with stats fetching
   */
  static async auditSocialMedia(platform: string, url: string): Promise<SocialMediaAuditResult> {
    const recommendations: string[] = [];
    let isValid = false;
    let username: string | undefined;
    let stats: any = undefined;

    try {
      // Extract username from URL
      const urlPatterns: Record<string, RegExp> = {
        instagram: /instagram\.com\/([^\/\?]+)/,
        facebook: /facebook\.com\/([^\/\?]+)/,
        tiktok: /tiktok\.com\/@([^\/\?]+)/,
        linkedin: /linkedin\.com\/(company|in)\/([^\/\?]+)/,
        twitter: /twitter\.com\/([^\/\?]+)/,
        youtube: /youtube\.com\/(channel|c|user|@)\/([^\/\?]+)/,
      };

      const pattern = urlPatterns[platform];
      if (pattern) {
        const match = url.match(pattern);
        if (match) {
          username = match[match.length - 1];
          isValid = true;
        }
      }

      // Fetch stats if username is valid
      if (isValid && username) {
        if (platform === 'instagram') {
          stats = await this.fetchInstagramStats(username);
        } else if (platform === 'tiktok') {
          stats = await this.fetchTikTokStats(username);
        }

        // Generate recommendations based on stats
        if (stats) {
          if (stats.followers !== undefined) {
            recommendations.push(`✅ Found ${stats.followers.toLocaleString()} followers`);
            
            if (stats.followers < 1000) {
              recommendations.push(`🚀 Grow to 1K followers for better monetization`);
            } else if (stats.followers < 10000) {
              recommendations.push(`📈 Scale to 10K+ for brand partnerships`);
            } else {
              recommendations.push(`💰 Strong follower base - focus on engagement`);
            }
          }
          
          if (stats.posts !== undefined && stats.followers !== undefined) {
            const avgEngagement = stats.followers / (stats.posts || 1);
            if (avgEngagement < 100) {
              recommendations.push(`📊 Increase posting frequency for growth`);
            }
          }
        } else {
          recommendations.push(`✅ Valid ${platform} profile detected`);
          recommendations.push(`⚠️ Unable to fetch stats (may require API access)`);
        }
        
        recommendations.push(`🎯 We'll identify best posting times`);
        recommendations.push(`📈 We'll benchmark against competitors`);
      } else {
        recommendations.push(`❌ Invalid ${platform} URL format`);
        recommendations.push(`💡 Expected format: https://${platform}.com/yourusername`);
      }

      return {
        platform,
        url,
        isValid,
        username,
        stats,
        recommendations,
      };
    } catch (error: any) {
      return {
        platform,
        url,
        isValid: false,
        recommendations: [`❌ Error validating ${platform}: ${error.message}`],
      };
    }
  }

  /**
   * Generate comprehensive audit report
   */
  static async generateAuditReport(data: {
    website?: string;
    socialPlatforms?: string[];
    instagramUrl?: string;
    facebookUrl?: string;
    tiktokUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    youtubeUrl?: string;
  }): Promise<{
    website?: WebsiteAuditResult;
    socialMedia: SocialMediaAuditResult[];
    summary: {
      totalIssues: number;
      criticalIssues: number;
      estimatedValue: number;
    };
  }> {
    const results: {
      website?: WebsiteAuditResult;
      socialMedia: SocialMediaAuditResult[];
      summary: {
        totalIssues: number;
        criticalIssues: number;
        estimatedValue: number;
      };
    } = {
      socialMedia: [],
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        estimatedValue: 2500,
      },
    };

    // Audit website if provided
    if (data.website) {
      results.website = await this.auditWebsite(data.website);
      results.summary.totalIssues += results.website.recommendations.length;
      results.summary.criticalIssues += results.website.recommendations.filter(r => r.includes('🚨')).length;
    }

    // Audit social media platforms
    const socialUrls = [
      { platform: 'instagram', url: data.instagramUrl },
      { platform: 'facebook', url: data.facebookUrl },
      { platform: 'tiktok', url: data.tiktokUrl },
      { platform: 'linkedin', url: data.linkedinUrl },
      { platform: 'twitter', url: data.twitterUrl },
      { platform: 'youtube', url: data.youtubeUrl },
    ];

    for (const { platform, url } of socialUrls) {
      if (url && data.socialPlatforms?.includes(platform)) {
        const audit = await this.auditSocialMedia(platform, url);
        results.socialMedia.push(audit);
        if (!audit.isValid) {
          results.summary.totalIssues++;
        }
      }
    }

    return results;
  }
}

