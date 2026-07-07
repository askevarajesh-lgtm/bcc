const AiAsset = require('./models/aiAsset.model');
const axios = require('axios'); // For making API requests if needed

// Mock AI Generators
const generateImageMock = async (prompt) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://picsum.photos/seed/${encodeURIComponent(prompt).substring(0, 10)}/800/600`);
    }, 2000);
  });
};

const generateVideoMock = async (prompt) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('https://www.w3schools.com/html/mov_bbb.mp4'); // Sample open source video
    }, 2500);
  });
};

const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });

    const userApiKey = req.headers['x-ai-api-key'];
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;

    let imageUrl = '';
    // Use OpenAI if key is present
    if (apiKey) {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/images/generations',
          { prompt, n: 1, size: '1024x1024' },
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        imageUrl = response.data.data[0].url;
      } catch (err) {
        console.error('OpenAI Error:', err.response?.data || err.message);
        // Fallback to mock
        imageUrl = await generateImageMock(prompt);
      }
    } else {
      imageUrl = await generateImageMock(prompt);
    }

    return res.status(200).json({ success: true, data: { url: imageUrl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const generateVideo = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });

    // Video generation mock
    const videoUrl = await generateVideoMock(prompt);

    return res.status(200).json({ success: true, data: { url: videoUrl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

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

module.exports = {
  generateImage,
  generateVideo,
  saveAsset,
  getAssets,
  deleteAsset
};
