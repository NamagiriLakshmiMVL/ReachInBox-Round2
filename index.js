const { google } = require("googleapis");
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const classifyEmailContent = require("./chat");

const OAuth2 = google.auth.OAuth2;
const clientId = process.env.clientId;
const clientSecret = process.env.clientSecret;
const redirectUri = process.env.redirectUri;

const oauth2Client = new OAuth2(clientId, clientSecret, redirectUri);
const gmail = google.gmail({ version: "v1", auth: oauth2Client });

// Generate the URL for the consent page
function getAuthUrl() {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send",
  ];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
  return authUrl;
}

// Exchange authorization code for access token
async function getToken(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

// Example usage with Express
const app = express();

app.get("/auth", (req, res) => {
  const authUrl = getAuthUrl();
  console.log(authUrl);
  res.redirect(authUrl);
});

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  const tokens = await getToken(code);
  res.json(tokens);
});

app.get("/email", async (req, res) => {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const resp = await gmail.users.messages.list({
    userId: process.env.userId,
    maxResults: 10,
  });
  const messages = resp.data.messages || [];
  for (let message of messages) {
    await getMessage(message.id);
  }
});

async function getMessage(messageId) {
  try {
    const res = await gmail.users.messages.get({
      userId: process.env.userId,
      id: messageId,
    });

    const message = res.data;
    const payload = message.payload;

    // Extract the body data
    let body = getBody(payload);

    // Decode the body if it's base64 encoded
    const decodedBody = Buffer.from(body, "base64").toString("utf-8");
    console.log("Message Text:", decodedBody);
    let a = await classifyEmailContent(decodedBody);
    console.log("Text", a);
  } catch (error) {
    console.error("Error getting message:", error);
  }
}
function getBody(payload) {
  let body = "";

  if (payload.parts) {
    for (let part of payload.parts) {
      if (part.mimeType === "text/plain") {
        body = part.body.data;
      } else if (part.parts) {
        body = getBody(part);
      }
    }
  } else {
    body = payload.body.data;
  }

  return body;
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
