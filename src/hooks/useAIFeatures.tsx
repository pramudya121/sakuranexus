import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AIArtResult {
  imageUrl: string;
  description: string;
  prompt: string;
}

interface AIAnalysisResult {
  action: string;
  result: any;
}

interface VisualSearchResult {
  visualFeatures: any;
  searchTerms: string[];
  similarityFactors: string[];
  category: string;
  tags: string[];
}

export const useAIFeatures = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Art Generator
  const generateArt = useCallback(async (
    prompt: string, 
    style?: string, 
    aspectRatio?: string
  ): Promise<AIArtResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-art-generator', {
        body: { prompt, style, aspectRatio }
      });

      if (fnError) throw fnError;
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to generate art');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // AI Rarity Score
  const getRarityScore = useCallback(async (nftData: any, imageUrl?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-nft-analysis', {
        body: { action: 'rarity_score', nftData, imageUrl }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to analyze rarity');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fake/Stolen Art Detection
  const detectFakeArt = useCallback(async (nftData: any, imageUrl: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-nft-analysis', {
        body: { action: 'fake_detection', nftData, imageUrl }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to detect authenticity');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Price Prediction
  const predictPrice = useCallback(async (nftData: any, marketData?: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-nft-analysis', {
        body: { action: 'price_prediction', nftData, marketData }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to predict price');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto Generate Metadata
  const generateMetadata = useCallback(async (imageUrl: string, nftData?: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-nft-analysis', {
        body: { action: 'metadata_generation', imageUrl, nftData }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to generate metadata');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Wash Trading Detection
  const detectWashTrading = useCallback(async (nftData: any, marketData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-nft-analysis', {
        body: { action: 'wash_trading_detection', nftData, marketData }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to detect wash trading');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Smart Recommendations
  const getRecommendations = useCallback(async (userAddress: string, nftData: any, marketData?: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-nft-analysis', {
        body: { action: 'recommendations', userAddress, nftData, marketData }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to get recommendations');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Visual Search
  const visualSearch = useCallback(async (imageUrl: string, searchType?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-visual-search', {
        body: { imageUrl, searchType }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to perform visual search');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sentiment Analysis
  const analyzeSentiment = useCallback(async (nftData: any, marketData?: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-nft-analysis', {
        body: { action: 'sentiment_analysis', nftData, marketData }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to analyze sentiment');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Smart Bidding Assistant
  const getSmartBid = useCallback(async (nftData: any, marketData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-nft-analysis', {
        body: { action: 'smart_bidding', nftData, marketData }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to get bidding suggestion');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto Categorization
  const autoCategorize = useCallback(async (nftData: any, imageUrl?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-nft-analysis', {
        body: { action: 'auto_categorization', nftData, imageUrl }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to categorize');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Whale Activity Tracker
  const trackWhaleActivity = useCallback(async (nftData: any, marketData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-nft-analysis', {
        body: { action: 'whale_tracking', nftData, marketData }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to track whale activity');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Collection Curation
  const curateCollection = useCallback(async (nftData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-nft-analysis', {
        body: { action: 'collection_curation', nftData }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to curate collection');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Dynamic Pricing Suggestion
  const getDynamicPricing = useCallback(async (nftData: any, marketData?: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-nft-analysis', {
        body: { action: 'dynamic_pricing', nftData, marketData }
      });

      if (fnError) throw fnError;
      return data?.result;
    } catch (err: any) {
      setError(err.message || 'Failed to get pricing suggestion');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    generateArt,
    getRarityScore,
    detectFakeArt,
    predictPrice,
    generateMetadata,
    detectWashTrading,
    getRecommendations,
    visualSearch,
    analyzeSentiment,
    getSmartBid,
    autoCategorize,
    trackWhaleActivity,
    curateCollection,
    getDynamicPricing,
  };
};
