const AiAsset = require('./models/aiAsset.model');
const AiSettings = require('./models/aiSettings.model');
const AiConversation = require('./models/aiConversation.model');
const cryptoUtils = require('../../utils/crypto');
const axios = require('axios'); // For making API requests if needed

// --- Settings Endpoints ---

const saveSettings = async (req, res) => {
  try {
    const { openaiApiKey, isEnabled, model } = req.body;
    const workspaceId = req.companyId || req.workspaceId;

    if (!workspaceId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No workspace context' });
    }

    const updateFields = {};

    if (openaiApiKey !== undefined) {
      if (openaiApiKey.trim() !== '') {
        updateFields.openaiApiKey = cryptoUtils.encrypt(openaiApiKey.trim());
      } else {
        updateFields.openaiApiKey = null;
      }
    }

    if (isEnabled !== undefined) {
      updateFields.isEnabled = isEnabled;
    }

    if (model !== undefined) {
      updateFields.model = model;
    }

    await AiSettings.findOneAndUpdate(
      { workspaceId },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSettingsStatus = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    if (!workspaceId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No workspace context' });
    }

    const settings = await AiSettings.findOne({ workspaceId });
    let isConfigured = false;
    let maskedKey = '';
    let isEnabled = true;
    let model = 'gpt-4o-mini';

    if (settings) {
      if (settings.isEnabled !== undefined) isEnabled = settings.isEnabled;
      if (settings.model) model = settings.model;
      
      if (settings.openaiApiKey) {
        isConfigured = true;
        const decrypted = cryptoUtils.decrypt(settings.openaiApiKey);
        if (decrypted && decrypted.length > 8) {
          maskedKey = decrypted.substring(0, 4) + '...' + decrypted.substring(decrypted.length - 4);
        } else {
          maskedKey = 'sk-...';
        }
      }
    }

    return res.status(200).json({ success: true, data: { isConfigured, maskedKey, isEnabled, model } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Generation Endpoints ---

const generateImage = async (req, res) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });

    const workspaceId = req.companyId || req.workspaceId;
    let apiKey = process.env.OPENAI_API_KEY;

    if (workspaceId) {
      const settings = await AiSettings.findOne({ workspaceId });
      if (settings && settings.openaiApiKey) {
        apiKey = cryptoUtils.decrypt(settings.openaiApiKey) || apiKey;
      }
    }

    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'OpenAI API key is missing. Please configure it in settings.' });
    }

    // Map UI models to OpenAI models
    let openAiModel = 'gpt-image-2';
    if (model === 'GPT-5.4' || model === 'GPT-5.4 mini') openAiModel = 'gpt-image-1';

    let imageUrl = '';
    try {
      console.log(`Generating image with OpenAI model: ${openAiModel}`);
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        { prompt, model: openAiModel, n: 1, size: '1024x1024' },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      const imageData = response.data.data[0];
      imageUrl = imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : '');
      
      if (!imageUrl) {
        throw new Error('No image URL or base64 data returned from API');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message;
      console.error(`OpenAI Error for ${openAiModel}:`, errorMessage);
      
      // Fallback to gpt-image-1 if gpt-image-2 is not available for this API key
      if (openAiModel === 'gpt-image-2' && (errorMessage.includes('does not exist') || errorMessage.includes('gpt-image-2'))) {
        console.log('Falling back to gpt-image-1...');
        try {
          const fallbackResponse = await axios.post(
            'https://api.openai.com/v1/images/generations',
            { prompt, model: 'gpt-image-1', n: 1, size: '1024x1024' },
            { headers: { Authorization: `Bearer ${apiKey}` } }
          );
          const fallbackData = fallbackResponse.data.data[0];
          imageUrl = fallbackData.url || (fallbackData.b64_json ? `data:image/png;base64,${fallbackData.b64_json}` : '');
          
          if (!imageUrl) {
             throw new Error('No image URL or base64 data returned from API on fallback');
          }
        } catch (fallbackErr) {
          const fallbackErrorMessage = fallbackErr.response?.data?.error?.message || fallbackErr.message;
          console.error(`OpenAI Fallback Error for gpt-image-1:`, fallbackErrorMessage);
          return res.status(400).json({ success: false, message: fallbackErrorMessage || 'OpenAI failed to generate the image with both models.' });
        }
      } else {
        return res.status(400).json({ success: false, message: errorMessage || 'OpenAI failed to generate the image.' });
      }
    }

    console.log('Final imageUrl before sending response:', imageUrl);
    return res.status(200).json({ success: true, data: { url: imageUrl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const generateVideo = async (req, res) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });

    console.log(`Video generation requested with model: ${model || 'default'}`);

    return res.status(400).json({ success: false, message: 'OpenAI does not currently support video generation via public API (Sora is not publicly available).' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Asset Endpoints ---

const saveAsset = async (req, res) => {
  try {
    const { type, prompt, url } = req.body;
    const workspaceId = req.companyId || req.workspaceId; 
    const createdBy = req.user?._id;

    if (!workspaceId) return res.status(401).json({ success: false, message: 'Unauthorized: No workspace context' });

    const asset = new AiAsset({
      workspaceId,
      type,
      prompt,
      url,
      createdBy
    });

    await asset.save();
    return res.status(201).json({ success: true, message: 'Asset saved to library', data: { asset } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAssets = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    if (!workspaceId) return res.status(401).json({ success: false, message: 'Unauthorized: No workspace context' });

    const assets = await AiAsset.find({ workspaceId, isDeleted: false }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: { assets } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.companyId || req.workspaceId;

    const asset = await AiAsset.findOneAndUpdate(
      { _id: id, workspaceId },
      { isDeleted: true },
      { new: true }
    );

    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    return res.status(200).json({ success: true, message: 'Asset deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const uploadAiFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: {
        url: req.file.path,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Chat Endpoints ---

const getConversations = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    if (!workspaceId) return res.status(401).json({ success: false, message: 'Unauthorized: No workspace context' });

    const conversations = await AiConversation.find({ workspaceId, isDeleted: false })
      .select('title updatedAt')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, data: { conversations } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.companyId || req.workspaceId;

    const conversation = await AiConversation.findOne({ _id: id, workspaceId, isDeleted: false });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    return res.status(200).json({ success: true, data: { conversation } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.companyId || req.workspaceId;

    const conversation = await AiConversation.findOneAndUpdate(
      { _id: id, workspaceId },
      { isDeleted: true },
      { new: true }
    );

    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
    return res.status(200).json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { sessionId, content, attachment } = req.body;
    const workspaceId = req.companyId || req.workspaceId;
    const createdBy = req.user?._id;

    if (!workspaceId) return res.status(401).json({ success: false, message: 'Unauthorized: No workspace context' });
    if (!content) return res.status(400).json({ success: false, message: 'Message content is required' });

    // 1. Get settings and API Key
    const settings = await AiSettings.findOne({ workspaceId });
    if (!settings || !settings.isEnabled) {
      return res.status(403).json({ success: false, message: 'AI Assistant is currently disabled' });
    }

    let apiKey = process.env.OPENAI_API_KEY;
    if (settings && settings.openaiApiKey) {
      apiKey = cryptoUtils.decrypt(settings.openaiApiKey) || apiKey;
    }

    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'OpenAI API Key is missing. Please configure it in settings.' });
    }

    const openAiModel = settings.model || 'gpt-4o-mini';

    // 2. Fetch or create conversation
    let conversation;
    if (sessionId) {
      conversation = await AiConversation.findOne({ _id: sessionId, workspaceId, isDeleted: false });
      if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
    } else {
      let title = content.substring(0, 30);
      if (content.length > 30) title += '...';
      
      conversation = new AiConversation({
        workspaceId,
        title,
        createdBy,
        messages: []
      });
    }

    // 3. Append user message
    const userMessage = { role: 'user', content, timestamp: new Date() };
    if (attachment) {
      userMessage.attachment = attachment;
    }
    conversation.messages.push(userMessage);

    // 4. Call OpenAI API
    const openAiMessages = conversation.messages.map(msg => {
      let msgContent = msg.content;
      if (msg.role === 'user' && msg.attachment) {
        msgContent += `\n[User attached a file: ${msg.attachment.name}]`;
      }
      return { role: msg.role, content: msgContent };
    });
    
    // Add system prompt if needed
    openAiMessages.unshift({ role: 'system', content: 'You are a helpful assistant.' });

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_image",
          description: "Generates an image based on a prompt. Use this ONLY when the user explicitly asks to generate, create, or draw an image, picture, or photo.",
          parameters: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "The detailed prompt to generate the image.",
              },
            },
            required: ["prompt"],
          },
        },
      }
    ];

    let aiContent = '';
    let aiImageUrl = '';
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: openAiModel,
          messages: openAiMessages,
          tools: tools,
          tool_choice: "auto"
        },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      
      const responseMessage = response.data.choices[0].message;

      if (responseMessage.tool_calls && responseMessage.tool_calls[0].function.name === 'generate_image') {
        const functionArgs = JSON.parse(responseMessage.tool_calls[0].function.arguments);
        const imagePrompt = functionArgs.prompt;

        try {
          const imageResponse = await axios.post(
            'https://api.openai.com/v1/images/generations',
            { prompt: imagePrompt, model: 'gpt-image-2', n: 1, size: '1024x1024' },
            { headers: { Authorization: `Bearer ${apiKey}` } }
          );
          const imageData = imageResponse.data.data[0];
          aiImageUrl = imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : '');
          aiContent = "Here is the image you requested.";
        } catch (imgErr) {
          const dallE3Error = imgErr.response?.data?.error?.message || imgErr.message;
          try {
            const fallbackResponse = await axios.post(
              'https://api.openai.com/v1/images/generations',
              { prompt: imagePrompt, model: 'gpt-image-1', n: 1, size: '1024x1024' },
              { headers: { Authorization: `Bearer ${apiKey}` } }
            );
            const fallbackData = fallbackResponse.data.data[0];
            aiImageUrl = fallbackData.url || (fallbackData.b64_json ? `data:image/png;base64,${fallbackData.b64_json}` : '');
            aiContent = "Here is the image you requested.";
          } catch (fallbackErr) {
            console.error('OpenAI Image Generation Error:', fallbackErr.response?.data || fallbackErr.message);
            aiContent = `Failed to generate image.\n\nGPT-Image-2 Error: ${dallE3Error}\n\nGPT-Image-1 Error: ${fallbackErr.response?.data?.error?.message || fallbackErr.message}`;
            // Let the aiContent contain the error message, and no image will be returned
          }
        }
      } else {
        aiContent = responseMessage.content;
      }
    } catch (err) {
      console.error('OpenAI API Error:', err.response?.data || err.message);
      return res.status(500).json({ 
        success: false, 
        message: err.response?.data?.error?.message || 'Failed to generate response from OpenAI.' 
      });
    }

    // 5. Append AI message and save
    const aiMessage = { role: 'assistant', content: aiContent, timestamp: new Date() };
    if (aiImageUrl) aiMessage.imageUrl = aiImageUrl;
    
    conversation.messages.push(aiMessage);
    await conversation.save();

    // 6. Return new messages to frontend
    // Get the actually inserted messages (with _id generated by mongoose)
    const savedUserMessage = conversation.messages[conversation.messages.length - 2];
    const savedAiMessage = conversation.messages[conversation.messages.length - 1];

    return res.status(200).json({ 
      success: true, 
      data: {
        sessionId: conversation._id,
        title: conversation.title,
        userMessage: savedUserMessage,
        aiMessage: savedAiMessage
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateImage,
  generateVideo,
  saveAsset,
  getAssets,
  deleteAsset,
  saveSettings,
  getSettingsStatus,
  getConversations,
  getConversation,
  deleteConversation,
  sendMessage,
  uploadAiFile
};
