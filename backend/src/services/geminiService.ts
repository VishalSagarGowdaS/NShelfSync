import { env } from '../config/env.js';

export interface ParsedDiscoveryIntent {
  intent: 'search' | 'recommendation' | 'comparison' | 'price_enquiry' | 'greeting' | 'clarification_needed';
  keywords: string;
  category?: string;
  maxBudget?: number;
  brand?: string;
  comparisonItems?: string[];
  followUpQuestion?: string;
  summary: string;
}

export async function parseCustomerMessageWithGemini(userMessage: string): Promise<ParsedDiscoveryIntent> {
  const prompt = `You are the AI engine for 'ShelfSync AI Assistant', a top Indian e-commerce platform.
Your ONLY role is product discovery, recommendation, comparison, and availability enquiries.
You NEVER process payments, carts, or orders.

Analyze this customer WhatsApp message: "${userMessage}"

Respond ONLY with valid JSON in this exact structure:
{
  "intent": "search" | "recommendation" | "comparison" | "price_enquiry" | "greeting" | "clarification_needed",
  "keywords": "search phrase to find in catalogue",
  "category": "electronics" | "fashion" | "home-kitchen" | "grocery" | "beauty-personal-care" | "sports-fitness" | null,
  "maxBudget": number or null (in Indian Rupees),
  "brand": "brand name or null",
  "comparisonItems": ["item1", "item2"] or null,
  "followUpQuestion": "brief helpful question if input is too vague" or null,
  "summary": "1 sentence explanation of what the user is looking for"
}`;

  if (env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('placeholder')) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          return {
            intent: parsed.intent || 'recommendation',
            keywords: parsed.keywords || userMessage,
            category: parsed.category || undefined,
            maxBudget: parsed.maxBudget ? Number(parsed.maxBudget) : undefined,
            brand: parsed.brand || undefined,
            comparisonItems: parsed.comparisonItems || undefined,
            followUpQuestion: parsed.followUpQuestion || undefined,
            summary: parsed.summary || 'Customer product enquiry',
          };
        }
      }
    } catch (err: any) {
      console.warn('[Gemini AI] Live API call notice:', err.message);
    }
  }

  // Robust Rule-Based Natural Language Parser Fallback
  return fallbackIntentParser(userMessage);
}

function fallbackIntentParser(msg: string): ParsedDiscoveryIntent {
  const lower = msg.toLowerCase();

  // Extract budget: "under 1000", "below 2000", "within 1500"
  const budgetMatch = lower.match(/(?:under|below|less than|within|<)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  const maxBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : undefined;

  let category: string | undefined;
  if (/earphone|headphone|phone|watch|laptop|gadget|charger|buds/i.test(lower)) {
    category = 'electronics';
  } else if (/kurta|dress|jeans|shirt|shoe|wear|fashion/i.test(lower)) {
    category = 'fashion';
  } else if (/cooker|mixer|grinder|flask|bottle|kitchen|pan/i.test(lower)) {
    category = 'home-kitchen';
  } else if (/tea|rice|oil|muesli|grocery|grain/i.test(lower)) {
    category = 'grocery';
  } else if (/shampoo|serum|cream|oil|skincare|moisturizer/i.test(lower)) {
    category = 'beauty-personal-care';
  } else if (/yoga|mat|football|dumbbells|protein|whey|fitness/i.test(lower)) {
    category = 'sports-fitness';
  }

  let brand: string | undefined;
  const knownBrands = ['boat', 'noise', 'oneplus', 'realme', 'asus', 'fabindia', 'levis', 'prestige', 'pigeon', 'fortune', 'mamaearth', 'minimalist', 'boldfit'];
  for (const b of knownBrands) {
    if (lower.includes(b)) {
      brand = b;
      break;
    }
  }

  const isGreeting = /^(hi|hello|hey|namaste|good morning|good evening)/i.test(lower.trim());

  return {
    intent: isGreeting ? 'greeting' : 'recommendation',
    keywords: msg.replace(/(?:under|below|less than|within|<)\s*(?:₹|rs\.?|inr)?\s*\d+/gi, '').trim(),
    category,
    maxBudget,
    brand,
    summary: `Customer search for ${category || 'products'}${maxBudget ? ` under ₹${maxBudget}` : ''}`,
  };
}
