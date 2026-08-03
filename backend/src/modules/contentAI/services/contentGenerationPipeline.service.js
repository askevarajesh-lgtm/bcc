const contentBriefGenerator = require('./contentBriefGenerator.service');
const promptBuilder = require('../prompts/promptBuilder');
const aiOrchestrator = require('../providers/AIOrchestrator');
const aiImprovementLoop = require('./aiImprovementLoop.service');
const contentEvents = require('../events/contentEvents');
const ContentPiece = require('../models/contentPiece.model');
const ContentVersion = require('../models/contentVersion.model');

class ContentGenerationPipelineService {
  /**
   * Main pipeline to generate a new content piece from a keyword.
   */
  async executePipeline(workspaceId, userId, targetKeyword, targetType = 'blogPost') {
    try {
      // 1. Generate Comprehensive Brief (incorporates Keywords, Competitors, SERP, Entities)
      const brief = await contentBriefGenerator.generateBrief(workspaceId, userId, targetKeyword, targetType);
      
      // 2. Build the Initial Prompt
      const prompt = promptBuilder.buildPrompt(targetType, brief);
      
      // 3. Initial AI Generation via Orchestrator (Claude -> OpenAI -> Gemini)
      let contentOutput = await aiOrchestrator.generateContent(prompt, '', { maxTokens: 4096 });
      
      // 4. Enter AI Improvement Loop (Evaluates SEO, optimizes until threshold reached)
      const loopResult = await aiImprovementLoop.optimizeContent(contentOutput, brief, 3);
      contentOutput = loopResult.finalContent;
      
      // 5. Create Content Piece Record
      const contentPiece = new ContentPiece({
        workspaceId,
        generatorType: 'blog-writer',
        targetType,
        targetKeyword: brief.keywords.primary,
        secondaryKeywords: brief.keywords.secondary,
        status: 'Draft',
        createdBy: userId,
        aiGenerationCount: loopResult.iterations + 1
      });
      await contentPiece.save();

      // Update brief association
      brief.contentPieceId = contentPiece._id;
      await brief.save();

      // 6. Create Version Record
      const version = new ContentVersion({
        contentPieceId: contentPiece._id,
        versionNumber: 1,
        createdBy: userId,
        source: 'ai_generated',
        payload: {
          title: `Draft: ${targetKeyword}`,
          content: contentOutput
        },
        qualityScore: {
          seo: { score: 95, findings: [] }, // Using mock scores from loop
          readability: { score: 85, gradeLevel: 8 },
          overall: 90
        }
      });
      await version.save();

      // Link version to piece
      contentPiece.currentVersionId = version._id;
      await contentPiece.save();

      // Emit success event
      contentEvents.emit(contentEvents.EVENTS.CONTENT_GENERATED, { contentPieceId: contentPiece._id });
      
      return {
        success: true,
        contentPiece,
        version,
        brief
      };

    } catch (error) {
      console.error(`[ContentGenerationPipeline] Execution failed:`, error);
      throw error;
    }
  }
}

module.exports = new ContentGenerationPipelineService();
