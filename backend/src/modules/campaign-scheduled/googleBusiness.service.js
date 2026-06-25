const axios = require("axios");
const { google } = require("googleapis");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Fetch Google Business Accounts
 * @param {string} accessToken
 */
async function fetchGBPAccounts(accessToken) {
  const response = await axios.get(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  return response.data.accounts || [];
}

/**
 * Fetch Locations for a GBP Account
 * @param {string} accountName
 * @param {string} accessToken
 */
async function fetchGBPLocations(accountName, accessToken) {
  const response = await axios.get(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        readMask: "name,title,storefrontAddress,categories,phoneNumbers",
      },
    },
  );
  return response.data.locations || [];
}

/**
 * Post to Google Business Profile
 * @param {Object} account - CampaignScheduledAccount document
 * @param {Object} post - CampaignScheduledPost document
 */
async function postToGoogleBusiness(account, post) {
  const accessToken = await getValidGBPToken(account);
  const locationName = account.gbp_location_id; // Format: accounts/{accountId}/locations/{locationId}

  const postOption = post.post_option?.google_business || "update"; // update, offer, announcement

  let gbpPost = {
    summary: post.caption,
  };

  if (post.media_url) {
    gbpPost.media = [
      {
        mediaFormat: post.media_url.match(/\.(mp4|mov|avi|webm|mkv)$/i)
          ? "VIDEO"
          : "PHOTO",
        sourceUrl: post.media_url,
      },
    ];
  }

  // Simplified handling for offers and announcements
  if (postOption === "offer") {
    gbpPost.offer = {
      couponCode: post.post_option?.couponCode || "",
      redeemOnlineUrl: post.post_option?.redeemUrl || "",
      termsAndConditions: post.post_option?.terms || "",
    };
  }

  const response = await axios.post(
    `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`,
    gbpPost,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return {
    externalId: response.data.name,
    url:
      response.data.searchUrl ||
      `https://business.google.com/posts/l/${locationName.split("/").pop()}`,
  };
}

/**
 * Fetch Reviews for a Location
 * @param {string} locationName
 * @param {string} accessToken
 */
async function fetchGBPReviews(locationName, accessToken) {
  const response = await axios.get(
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  return response.data.reviews || [];
}

/**
 * Reply to a Review
 * @param {string} reviewName
 * @param {string} accessToken
 * @param {string} replyText
 */
async function replyToGBPReview(reviewName, accessToken, replyText) {
  const response = await axios.put(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    { comment: replyText },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  return response.data;
}

/**
 * Get Valid GBP Token (handles refresh)
 * @param {Object} account
 */
async function getValidGBPToken(account) {
  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at && account.expires_at > now + 60) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new Error("No refresh token available for Google Business Profile");
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: account.refresh_token,
  });

  const { token } = await oauth2Client.getAccessToken();
  if (!token) throw new Error("Failed to refresh Google access token");

  // Update account in background
  const Account = require("./campaignScheduled.account.model");
  await Account.updateOne(
    { _id: account._id },
    {
      $set: {
        access_token: token,
        expires_at: now + 3500, // Google tokens usually last 1 hour
      },
    },
  );

  return token;
}

module.exports = {
  fetchGBPAccounts,
  fetchGBPLocations,
  postToGoogleBusiness,
  fetchGBPReviews,
  replyToGBPReview,
  getValidGBPToken,
};
