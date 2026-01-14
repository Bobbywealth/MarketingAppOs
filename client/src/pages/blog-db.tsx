import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Calendar, User, Tag, ArrowRight, Edit } from "lucide-react";
import { HeaderLogo, FooterLogo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { getEffectiveRole } from "@/lib/effective-role";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  author: string | null;
  publishedAt: string | null;
  category: string | null;
  tags: string[] | null;
  readTime: string | null;
  featured: boolean | null;
  imageUrl?: string | null;
};

export default function BlogPageDb() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewingPost, setViewingPost] = useState<BlogPost | null>(null);

  const { user } = useAuth();
  const effectiveRole = getEffectiveRole(user?.role);
  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'manager';

  const { data: blogPosts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
  });

  // Open a post if /blog?post=slug is present
  useEffect(() => {
    try {
      if (!blogPosts.length) return;
      const slug = new URLSearchParams(window.location.search).get("post");
      if (!slug) return;
      const found = blogPosts.find((p) => p.slug === slug);
      if (found) setViewingPost(found);
    } catch {
      // ignore
    }
  }, [blogPosts]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of blogPosts) {
      if (p.category) cats.add(p.category);
    }
    return ["All", ...Array.from(cats).sort()];
  }, [blogPosts]);

  // SEO Management
  useDocumentMeta(
    viewingPost
      ? {
          title: viewingPost.title,
          description: viewingPost.excerpt || viewingPost.title,
          ogTitle: viewingPost.title,
          ogDescription: viewingPost.excerpt || viewingPost.title,
          ogType: "article",
          canonical: `https://www.marketingteam.app/blog?post=${viewingPost.slug}`,
        }
      : {
          title: "Marketing Insights & News | Marketing Team App",
          description:
            "Stay ahead with expert tips on digital marketing, AI automation, SEO, social media and growth from the Marketing Team App.",
          canonical: "https://www.marketingteam.app/blog",
        }
  );

  const filteredPosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return blogPosts
      .filter((post) => {
        const tags = post.tags ?? [];
        const matchesSearch =
          !term ||
          post.title.toLowerCase().includes(term) ||
          (post.excerpt || "").toLowerCase().includes(term) ||
          tags.some((t) => t.toLowerCase().includes(term));
        const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  }, [blogPosts, searchTerm, selectedCategory]);

  const featuredPosts = useMemo(() => {
    return blogPosts
      .filter((p) => Boolean(p.featured))
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  }, [blogPosts]);

  const regularPosts = useMemo(() => filteredPosts.filter((p) => !p.featured), [filteredPosts]);

  if (viewingPost) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <HeaderLogo />
              </Link>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link href={`/admin/blog?edit=${viewingPost.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Post
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={() => setViewingPost(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
                </Button>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <article className="container mx-auto max-w-4xl py-12 px-4">
          <Button variant="ghost" size="sm" onClick={() => setViewingPost(null)} className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Button>

          <div className="flex items-center gap-2 mb-6">
            {viewingPost.category && (
              <Badge variant="secondary" className="bg-primary/10 text-primary px-3 py-1">
                {viewingPost.category}
              </Badge>
            )}
            {viewingPost.readTime && <span className="text-sm text-muted-foreground">{viewingPost.readTime}</span>}
          </div>

          {viewingPost.imageUrl && (
            <div className="mb-10 rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={viewingPost.imageUrl} 
                alt={viewingPost.title} 
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">{viewingPost.title}</h1>

          <div className="flex items-center gap-4 mb-10 pb-10 border-b">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{viewingPost.author || "Marketing Team"}</p>
              <p className="text-sm text-muted-foreground">
                {viewingPost.publishedAt
                  ? `Published on ${new Date(viewingPost.publishedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}`
                  : "Published"}
              </p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-primary">
            <div className="whitespace-pre-wrap leading-relaxed">{viewingPost.content}</div>
          </div>

          {!!(viewingPost.tags && viewingPost.tags.length) && (
            <div className="mt-12 pt-10 border-t">
              <h3 className="text-xl font-bold mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {(viewingPost.tags || []).map((tag) => (
                  <Badge key={tag} variant="outline" className="px-3 py-1">
                    <Tag className="w-3 h-3 mr-2" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </article>

        <footer className="bg-gray-900 text-white py-12 mt-20">
          <div className="container mx-auto px-4 text-center flex flex-col items-center">
            <Link href="/">
              <FooterLogo className="mx-auto mb-4 cursor-pointer" />
            </Link>
            <p className="text-gray-400">© {new Date().getFullYear()} Marketing Team App. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <HeaderLogo />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Marketing Insights & News</h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
            Tips, strategies, and insights from the Marketing Team App.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <div className="relative flex-1 w-full">
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

      {isLoading ? (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl text-center text-muted-foreground">Loading…</div>
        </section>
      ) : (
        <>
          {selectedCategory === "All" && featuredPosts.length > 0 && (
            <section className="py-12 px-4">
              <div className="container mx-auto max-w-6xl">
                <h2 className="text-3xl font-bold text-center mb-8">Featured Articles</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {featuredPosts.map((post) => (
                    <Card
                      key={post.id}
                      className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden"
                    >
                      {post.imageUrl && (
                        <div className="aspect-[16/9] overflow-hidden">
                          <img 
                            src={post.imageUrl} 
                            alt={post.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          {post.category && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              {post.category}
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Featured
                          </Badge>
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{post.title}</CardTitle>
                        <CardDescription className="text-base">{post.excerpt || ""}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{post.author || "Marketing Team"}</span>
                            </div>
                            {post.publishedAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                            {post.readTime && <span>{post.readTime}</span>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {(post.tags || []).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1 group-hover:bg-primary group-hover:text-white transition-colors" onClick={() => setViewingPost(post)}>
                            Read More
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                          {isAdmin && (
                            <Link href={`/admin/blog?edit=${post.id}`}>
                              <Button variant="outline" size="icon" title="Edit Post">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="py-12 px-4 bg-gray-50">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl font-bold text-center mb-8">
                {selectedCategory === "All" ? "All Articles" : `${selectedCategory} Articles`}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => setViewingPost(post)}
                  >
                    {post.imageUrl && (
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        {post.category && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {post.category}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">{post.excerpt || ""}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{post.author || "Marketing Team"}</span>
                        </div>
                        {post.readTime && <span>{post.readTime}</span>}
                      </div>
                      {post.publishedAt && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 group-hover:bg-primary group-hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingPost(post);
                          }}
                        >
                          Read More
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        {isAdmin && (
                          <Link href={`/admin/blog?edit=${post.id}`}>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              title="Edit Post"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
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
        </>
      )}

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center flex flex-col items-center">
          <Link href="/">
            <FooterLogo className="mx-auto mb-4 cursor-pointer" />
          </Link>
          <p className="text-gray-400">© {new Date().getFullYear()} Marketing Team App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

