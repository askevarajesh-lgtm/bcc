const { google } = require("googleapis");
const { randomUUID } = require("crypto");
const mongoose = require("mongoose");
const DiscoverySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 },
});
const Discovery =
  mongoose.models.Discovery || mongoose.model("Discovery", DiscoverySchema);
const Account = require("./campaignScheduled.account.model");
const gbpService = require("./googleBusiness.service");
const {
  upsertAccount,
  broadcastSSE,
  buildConnectionStatus,
  getAllAccounts,
} = require("./campaignScheduled.service");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_BUSINESS_REDIRECT_URI =
  process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
  `${process.env.APP_URL}/api/campaign-scheduled/auth/google-business/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_BUSINESS_REDIRECT_URI,
);

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/business.manage",
];

async function auth(req, res) {
  const companyId =
    req.query.companyId || req.session.campaignScheduledCompanyId;
  const clientCompanyId =
    req.query.clientCompanyId || req.session.campaignScheduledClientCompanyId;

  const state = JSON.stringify({
    uuid: randomUUID(),
    companyId,
    clientCompanyId,
  });

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: Buffer.from(state).toString("base64"),
    prompt: "consent",
  });

  res.redirect(url);
}

async function callback(req, res) {
  const { code, state } = req.query;
  if (!code)
    return res.redirect(
      `${FRONTEND_URL}/campaigns-scheduled?oauth=error&reason=no_code`,
    );

  try {
    const decodedState = JSON.parse(
      Buffer.from(state, "base64").toString("utf-8"),
    );
    const { companyId, clientCompanyId } = decodedState;

    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date, id_token } = tokens;

    // Fetch user info to get email
    const ticket = await oauth2Client.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    // Fetch GBP Accounts
    const gbpAccounts = await gbpService.fetchGBPAccounts(access_token);

    // Store in Discovery for user to select locations
    const discoveryId = randomUUID();
    const discoveryData = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiryDate: expiry_date,
      email,
      accounts: gbpAccounts,
      companyId,
      clientCompanyId,
    };

    await Discovery.create({
      id: discoveryId,
      data: discoveryData,
    });

    res.redirect(
      `${FRONTEND_URL}/campaigns-scheduled?oauth=discovery&platform=GoogleBusiness&discoveryId=${discoveryId}`,
    );
  } catch (err) {
    console.error(
      "[GBP Callback] ERROR DETAIL:",
      JSON.stringify(err.response?.data || {}, null, 2),
    );
    console.error("[GBP Callback] Error Message:", err.message);
    const reason =
      err.response?.status === 429
        ? "rate_limited"
        : encodeURIComponent(err.message);
    res.redirect(
      `${FRONTEND_URL}/campaigns-scheduled?oauth=error&reason=${reason}`,
    );
  }
}

async function getDiscovery(req, res) {
  const { discoveryId } = req.query;
  try {
    const discovery = await Discovery.findOne({ id: discoveryId });
    if (!discovery)
      return res
        .status(404)
        .json({ success: false, error: "Discovery not found" });

    // For each account, fetch locations
    const accountsWithLocations = await Promise.all(
      discovery.data.accounts.map(async (acc) => {
        try {
          const locations = await gbpService.fetchGBPLocations(
            acc.name,
            discovery.data.accessToken,
          );
          return { ...acc, locations };
        } catch (e) {
          return { ...acc, locations: [] };
        }
      }),
    );

    res.json({
      success: true,
      data: { accounts: accountsWithLocations, email: discovery.data.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function connectSelected(req, res) {
  const { discoveryId, selectedLocations } = req.body;
  try {
    const discoveryRecord = await Discovery.findOne({ id: discoveryId });
    if (!discoveryRecord)
      return res
        .status(404)
        .json({ success: false, error: "Discovery not found" });

    const discovery = discoveryRecord.data;
    const {
      accessToken,
      refreshToken,
      expiryDate,
      companyId,
      clientCompanyId,
    } = discovery;

    for (const loc of selectedLocations) {
      // loc structure: { accountId, locationId, businessName, address, phone, category }
      const platformId = `gbp-${loc.locationId.split("/").pop()}`;

      await upsertAccount(
        {
          id: platformId,
          platform: "google_business",
          page_id: loc.locationId,
          page_name: loc.businessName,
          username: discovery.email,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: "business_location",
          expires_at: Math.floor(expiryDate / 1000),
          connected_at: new Date().toISOString(),
          gbp_account_id: loc.accountId,
          gbp_location_id: loc.locationId,
          business_name: loc.businessName,
          address: loc.address,
          phone: loc.phone,
          category: loc.category,
        },
        companyId,
        clientCompanyId,
      );
    }

    await Discovery.deleteOne({ id: discoveryId });

    const accounts = await getAllAccounts(companyId, clientCompanyId);
    broadcastSSE("accounts_sync", accounts, { companyId, clientCompanyId });
    broadcastSSE("connection_changed", buildConnectionStatus(accounts), {
      companyId,
      clientCompanyId,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getReviews(req, res) {
  const { accountId } = req.query;
  const companyId = req.user.companyId;
  const clientCompanyId = req.query.clientCompanyId || null;

  try {
    const account = await Account.findOne({
      id: accountId,
      companyId,
      clientCompanyId,
    });
    if (!account)
      return res
        .status(404)
        .json({ success: false, error: "Account not found" });

    const token = await gbpService.getValidGBPToken(account);
    const reviews = await gbpService.fetchGBPReviews(
      account.gbp_location_id,
      token,
    );
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function postReply(req, res) {
  const { accountId, reviewName, replyText } = req.body;
  const companyId = req.user.companyId;
  const clientCompanyId = req.query.clientCompanyId || null;

  try {
    const account = await Account.findOne({
      id: accountId,
      companyId,
      clientCompanyId,
    });
    if (!account)
      return res
        .status(404)
        .json({ success: false, error: "Account not found" });

    const token = await gbpService.getValidGBPToken(account);
    const result = await gbpService.replyToGBPReview(
      reviewName,
      token,
      replyText,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  auth,
  callback,
  getDiscovery,
  connectSelected,
  getReviews,
  postReply,
};
