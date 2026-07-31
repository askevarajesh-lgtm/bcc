const cheerio = require('cheerio');
const nlp = require('compromise');

class HybridKeywordExtractor {
  constructor() {
    // Scoring weights based on positional importance
    this.weights = {
      title: 10,
      meta: 8,
      h1: 8,
      h2: 6,
      h3: 4,
      alt: 5,
      anchor: 6,
      structured: 7,
      body: 1
    };
  }

  /**
   * Parses HTML and extracts weighted keyword phrases.
   * @param {string} html 
   * @param {string} baseUrl 
   * @returns {Array<{ keyword: string, score: number, sources: string[] }>}
   */
  extractFromHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    const rawTerms = [];

    // Helper to push text with a specific source weight
    const addText = (text, source) => {
      if (!text || typeof text !== 'string') return;
      const clean = text.replace(/\s+/g, ' ').trim();
      if (clean) rawTerms.push({ text: clean, source });
    };

    // 1. Structural Tags
    addText($('title').text(), 'title');
    addText($('meta[name="description" i]').attr('content'), 'meta');
    $('h1').each((_, el) => addText($(el).text(), 'h1'));
    $('h2').each((_, el) => addText($(el).text(), 'h2'));
    $('h3').each((_, el) => addText($(el).text(), 'h3'));
    
    // 2. Images (Alt Text)
    $('img').each((_, el) => addText($(el).attr('alt'), 'alt'));

    // 3. Anchors & Internal Links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        // likely internal
        addText($(el).text(), 'anchor');
      }
    });

    // 4. Structured Data (JSON-LD)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const parsed = JSON.parse($(el).html());
        this.extractFromJsonLd(parsed).forEach(term => addText(term, 'structured'));
      } catch (e) { /* ignore parse errors */ }
    });

    // 5. Body Content (Paragraphs, List items)
    $('p, li, span').each((_, el) => addText($(el).text(), 'body'));

    // Process all extracted raw text blocks
    return this.processTerms(rawTerms);
  }

  extractFromJsonLd(json) {
    let terms = [];
    if (typeof json === 'string') return [json];
    if (Array.isArray(json)) {
      json.forEach(item => terms.push(...this.extractFromJsonLd(item)));
    } else if (typeof json === 'object' && json !== null) {
      if (json.name) terms.push(json.name);
      if (json.headline) terms.push(json.headline);
      if (json.description) terms.push(json.description);
      if (json.keywords) terms.push(json.keywords);
      if (json.about) terms.push(...this.extractFromJsonLd(json.about));
    }
    return terms.filter(Boolean);
  }

  processTerms(rawTerms) {
    const keywordMap = new Map();

    rawTerms.forEach(({ text, source }) => {
      const doc = nlp(text);
      
      // Extract entities (Organizations, Places, People, etc.)
      const entities = doc.topics().out('array');
      // Extract Nouns
      const nouns = doc.nouns().toSingular().out('array');
      // Extract phrases (N-grams approximation)
      const phrases = [];
      doc.terms().out('array').forEach(term => {
        if (term.length > 3) phrases.push(term);
      });

      const combined = [...new Set([...entities, ...nouns, ...phrases])];

      combined.forEach(phrase => {
        const normalized = phrase.toLowerCase().trim();
        if (normalized.length < 3 || normalized.length > 50) return; // filter noise

        const current = keywordMap.get(normalized) || { keyword: normalized, score: 0, count: 0, sources: new Set() };
        current.score += this.weights[source] || 1;
        current.count += 1;
        current.sources.add(source);
        keywordMap.set(normalized, current);
      });
    });

    return Array.from(keywordMap.values()).map(k => ({
      keyword: k.keyword,
      score: k.score,
      count: k.count,
      sources: Array.from(k.sources)
    })).sort((a, b) => b.score - a.score);
  }
}

module.exports = new HybridKeywordExtractor();
