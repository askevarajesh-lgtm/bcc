const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

class AiClientWrapper {
  constructor(apiKey, provider) {
    this.provider = provider || 'openai';
    if (this.provider === 'anthropic') {
      this.anthropic = new Anthropic({ apiKey });
    } else {
      this.openai = new OpenAI({ apiKey });
    }

    this.chat = {
      completions: {
        create: async (params) => {
          if (this.provider === 'openai') {
            return await this.openai.chat.completions.create(params);
          } else {
            // Anthropic logic
            let systemPrompt = '';
            const messages = [];
            for (const msg of params.messages) {
              if (msg.role === 'system') {
                systemPrompt += msg.content + '\n';
              } else {
                messages.push({ role: msg.role, content: msg.content });
              }
            }

            if (params.response_format && params.response_format.type === 'json_object') {
              systemPrompt += '\n\nYou must output ONLY valid JSON, with no markdown formatting or other text.';
            }

            // Map model to claude if needed
            let model = 'claude-sonnet-5'; // default for anthropic

            const anthropicParams = {
              model,
              max_tokens: params.max_tokens || 4096,
              messages
            };

            if (systemPrompt) anthropicParams.system = systemPrompt.trim();
            // Temperature is deprecated for this model, omitting it

            const msg = await this.anthropic.messages.create(anthropicParams);

            let textContent = '';
            if (msg && msg.content && msg.content.length > 0) {
              const textObj = msg.content.find(c => c.type === 'text');
              if (textObj) {
                textContent = textObj.text || '';
              } else {
                textContent = msg.content[0].text || ''; // fallback
              }
            }
            if (params.response_format && params.response_format.type === 'json_object' && textContent) {
              textContent = textContent.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
            }

            // Mock OpenAI response structure
            return {
              choices: [
                {
                  message: {
                    content: textContent
                  }
                }
              ]
            };
          }
        }
      }
    };
  }
}

module.exports = AiClientWrapper;
