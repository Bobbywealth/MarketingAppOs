import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Calendar, User, Tag, ArrowRight, TrendingUp, Target, DollarSign, Users, Globe, Smartphone } from "lucide-react";
import mtaLogoBlue from "@assets/mta-logo-blue.png";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  readTime: string;
  featured: boolean;
  imageUrl?: string;
}

// Sample blog posts for SEO and marketing content
const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "10 Digital Marketing Strategies That Actually Work in 2024",
    excerpt: "Discover the most effective digital marketing strategies that are driving real results for businesses in 2024. From AI automation to social media mastery.",
    content: "Full content here...",
    author: "Marketing Team",
    publishedAt: "2024-01-15",
    category: "Digital Marketing",
    tags: ["digital marketing", "strategy", "2024 trends", "ROI"],
    readTime: "8 min read",
    featured: true,
  },
  {
    id: "2",
    title: "How AI is Revolutionizing Content Creation for Small Businesses",
    excerpt: "Learn how artificial intelligence is transforming content creation and how small businesses can leverage AI tools to compete with larger companies.",
    content: "Full content here...",
    author: "Marketing Team",
    publishedAt: "2024-01-10",
    category: "AI & Automation",
    tags: ["AI", "content creation", "small business", "automation"],
    readTime: "6 min read",
    featured: true,
  },
  {
    id: "3",
    title: "The Complete Guide to Local SEO for Service-Based Businesses",
    excerpt: "Master local SEO with our comprehensive guide. Learn how to dominate local search results and attract more customers in your area.",
    content: "Full content here...",
    author: "Marketing Team",
    publishedAt: "2024-01-05",
    category: "SEO",
    tags: ["local SEO", "Google My Business", "local search", "service business"],
    readTime: "12 min read",
    featured: false,
  },
  {
    id: "4",
    title: "Social Media Marketing: Which Platforms Should Your Business Focus On?",
    excerpt: "Not all social media platforms are created equal. Learn which platforms will give you the best ROI for your specific business type.",
    content: "Full content here...",
    author: "Marketing Team",
    publishedAt: "2024-01-01",
    category: "Social Media",
    tags: ["social media", "platform strategy", "ROI", "engagement"],
    readTime: "7 min read",
    featured: false,
  },
  {
    id: "5",
    title: "Email Marketing Automation: From Beginner to Advanced",
    excerpt: "Transform your email marketing with automation. Learn how to set up effective email sequences that convert prospects into customers.",
    content: "Full content here...",
    author: "Marketing Team",
    publishedAt: "2023-12-28",
    category: "Email Marketing",
    tags: ["email marketing", "automation", "conversion", "sequences"],
    readTime: "10 min read",
    featured: false,
  },
  {
    id: "6",
    title: "Why Your Business Needs a Mobile-First Marketing Strategy",
    excerpt: "With over 60% of web traffic coming from mobile devices, learn why a mobile-first approach is crucial for your marketing success.",
    content: "Full content here...",
    author: "Marketing Team",
    publishedAt: "2023-12-25",
    category: "Mobile Marketing",
    tags: ["mobile marketing", "responsive design", "mobile-first", "user experience"],
    readTime: "5 min read",
    featured: false,
  },
];

const categories = ["All", "Digital Marketing", "AI & Automation", "SEO", "Social Media", "Email Marketing", "Mobile Marketing"];

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <img src={mtaLogoBlue} alt="Marketing Team App" className="h-12 w-auto cursor-pointer" />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Marketing Insights & News
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
            Stay ahead of the curve with the latest digital marketing trends, strategies, and insights from our expert team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/90 border-white/20 text-gray-900 placeholder-gray-500"
              />
            </div>
            <Button 
              onClick={() => setSearchTerm("")}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Clear
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-4 bg-white border-b">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="mb-2"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {selectedCategory === "All" && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-8">Featured Articles</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {post.category}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Featured
                      </Badge>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                        </div>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-8">
            {selectedCategory === "All" ? "All Articles" : `${selectedCategory} Articles`}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Card key={post.id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {post.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <span>{post.readTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {post.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.tags.length - 2} more
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {regularPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No articles found matching your criteria.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 500+ businesses who are already seeing 3x results with our proven marketing strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Book Strategy Call
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <img src={mtaLogoBlue} alt="Marketing Team App" className="h-12 w-auto mx-auto mb-4 brightness-0 invert" />
          <p className="text-gray-400">
            © {new Date().getFullYear()} Marketing Team App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
