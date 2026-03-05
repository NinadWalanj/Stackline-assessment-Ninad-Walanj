'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  stacklineSku: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  imageUrls: string[];
  featureBullets: string[];
  retailerSku: string;
}

export default function ProductPage() {
  const searchParams = useSearchParams();
  // FUNC-2 / SEC-1: read SKU from URL and fetch from trusted API
  const sku = searchParams.get('sku');
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sku) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    fetch(`/api/products/${encodeURIComponent(sku)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setSelectedImage(0);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [sku]);

  // asChild makes Button render as <a> instead of <button>, avoiding button-inside-anchor nesting
  const backButton = (
    <Button variant="ghost" className="mb-4" asChild>
      <Link href="/">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Link>
    </Button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {backButton}
          <Card className="p-8">
            <p className="text-center text-muted-foreground">Loading product...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {backButton}
          <Card className="p-8">
            <p className="text-center text-muted-foreground">Product not found</p>
          </Card>
        </div>
      </div>
    );
  }

  // Bug-7: filter empty strings from featureBullets before rendering
  const features = (product.featureBullets ?? []).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {backButton}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-96 w-full bg-muted flex items-center justify-center">
                  {product.imageUrls?.[selectedImage] ? (
                    <Image
                      src={product.imageUrls[selectedImage]}
                      alt={product.title || 'Product image'}
                      fill
                      className="object-contain p-8"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No image available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {(product.imageUrls?.length ?? 0) > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {(product.imageUrls ?? []).map((url, idx) => (
                  <button
                    key={`${idx}-${url}`}
                    onClick={() => setSelectedImage(idx)}
                    aria-label={`View image ${idx + 1} of ${product.imageUrls?.length ?? 0}`}
                    className={`relative h-20 border-2 rounded-lg overflow-hidden ${
                      selectedImage === idx ? 'border-primary' : 'border-muted'
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`${product.title || 'Product'} - Image ${idx + 1}`}
                      fill
                      className="object-contain p-2"
                      sizes="100px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex gap-2 flex-wrap mb-2">
                <Badge variant="secondary">
                  {product.categoryName || 'Data not available'}
                </Badge>
                <Badge variant="outline">
                  {product.subCategoryName || 'Data not available'}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {product.title || 'Data not available'}
              </h1>
              <p className="text-sm text-muted-foreground">
                SKU: {product.retailerSku || 'Data not available'}
              </p>
            </div>

            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold mb-3">Features</h2>
                {features.length > 0 ? (
                  <ul className="space-y-2">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Data not available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
