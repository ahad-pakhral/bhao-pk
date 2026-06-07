import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const aiService = {
  /**
   * Interprets a natural language search query using Gemini, extracting the core
   * product search keywords, or falls back to a rule-based NLP local parser.
   */
  interpretQuery: async (query: string): Promise<{ query: string; interpreted: boolean }> => {
    if (!query || query.trim().length === 0) {
      return { query, interpreted: false };
    }

    // Check if it's natural language. If it has less than 3 words and no NL words, skip interpretation
    const words = query.trim().split(/\s+/);
    const hasNlIndicator = /^(i|im|ill|want|need|looking|prefer|like|buy|for|budget|cheap|expensive|vs|but|so|instead)\b/i.test(query) || words.length > 3;

    if (!hasNlIndicator) {
      return { query, interpreted: false };
    }

    if (GEMINI_API_KEY) {
      try {
        const prompt = `Extract the single most relevant e-commerce search query (brand and product/model name) from this natural language query. Remove all conversational words, budget constraints, personal preferences, and comparisons.
Examples:
"I like apple but im low on budget so ill go for a casio" -> "casio watch"
"Looking for a cheap phone from samsung or xiaomi" -> "samsung xiaomi phone"
"my friend suggested a dell laptop but i want HP" -> "hp laptop"
Input: "${query}"
Output the clean search terms only. No explanations, no quotes, no extra text.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }]
            })
          }
        );

        if (response.ok) {
          const data = (await response.json()) as any;
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            // Clean up any quotes or punctuation that the LLM might have returned
            const cleanText = text.replace(/["'‘’.?!]/g, '').trim();
            if (cleanText.toLowerCase() !== query.toLowerCase() && cleanText.length > 0) {
              console.log(`[AI] Interpreted query: "${query}" -> "${cleanText}"`);
              return { query: cleanText, interpreted: true };
            }
          }
        } else {
          console.warn('[AI] Gemini interpretation request failed with status:', response.status);
        }
      } catch (e) {
        console.error('[AI] Gemini interpretation failed:', e);
      }
    }

    // Fallback local query parser
    const cleanQuery = fallbackQueryParser(query);
    if (cleanQuery.toLowerCase() !== query.toLowerCase() && cleanQuery.length > 0) {
      console.log(`[AI-Fallback] Interpreted query: "${query}" -> "${cleanQuery}"`);
      return { query: cleanQuery, interpreted: true };
    }

    return { query, interpreted: false };
  },

  /**
   * Batches product titles and queries Gemini to extract structured brand names
   * mapped by product ID, falling back to local word-boundary detection.
   */
  extractBrands: async (products: Array<{ id: string; name: string }>): Promise<Record<string, string>> => {
    const results: Record<string, string> = {};
    if (products.length === 0) return results;

    if (GEMINI_API_KEY) {
      try {
        const prompt = `Identify the brand name for each of the following product titles. Return a strict JSON object mapping the product id (as string) to the extracted brand name. Keep the brand name clean, standard capitalization, and concise (e.g. "Samsung", "Sony", "Nike", "Generic"). If the brand is unknown or not clear, return "Generic".
Products:
${JSON.stringify(products)}

Return ONLY the raw JSON object, no markdown formatting (do not wrap in \`\`\`json), no code blocks, no explanations.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }]
            })
          }
        );

        if (response.ok) {
          const data = (await response.json()) as any;
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            // Remove markdown code block wrappers if returned by the LLM
            const jsonText = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
            try {
              const mappedBrands = JSON.parse(jsonText);
              console.log(`[AI] Dynamic brand extraction succeeded for ${Object.keys(mappedBrands).length} items`);
              return mappedBrands;
            } catch (jsonErr) {
              console.error('[AI] Failed to parse brand JSON from text:', text);
            }
          }
        }
      } catch (e) {
        console.error('[AI] Gemini brand extraction failed:', e);
      }
    }

    // Fallback brand extraction using local first word rules
    console.log('[AI-Fallback] Running local fallback brand extraction');
    for (const p of products) {
      results[p.id] = fallbackBrandDetector(p.name);
    }
    return results;
  }
};

function fallbackQueryParser(query: string): string {
  let q = query.toLowerCase();
  
  // Look for contrast patterns: a contrast word followed by a brand from our list
  const brands = ['apple', 'samsung', 'xiaomi', 'casio', 'nike', 'hp', 'dell', 'lenovo', 'asus', 'sony', 'infinix', 'tecno'];
  const contrastWords = ['but', 'so', 'go', 'instead', 'prefer', 'want', 'get', 'for'];
  
  let targetBrand = '';
  const words = q.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    if (contrastWords.includes(words[i])) {
      // Check next words for a brand name
      for (let j = i + 1; j <= Math.min(i + 3, words.length - 1); j++) {
        const potentialBrand = words[j].replace(/[^a-z0-9]/g, '');
        if (brands.includes(potentialBrand)) {
          targetBrand = potentialBrand;
          break;
        }
      }
      if (targetBrand) break;
    }
  }

  if (targetBrand) {
    const categories = ['watch', 'phone', 'laptop', 'tablet', 'shoes', 'tv', 'headphone', 'earbud', 'earbuds', 'camera', 'charger'];
    let targetCategory = '';
    for (const cat of categories) {
      if (q.includes(cat)) {
        targetCategory = cat;
        break;
      }
    }
    return targetCategory ? `${targetBrand} ${targetCategory}` : targetBrand;
  }

  // Remove common prefix noise
  q = q.replace(/^(i like|i want|looking for|cheap|expensive|suggest|buy|llike)\s+/i, '');
  // Clean up filler words
  q = q.replace(/\b(i|im|ill|but|so|go|for|on|budget|to|than|instead|of|would|low|llow|suggested|friend|am|will|work)\b/g, '');
  
  // Remove multiple spaces
  return q.replace(/\s+/g, ' ').trim();
}

function fallbackBrandDetector(name: string): string {
  const commonBrands = [
    "Apple", "Samsung", "Xiaomi", "Casio", "Infinix", "Tecno", "Realme", "OnePlus",
    "Vivo", "Oppo", "Lenovo", "HP", "Dell", "Asus", "Acer", "Sony", "Canon", "Nikon",
    "Seiko", "Citizen", "Rolex", "Huawei", "Google", "Motorola", "Nokia", "LG", "TCL"
  ];
  const nameLower = name.toLowerCase();
  for (const b of commonBrands) {
    if (nameLower.includes(b.toLowerCase())) {
      return b;
    }
  }
  return "Generic";
}
