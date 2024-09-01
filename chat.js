const Configuration = require("openai");
const OpenAIApi = require("openai");

const configuration = new Configuration({
  apiKey: process.env.apiKey,
});
const openai = new OpenAIApi(configuration);

async function classifyEmailContent(emailContent) {
  const prompt = `You are an email assistant. Categorize the following email into one of these categories: 
  1. Interested
  2. Not Interested
  3. More Information

  Email content: "${emailContent}"

  Label:`;

  const response = await openai.completions.create({
    model: "gpt-3.5-turbo-instruct",
    prompt: prompt,
    max_tokens: 50,
  });

  return response.choices[0].text.trim();
}

module.exports = classifyEmailContent;
