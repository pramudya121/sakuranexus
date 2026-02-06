import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, imageUrl, nftData, marketData, userAddress } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let prompt = "";
    let systemPrompt = "";

    switch (action) {
      case "rarity_score":
        systemPrompt = "You are an expert NFT analyst specializing in rarity scoring. Analyze the NFT and provide detailed rarity metrics.";
        prompt = `Analyze this NFT for rarity scoring:
Name: ${nftData?.name || "Unknown"}
Description: ${nftData?.description || "No description"}
Image URL: ${imageUrl || "No image"}

Provide a JSON response with:
{
  "rarityScore": number (0-100),
  "rarityTier": "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic",
  "uniqueTraits": [list of unique features],
  "marketComparison": "analysis text",
  "estimatedValue": { "low": number, "mid": number, "high": number },
  "confidence": number (0-100)
}`;
        break;

      case "fake_detection":
        systemPrompt = "You are a digital forensics expert specializing in detecting fake, stolen, or copied NFT artwork. Be thorough and skeptical.";
        prompt = `Analyze this NFT for authenticity:
Name: ${nftData?.name || "Unknown"}
Image URL: ${imageUrl || "No image"}
Creator: ${nftData?.creatorAddress || "Unknown"}

Check for:
1. Signs of image manipulation or AI generation
2. Similarity to known stolen artwork patterns
3. Metadata inconsistencies
4. Red flags in naming/description

Provide a JSON response with:
{
  "authenticityScore": number (0-100),
  "isSuspicious": boolean,
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "warnings": [list of warnings],
  "recommendations": [list of recommendations],
  "similarArtworks": [potential matches if any]
}`;
        break;

      case "price_prediction":
        systemPrompt = "You are an NFT market analyst with expertise in price prediction based on market trends, rarity, and historical data.";
        prompt = `Predict price trends for this NFT:
Name: ${nftData?.name || "Unknown"}
Current Price: ${nftData?.price || "Not listed"}
Historical Sales: ${JSON.stringify(marketData?.salesHistory || [])}
Market Trends: ${JSON.stringify(marketData?.trends || {})}

Provide a JSON response with:
{
  "currentValuation": number,
  "prediction7Days": { "price": number, "confidence": number, "trend": "up" | "down" | "stable" },
  "prediction30Days": { "price": number, "confidence": number, "trend": "up" | "down" | "stable" },
  "prediction90Days": { "price": number, "confidence": number, "trend": "up" | "down" | "stable" },
  "marketSentiment": "Bullish" | "Bearish" | "Neutral",
  "factors": [key price factors],
  "recommendations": "buy" | "hold" | "sell"
}`;
        break;

      case "metadata_generation":
        systemPrompt = "You are a creative NFT metadata specialist. Generate compelling, SEO-optimized metadata for NFTs.";
        prompt = `Generate metadata for this NFT artwork:
Image URL: ${imageUrl || "No image"}
User's suggested name: ${nftData?.suggestedName || ""}
User's notes: ${nftData?.notes || ""}

Provide a JSON response with:
{
  "name": "creative NFT name",
  "description": "engaging 2-3 sentence description",
  "tags": [list of 5-10 relevant tags],
  "category": "Art" | "Photography" | "Music" | "Video" | "3D" | "Collectible",
  "attributes": [{ "trait_type": string, "value": string }],
  "seoTitle": "optimized title under 60 chars",
  "seoDescription": "optimized description under 160 chars"
}`;
        break;

      case "wash_trading_detection":
        systemPrompt = "You are a blockchain forensics analyst specializing in detecting wash trading and market manipulation.";
        prompt = `Analyze trading patterns for potential wash trading:
Token ID: ${nftData?.tokenId}
Recent Transactions: ${JSON.stringify(marketData?.transactions || [])}
Unique Addresses: ${marketData?.uniqueAddresses || 0}

Check for:
1. Circular trading patterns
2. Self-dealing through multiple wallets
3. Artificially inflated prices
4. Suspicious timing patterns

Provide a JSON response with:
{
  "washTradingRisk": number (0-100),
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "suspiciousPatterns": [detected patterns],
  "flaggedAddresses": [addresses with suspicious behavior],
  "volumeInflation": number (percentage of potentially fake volume),
  "recommendation": "text explaining findings"
}`;
        break;

      case "recommendations":
        systemPrompt = "You are a personalized NFT recommendation engine. Suggest NFTs based on user preferences and collection history.";
        prompt = `Generate NFT recommendations for user:
Wallet Address: ${userAddress}
Current Holdings: ${JSON.stringify(nftData?.holdings || [])}
Previous Purchases: ${JSON.stringify(nftData?.purchases || [])}
Watchlist: ${JSON.stringify(nftData?.watchlist || [])}
Available NFTs: ${JSON.stringify(marketData?.available || [])}

Provide a JSON response with:
{
  "recommendations": [
    {
      "tokenId": number,
      "reason": "why recommended",
      "matchScore": number (0-100),
      "category": "Similar Style" | "Trending" | "Undervalued" | "Artist Match" | "Collection Complete"
    }
  ],
  "trendingCategories": [categories user might like],
  "investmentSuggestions": [potential good investments],
  "collectionGaps": [missing pieces for collections]
}`;
        break;

      case "sentiment_analysis":
        systemPrompt = "You are a social media and market sentiment analyst for NFTs and crypto.";
        prompt = `Analyze market sentiment:
NFT/Collection: ${nftData?.name || "General Market"}
Recent News: ${JSON.stringify(marketData?.news || [])}
Social Mentions: ${JSON.stringify(marketData?.socialMentions || [])}

Provide a JSON response with:
{
  "overallSentiment": "Very Bullish" | "Bullish" | "Neutral" | "Bearish" | "Very Bearish",
  "sentimentScore": number (-100 to 100),
  "socialBuzz": number (0-100),
  "keyTopics": [trending topics],
  "influencerMentions": number,
  "communityGrowth": number (percentage),
  "riskFactors": [potential concerns],
  "opportunities": [potential opportunities]
}`;
        break;

      case "smart_bidding":
        systemPrompt = "You are an expert NFT bidding strategist. Help users optimize their bids to win auctions at the best price.";
        prompt = `Suggest optimal bidding strategy:
NFT: ${nftData?.name}
Current Bid: ${marketData?.currentBid || 0}
Time Remaining: ${marketData?.timeRemaining || "Unknown"}
Bid History: ${JSON.stringify(marketData?.bidHistory || [])}
User's Budget: ${nftData?.budget || "Not specified"}
Floor Price: ${marketData?.floorPrice || 0}

Provide a JSON response with:
{
  "recommendedBid": number,
  "maxSuggestedBid": number,
  "strategy": "Aggressive" | "Conservative" | "Wait",
  "optimalBidTime": "timing suggestion",
  "winProbability": number (0-100),
  "reasoning": "explanation of strategy",
  "antiSnipeAlert": boolean,
  "competitorAnalysis": "analysis of other bidders"
}`;
        break;

      case "auto_categorization":
        systemPrompt = "You are an NFT categorization and tagging specialist. Automatically classify NFTs based on their visual and metadata content.";
        prompt = `Categorize and tag this NFT:
Name: ${nftData?.name || "Unknown"}
Description: ${nftData?.description || ""}
Image URL: ${imageUrl || "No image"}

Provide a JSON response with:
{
  "primaryCategory": "Art" | "Photography" | "Music" | "Video" | "3D" | "Gaming" | "Collectible" | "Utility" | "Domain" | "Virtual World",
  "subCategories": [list of subcategories],
  "artStyle": "style classification",
  "tags": [comprehensive tag list],
  "collections": [suggested collection matches],
  "mood": "emotional tone",
  "colorPalette": [dominant colors],
  "technicalDetails": { "medium": string, "dimensions": string, "format": string }
}`;
        break;

      case "whale_tracking":
        systemPrompt = "You are a blockchain analyst specializing in whale activity and large holder movements.";
        prompt = `Analyze whale activity:
Collection/Token: ${nftData?.name || "General"}
Recent Large Transactions: ${JSON.stringify(marketData?.largeTransactions || [])}
Top Holders: ${JSON.stringify(marketData?.topHolders || [])}

Provide a JSON response with:
{
  "whaleActivity": "High" | "Medium" | "Low",
  "recentWhaleActions": [{ "address": string, "action": "buy" | "sell", "amount": number, "timestamp": string }],
  "accumulationTrend": "Accumulating" | "Distributing" | "Stable",
  "topHolderConcentration": number (percentage held by top 10),
  "priceImpactRisk": "High" | "Medium" | "Low",
  "signals": [bullish or bearish signals],
  "alertLevel": "None" | "Watch" | "Alert" | "Critical"
}`;
        break;

      case "collection_curation":
        systemPrompt = "You are an AI art curator specializing in creating cohesive and valuable NFT collections.";
        prompt = `Curate a collection:
User's NFTs: ${JSON.stringify(nftData?.userNFTs || [])}
Theme Preference: ${nftData?.themePreference || "Any"}
Target Audience: ${nftData?.targetAudience || "General collectors"}

Provide a JSON response with:
{
  "curatedCollection": {
    "name": "suggested collection name",
    "description": "collection story/narrative",
    "theme": "unifying theme",
    "selectedNFTs": [token IDs to include],
    "orderSuggestion": [optimal display order],
    "coverImage": "suggested cover token ID"
  },
  "improvementSuggestions": [what to add to strengthen collection],
  "marketingAngle": "how to position this collection",
  "estimatedCollectionValue": number,
  "targetBuyers": [ideal buyer profiles]
}`;
        break;

      case "dynamic_pricing":
        systemPrompt = "You are a dynamic pricing algorithm for NFTs. Suggest optimal prices based on real-time market conditions.";
        prompt = `Calculate optimal price:
NFT: ${nftData?.name}
Current List Price: ${nftData?.currentPrice || "Not listed"}
Rarity Score: ${nftData?.rarityScore || "Unknown"}
Similar Sales: ${JSON.stringify(marketData?.similarSales || [])}
Market Conditions: ${JSON.stringify(marketData?.conditions || {})}
Days Listed: ${nftData?.daysListed || 0}

Provide a JSON response with:
{
  "suggestedPrice": number,
  "priceRange": { "min": number, "optimal": number, "max": number },
  "pricingStrategy": "Premium" | "Competitive" | "Value" | "Fire Sale",
  "marketTiming": "Good" | "Average" | "Poor",
  "adjustments": [{ "factor": string, "impact": number }],
  "expectedSaleTime": "estimated time to sell",
  "priceJustification": "explanation"
}`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { rawResponse: content };
    }

    return new Response(
      JSON.stringify({ action, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI NFT Analysis Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
