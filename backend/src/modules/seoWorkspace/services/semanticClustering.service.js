const natural = require('natural');

class SemanticClusteringService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfIdf = new natural.TfIdf();
  }

  /**
   * Groups a list of keywords into semantic clusters based on shared terms.
   * @param {Array<{ _id: string, keyword: string, searchVolume: number }>} keywords 
   * @param {number} similarityThreshold 0 to 1
   * @returns {Array<{ clusterId: string, parentKeyword: string, members: string[], clusterScore: number, clusterConfidence: number }>}
   */
  clusterKeywords(keywords, similarityThreshold = 0.4) {
    if (!keywords || keywords.length === 0) return [];

    // Sort keywords by search volume descending. Highest volume becomes the parent.
    const sorted = [...keywords].sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0));
    const clusters = [];
    const unclustered = new Set(sorted.map(k => k.keyword));

    const jaroWinkler = natural.JaroWinklerDistance;

    while (unclustered.size > 0) {
      // The highest volume remaining keyword becomes a new parent
      const parentCandidate = sorted.find(k => unclustered.has(k.keyword));
      if (!parentCandidate) break;

      const currentCluster = {
        parentKeyword: parentCandidate.keyword,
        members: [parentCandidate.keyword],
        clusterScore: parentCandidate.searchVolume || 0,
        clusterConfidence: 100 // parent to itself is 100%
      };
      
      unclustered.delete(parentCandidate.keyword);

      // Find children
      const parentTokens = new Set(this.tokenizer.tokenize(parentCandidate.keyword.toLowerCase()));

      for (const candidate of sorted) {
        if (!unclustered.has(candidate.keyword)) continue;
        
        let similarity = jaroWinkler(parentCandidate.keyword.toLowerCase(), candidate.keyword.toLowerCase());
        
        // Boost similarity if they share exact words
        const candidateTokens = this.tokenizer.tokenize(candidate.keyword.toLowerCase());
        const intersection = candidateTokens.filter(t => parentTokens.has(t));
        if (intersection.length > 0) {
           similarity += (intersection.length / Math.max(parentTokens.size, candidateTokens.size)) * 0.5;
        }

        if (similarity >= similarityThreshold) {
          currentCluster.members.push(candidate.keyword);
          currentCluster.clusterScore += candidate.searchVolume || 0;
          unclustered.delete(candidate.keyword);
        }
      }

      currentCluster.clusterConfidence = Math.min(100, Math.round(70 + (currentCluster.members.length * 2)));
      clusters.push(currentCluster);
    }

    return clusters;
  }
}

module.exports = new SemanticClusteringService();
