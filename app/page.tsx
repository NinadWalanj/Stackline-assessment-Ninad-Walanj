"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const LIMIT = 20;

interface Product {
  stacklineSku: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  imageUrls: string[];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories))
      .catch(() => {});
  }, []);

  // Fetch subcategories whenever the selected category changes
  useEffect(() => {
    if (selectedCategory) {
      fetch(`/api/subcategories?category=${encodeURIComponent(selectedCategory)}`)
        .then((res) => res.json())
        .then((data) => setSubCategories(data.subCategories))
        .catch(() => setSubCategories([]));
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory]);

  // Fetch products whenever any filter or page changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedSubCategory) params.append("subCategory", selectedSubCategory);
    params.append("limit", String(LIMIT));
    params.append("offset", String((page - 1) * LIMIT));

    fetch(`/api/products?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, [search, selectedCategory, selectedSubCategory, page]);

  // --- handler helpers that batch state resets ---

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    const newCategory = value === "all" ? undefined : value;
    // Bug 1 fix: reset subcategory in the same event so the products effect
    // runs exactly once with the correct (category=new, subCategory=undefined) pair
    setSelectedCategory(newCategory);
    setSelectedSubCategory(undefined);
    setPage(1);
  }

  function handleSubCategoryChange(value: string) {
    setSelectedSubCategory(value || undefined);
    setPage(1);
  }

  function handleClearFilters() {
    setSearch("");
    setSelectedCategory(undefined);
    setSelectedSubCategory(undefined);
    setPage(1);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">StackShop</h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-transparent focus:border-border focus:bg-background transition-colors rounded-lg"
              />
            </div>

            <Select
              value={selectedCategory ?? "all"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full sm:w-50 h-10 rounded-lg">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory && subCategories.length > 0 && (
              <Select
                value={selectedSubCategory}
                onValueChange={handleSubCategoryChange}
              >
                <SelectTrigger className="w-full sm:w-50 h-10 rounded-lg">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((subCat) => (
                    <SelectItem key={subCat} value={subCat}>
                      {subCat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(search || selectedCategory || selectedSubCategory) && (
              <Button
                variant="outline"
                className="h-10 rounded-lg"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {total > LIMIT
                ? `Showing ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total} products`
                : `Showing ${total} products`}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.stacklineSku}
                  href={{
                    pathname: "/product",
                    query: { sku: product.stacklineSku },
                  }}
                >
                  <Card className="h-full flex flex-col overflow-hidden p-0 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="relative h-48 w-full bg-muted shrink-0">
                      {product.imageUrls?.[0] && (
                        <Image
                          src={product.imageUrls[0]}
                          alt={product.title}
                          fill
                          className="object-contain p-4"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-4 gap-3">
                      <p className="text-sm font-semibold leading-snug line-clamp-2 text-card-foreground">
                        {product.title}
                      </p>
                      <div className="flex gap-1.5 flex-wrap mt-auto">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {product.categoryName}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-medium">
                          {product.subCategoryName}
                        </Badge>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      {/* styled div, not a button — the whole card is already inside <a> */}
                      <div className="w-full h-9 rounded-lg border border-input bg-background flex items-center justify-center text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                        View Details
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination — only shown when there is more than one page */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}