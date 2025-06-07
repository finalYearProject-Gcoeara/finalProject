// frontend/src/components/DashboardView.tsx (Modified)
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2, AlertTriangle, ExternalLink, ImageOff, BarChart2, PieChart as PieChartIcon, Info, ListChecks, FileText, GalleryThumbnails, ShoppingBag } from 'lucide-react'; // Added ShoppingBag
// Removed useNavigate as back button logic will be part of MainLayout or specific page headers if needed

import MainLayout from './MainLayout'; // Import the new layout
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

// ... (Keep your interfaces: ProductInfo, ImageInfo, etc.) ...
interface ProductInfo { /* ... */ }
interface ImageInfo { /* ... */ }
interface GeminiAPIResult { /* ... */ }
interface TableOfContentsItem { /* ... */ }
interface ReviewData { /* ... */ }
interface SentimentSummary { /* ... */ }
interface ProductAspectsData { /* ... */ }
interface DashboardAPIData {
  product_user_categories_data: ProductUserCategoriesData;
}
interface ProductUserCategoriesData {
  error?: string;
  segmentation_text?: string;
}
interface ParsedUserSegment {
  name: string;        // e.g., "Teenagers"
  likelihoodScore: number; // 1 (Less), 2 (Likely), 3 (More)
  likelihoodLabel: string; // "Less Likely", "Likely", "More Likely"
}


const API_BASE_URL = 'http://localhost:5000';
const fetchDashboardData = async (): Promise<DashboardAPIData> => { /* ... (keep your fetch function) ... */
  const response = await fetch(`${API_BASE_URL}/api/dashboard_data`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network response was not ok and failed to parse error JSON.' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const ProductAnalysisContent: React.FC = () => { // Extracted content into its own component
  const { data, isLoading, error, refetch } = useQuery<DashboardAPIData, Error>({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    retry: 1,
  });

  // const parsedUserSegments: { name: string; likelihoodScore: number; likelihoodLabel: string }[] = [];

  const parseAndPrepareUserSegmentData = (segmentationText?: string): ParsedUserSegment[] => {
    if (!segmentationText || typeof segmentationText !== 'string') return []; // Added type check

    const lines = segmentationText.split('\n').map(line => line.trim()).filter(line => line !== '');
    const segments: ParsedUserSegment[] = [];
    let currentLikelihoodLabel = "";
    let likelihoodScore = 0;

    for (const line of lines) { // Changed to a for...of loop for easier `continue`
      const lineLower = line.toLowerCase();

      if (lineLower.startsWith("more likely users:")) {
        currentLikelihoodLabel = "More Likely";
        likelihoodScore = 3;
        continue; // Skip the heading line itself
      } else if (lineLower.startsWith("likely users:")) {
        currentLikelihoodLabel = "Likely";
        likelihoodScore = 2;
        continue; // Skip the heading line
      } else if (lineLower.startsWith("less likely users:")) {
        currentLikelihoodLabel = "Less Likely";
        likelihoodScore = 1;
        continue; // Skip the heading line
      }

      // Only process lines that start with '-' AND we have a current likelihood context
      if (currentLikelihoodLabel && line.startsWith('-')) {
        const name = line.substring(1).trim(); // Get text after '-'
        
        if (name) { 
          segments.push({
            name: name,
            likelihoodScore: likelihoodScore, // Use the score set by the last heading
            likelihoodLabel: currentLikelihoodLabel, // Use the label set by the last heading
          });
        }
      }
    }
    
    // Sort by likelihood score (descending) then by name (ascending) for consistent chart order
    return segments.sort((a, b) => b.likelihoodScore - a.likelihoodScore || a.name.localeCompare(b.name));
  };

  const parsedUserSegments: ParsedUserSegment[] = React.useMemo(() => { // Renamed from userSegmentChartData for clarity
    if (data && data.product_user_categories_data && typeof data.product_user_categories_data.segmentation_text === 'string') {
      return parseAndPrepareUserSegmentData(data.product_user_categories_data.segmentation_text);
    }
    return [];
  }, [data?.product_user_categories_data?.segmentation_text]); // Dependency array updated
  // --- End of refined parsing function ---



  if (isLoading) { /* ... (keep your loading JSX) ... */
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-lg text-slate-700 font-semibold">Loading Product Analysis...</p>
      </div>
    );
  }

  if (error || !data || !(data.product_info && data.product_info.product_name)) { /* ... (keep your error JSX with retry/back buttons)... */
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-semibold text-red-700 mb-3">Data Not Available</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          {error ? `Failed to load data: ${error.message}` : "No product data processed. Please use the extension."}
        </p>
        <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
          Retry Loading Data
        </Button>
      </div>
    );
  }

  const {
    product_info, images, gemini_data, table_of_contents_data,
    reviews_data, sentiment_summary, product_aspects_data, product_user_categories_data
  } = data;

  const sentimentChartData = (sentiment_summary && sentiment_summary.total > 0 && !sentiment_summary.error) ? [
    { name: 'Positive', value: sentiment_summary.positive, fill: '#28a745' }, // Green
    { name: 'Negative', value: sentiment_summary.negative, fill: '#dc3545' }, // Red
    { name: 'Neutral', value: sentiment_summary.neutral, fill: '#6c757d' },  // Grey
    { name: 'Unknown', value: sentiment_summary.unknown, fill: '#ffc107' },  // Yellow
  ].filter(item => item.value > 0) : []; // Ensure it's an empty array if no data

  const aspectsChartData = (product_aspects_data && !product_aspects_data.error) ? [
    { name: 'Positive', score: product_aspects_data.positive_score, fill: '#28a745' }, // Green
    { name: 'Negative', score: product_aspects_data.negative_score, fill: '#dc3545' }, // Red
  ] : [];

  // Apply styling similar to the target dashboard for your cards
  const cardBaseClass = "bg-white rounded-xl shadow-lg overflow-hidden";
  const cardHeaderClass = "p-4 sm:p-6 border-b border-slate-200";
  const cardTitleClass = "text-lg sm:text-xl font-semibold text-slate-800";
  const cardDescriptionClass = "text-lg sm:text-sm text-slate-500 mt-1";
  const cardContentClass = "p-4 sm:p-6 text-sm";





  return (
    <div className="space-y-6">
      {/* Section 1: Product Info & Quick View (mimicking top cards or main info area) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className={`${cardBaseClass} xl:col-span-2`}>
          <CardHeader className={cardHeaderClass}>
            <CardTitle className="text-xl font-bold">{product_info.product_name || 'Product Details'}</CardTitle>
          </CardHeader>
          <CardContent className={`${cardContentClass} space-y-4`}>
            {/* Main Product Image */}
            {product_info.main_image && product_info.main_image !== "N/A" && product_info.main_image.startsWith('http') ? (
              <img
                src={product_info.main_image}
                alt={product_info.product_name || "Product Image"}
                className="w-full max-w-xs mx-auto h-auto max-h-[300px] object-contain rounded-md border border-slate-200 dark:border-slate-700 p-1 bg-white"
              />
            ) : (
              <div className="w-full max-w-xs mx-auto h-[300px] flex items-center justify-center text-center p-4 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">
                <div className="text-slate-500 dark:text-slate-400">
                  <ImageOff className="w-12 h-12 mx-auto mb-2" />
                  Image not available
                </div>
              </div>
            )}

            {/* Product Details (Price, Rating, Seller) */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-600 dark:text-slate-300 pt-2">
              <p><strong className="text-slate-700 dark:text-slate-200 text-base">Price:</strong> {product_info.price || 'N/A'}</p>
              <p><strong className="text-slate-700 dark:text-slate-200 text-base">Rating:</strong> {product_info.rating || 'N/A'}</p>
              <p className="col-span-2"><strong className="text-slate-700 dark:text-slate-200 text-base">Seller:</strong> {product_info.seller_name || 'N/A'} ({product_info.seller_rating || 'N/A'})</p>
              {/* The stray comment was here and has been removed */}
            </div>

            {/* View on Flipkart Button */}
            <div className="text-center pt-3"> {/* Added a bit more top padding */}
              <Button
                onClick={() => window.open(`https://www.flipkart.com/search?q=${encodeURIComponent(product_info.product_name || '')}`, '_blank', 'noopener,noreferrer')}
                className="bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-400 px-5 py-2.5 text-base" // Matched style
              // size="sm" // Using custom padding instead of size prop for more control
              >
                View on Flipkart <ExternalLink className="w-4 h-4 ml-1.5 inline-block" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {table_of_contents_data && table_of_contents_data.length > 0 && (
          <Card className={cardBaseClass}>
            <CardHeader className={cardHeaderClass}><CardTitle className={cardTitleClass}>Quick View</CardTitle></CardHeader>
            <CardContent className={cardContentClass}>
              <dl className="space-y-3">
                {table_of_contents_data.map(item => (
                  <div key={item.label} className="flex">
                    <dt className="font-medium w-2/5 text-slate-600 shrink-0 text-base">{item.label}:</dt>
                    <dd className="w-3/5 text-slate-700 break-words text-base">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>

      {((gemini_data && (gemini_data.cleaned_description || gemini_data.error)) || product_info.description ||
        (product_info.highlights && product_info.highlights.length > 0) ||
        (images && images.thumbnails && images.thumbnails.length > 0)) && (

          <Card className={cardBaseClass}> {/* Use your defined cardBaseClass */}
            <CardContent className={`${cardContentClass} space-y-6 pt-6`}>

              {/* Grid container for Description and Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 gap-y-6"> {/* md:gap-x-8 for space between columns on medium screens up */}

                {/* Description Section (Left Column) */}
                {((gemini_data && (gemini_data.cleaned_description || gemini_data.error)) || product_info.description) && (
                  <div className="md:col-span-1"> {/* Takes 1 column on medium screens up */}
                    <h4 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Description</h4>
                    <div className="prose max-w-none text-slate-600 text-base">
                      {gemini_data?.error ? (
                        <p className="text-red-500">Error fetching AI description: {gemini_data.error}</p>
                      ) : (
                        <p>{gemini_data?.cleaned_description || product_info.description || 'No description available.'}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Highlights Section (Right Column) */}
                {product_info.highlights && product_info.highlights.length > 0 && (
                  <div className="md:col-span-1"> {/* Takes 1 column on medium screens up */}
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Highlights</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-base pl-2">
                      {product_info.highlights.map((highlight, index) => (
                        <li key={index}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {/* End of Grid container for Description and Highlights */}

              {/* Gallery Section (Full width below Description/Highlights) */}
              {images && images.thumbnails && images.thumbnails.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200"> {/* Added top margin and border for separation */}
                  <h4 className="text-lg font-semibold text-slate-800 mb-2">Gallery</h4>
                  <div className="flex flex-wrap gap-3">
                    {images.thumbnails.map((thumb, index) => (
                      <img
                        key={index}
                        src={thumb}
                        alt={`Product thumbnail ${index + 1}`}
                        className="w-24 h-24 object-contain rounded border p-1 bg-white hover:shadow-md transition-shadow cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}


      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sentiment Pie Chart */}
        {sentiment_summary && sentiment_summary.total > 0 && !sentiment_summary.error && sentimentChartData.length > 0 && (
          <Card className={cardBaseClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className={cardTitleClass}>Review Sentiment</CardTitle>
              <CardDescription className={cardDescriptionClass}>Overall sentiment distribution</CardDescription>
            </CardHeader>
            <CardContent className={cardContentClass}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
                {/* Pie Chart */}
                <div className="w-full sm:w-2/3 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                      >
                        {sentimentChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          `${value} reviews (${((value / sentiment_summary.total) * 100).toFixed(1)}%)`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend on the right */}
                <div className="w-full sm:w-1/3 space-y-2 text-sm">
                  {sentimentChartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-slate-800 font-medium">{item.name}:</span>
                      <span className="font-medium text-slate-800">
                        {((item.value / sentiment_summary.total) * 100).toFixed(1)}%
                        <span className="text-slate-500 text-xs ml-1">({item.value})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Aspects Bar Chart */}
        {product_aspects_data && !product_aspects_data.error && (product_aspects_data.positive_score > 0 || product_aspects_data.negative_score > 0) && (
          <Card className={cardBaseClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className={cardTitleClass}>Product Aspects</CardTitle>
              <CardDescription className={cardDescriptionClass}>Positive vs. Negative scores</CardDescription>
            </CardHeader>
            <CardContent className={cardContentClass}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={aspectsChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis domain={[0, 10]} allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="score" barSize={40}>
                    {aspectsChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>


      {((reviews_data && reviews_data.length > 0) ||
        (product_user_categories_data && (product_user_categories_data.segmentation_text || product_user_categories_data.error))
      ) && (
          <Card className={cardBaseClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className={cardTitleClass}>Detailed Analytics</CardTitle>
            </CardHeader>
            <CardContent className={cardContentClass}>
              <Tabs defaultValue="customer-reviews" className="space-y-4"> {/* Default to customer reviews tab */}
                <TabsList className="grid w-full grid-cols-2"> {/* Adjust grid-cols based on number of tabs */}
                  <TabsTrigger value="customer-reviews" disabled={!(reviews_data && reviews_data.length > 0)}>
                    Customer Reviews
                  </TabsTrigger>
                  <TabsTrigger
                    value="user-segments"
                    disabled={!(product_user_categories_data && (product_user_categories_data.segmentation_text || product_user_categories_data.error))}
                  >
                    Target User Segments
                  </TabsTrigger>
                  {/* Add more TabsTrigger here if you have more tabs */}
                </TabsList>

                {/* Customer Reviews Tab Content */}
                <TabsContent value="customer-reviews" className="mt-4"> {/* Added mt-4 for spacing */}
                  {reviews_data && reviews_data.length > 0 ? (
                    <div className={`${cardContentClass} space-y-4 max-h-[400px] overflow-y-auto p-0 sm:p-0`}> {/* Removed CardContent's default padding here as parent has it */}
                      {reviews_data.map((review, index) => (
                        <Card key={index} className="p-3 sm:p-4 bg-slate-50/70 shadow-sm border border-slate-200"> {/* Card per review */}
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="font-semibold text-sm sm:text-base text-slate-800">{review.review_title || 'Review'}</h5>
                            {review.sentiment && (
                              <Badge
                                variant={
                                  review.sentiment === 'Positive' ? 'default' :
                                    review.sentiment === 'Negative' ? 'destructive' :
                                      review.sentiment === 'Neutral' ? 'secondary' : 'outline'
                                }
                                className={`text-xs px-2 py-0.5 rounded-full font-medium
                                ${review.sentiment === 'Positive' ? 'bg-green-100 text-green-800 border border-green-300' :
                                    review.sentiment === 'Negative' ? 'bg-red-100 text-red-800 border border-red-300' :
                                      review.sentiment === 'Neutral' ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                                        'bg-yellow-100 text-yellow-800 border border-yellow-300' // Unknown or Error
                                  }`}
                              >
                                {review.sentiment}
                              </Badge>
                            )}
                          </div>
                          {review.rating && <p className="text-xs text-slate-500 mb-1 sm:mb-2">Rating: <strong>{review.rating}/5</strong></p>}
                          <p className="text-xs sm:text-sm text-slate-700 mb-1 sm:mb-2 leading-relaxed">{review.review_desc || 'No description.'}</p>
                          {review.reviewer_name && (
                            <p className="text-xs text-slate-500 italic">
                              By: {review.reviewer_name}
                              {review.review_date && review.review_date !== review.reviewer_name && ` on ${review.review_date}`}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No customer reviews available for this product.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="user-segments" className="mt-4">
                  {parsedUserSegments.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        layout="vertical"
                        data={parsedUserSegments}
                        margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 3]} tick={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fontSize: 12 }}
                          width={150}
                        />
                        <Tooltip
                          formatter={(value: any) =>
                            value === 1 ? 'Less Likely'
                              : value === 2 ? 'Likely'
                                : 'More Likely'
                          }
                        />
                        <Bar dataKey="likelihoodScore" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      User segmentation data is not available.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

// This is the component that will be rendered by your router for '/dashboard'
const DashboardView: React.FC = () => {
  // You could have multiple sub-pages within the dashboard
  // For now, let's assume the Product Analysis is the main content.
  // The `pageTitle` can be dynamic based on sub-routes if you add them.
  return (
    <MainLayout pageTitle="Product Analysis Dashboard">
      <ProductAnalysisContent />
    </MainLayout>
  );
}

export default DashboardView;