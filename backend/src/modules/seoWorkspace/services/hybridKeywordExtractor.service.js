const cheerio = require('cheerio');
const nlp = require('compromise');
// Plugins for compromise can be loaded here if needed

class HybridKeywordExtractor {
  constructor() {
    this.weights = {
      title: 15,
      meta_description: 10,
      meta_keywords: 8,
      h1: 12,
      h2: 9,
      h3: 7,
      h4_h6: 5,
      alt: 5,
      anchor: 8,
      internal_link: 8,
      structured: 10, // JSON-LD
      breadcrumb: 8,
      faq_schema: 10,
      product_schema: 12,
      org_schema: 6,
      table: 4,
      list: 4,
      paragraph: 2
    };

    this.stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'in', 'a', 'an', 'and', 'or', 'but',
      'for', 'with', 'about', 'as', 'by', 'to', 'of', 'from', 'that', 'this',
      'it', 'you', 'i', 'we', 'they', 'he', 'she', 'not', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'am'
    ]);
  }

  extractFromHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    const rawTerms = [];

    const addText = (text, source) => {
      if (!text || typeof text !== 'string') return;
      const clean = text.replace(/\s+/g, ' ').trim();
      if (clean) rawTerms.push({ text: clean, source });
    };

    // 1. Structural Tags
    addText($('title').text(), 'title');
    addText($('meta[name="description" i]').attr('content'), 'meta_description');
    addText($('meta[name="keywords" i]').attr('content'), 'meta_keywords');

    $('h1').each((_, el) => addText($(el).text(), 'h1'));
    $('h2').each((_, el) => addText($(el).text(), 'h2'));
    $('h3').each((_, el) => addText($(el).text(), 'h3'));
    $('h4, h5, h6').each((_, el) => addText($(el).text(), 'h4_h6'));
    
    // 2. Images (Alt Text)
    $('img').each((_, el) => addText($(el).attr('alt'), 'alt'));

    // 3. Anchors & Internal Links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      addText($(el).text(), 'anchor');
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        addText($(el).text(), 'internal_link');
      }
    });

    // 4. Structured Data (JSON-LD)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const parsed = JSON.parse($(el).html());
        this.extractFromJsonLd(parsed, rawTerms);
      } catch (e) { /* ignore parse errors */ }
    });

    // 5. Body Content
    $('p, span').each((_, el) => addText($(el).text(), 'paragraph'));
    $('li').each((_, el) => addText($(el).text(), 'list'));
    $('th, td').each((_, el) => addText($(el).text(), 'table'));

    return this.processTerms(rawTerms, baseUrl);
  }

  extractFromJsonLd(json, rawTerms) {
    if (typeof json === 'string') return;
    if (Array.isArray(json)) {
      json.forEach(item => this.extractFromJsonLd(item, rawTerms));
    } else if (typeof json === 'object' && json !== null) {
      const type = json['@type'] || '';
      const source = type === 'FAQPage' || type === 'Question' ? 'faq_schema' :
                     type === 'Product' ? 'product_schema' :
                     type === 'Organization' ? 'org_schema' :
                     type === 'BreadcrumbList' ? 'breadcrumb' : 'structured';

      if (json.name) rawTerms.push({ text: json.name, source });
      if (json.headline) rawTerms.push({ text: json.headline, source });
      if (json.description) rawTerms.push({ text: json.description, source });
      if (json.keywords) rawTerms.push({ text: json.keywords, source });
      if (json.acceptedAnswer && json.acceptedAnswer.text) rawTerms.push({ text: json.acceptedAnswer.text, source });

      Object.values(json).forEach(val => {
        if (typeof val === 'object') this.extractFromJsonLd(val, rawTerms);
      });
    }
  }

  processTerms(rawTerms, baseUrl) {
    const keywordMap = new Map();
    let totalText = "";

    rawTerms.forEach(({ text, source }) => {
      // Clean up text but preserve casing initially for NER
      const doc = nlp(text);
      doc.compute('root'); // Lemmatization

      // 1. Named Entity Recognition
      const entities = doc.topics().out('array');
      // 2. Noun Phrases
      const nouns = doc.nouns().out('array');
      // 3. Instead of ngrams (which requires a plugin in v14+), use terms
      const terms = doc.terms().out('array');

      const combined = [...new Set([...entities, ...nouns, ...terms])];

      combined.forEach(phrase => {
        // Phrase Normalization and Lemmatization
        let normalized = nlp(phrase).compute('root').text('root').toLowerCase().trim();
        
        // Stop Word Removal
        normalized = normalized.split(/\s+/).filter(w => !this.stopWords.has(w)).join(' ');

        if (normalized.length < 3 || normalized.length > 60) return; // filter noise
        if (/^\d+$/.test(normalized)) return; // skip pure numbers

        // Language detection hook could be added here if language-detect module was used

        const current = keywordMap.get(normalized) || { 
          keyword: normalized, 
          score: 0, 
          frequency: 0, 
          sources: new Map(), // mapping element -> count
          entities: new Set()
        };
        
        current.score += this.weights[source] || 1;
        current.frequency += 1;
        current.sources.set(source, (current.sources.get(source) || 0) + 1);
        
        // Track entities if this phrase matched an entity extraction
        if (entities.includes(phrase)) {
           current.entities.add(phrase);
        }

        keywordMap.set(normalized, current);
      });
    });

    return Array.from(keywordMap.values()).map(k => {
      // Calculate confidence based on score, frequency and sources diversity
      const diversity = k.sources.size;
      let confidence = Math.min(100, Math.round((k.score * 0.5) + (k.frequency * 2) + (diversity * 5)));
      
      return {
        keyword: k.keyword,
        score: k.score,
        frequency: k.frequency,
        confidence,
        entities: Array.from(k.entities),
        sourceElements: Array.from(k.sources.entries()).map(([element, count]) => ({ element, count }))
      };
    }).sort((a, b) => b.score - a.score);
  }
}

module.exports = new HybridKeywordExtractor();
