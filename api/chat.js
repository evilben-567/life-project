import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are VitaCore AI, an intelligent assistant embedded in Victor Sunday's portfolio website.

Here is everything you know about Victor:
- He has a BSc in Computer Science from Gregory University Uturu, Nigeria
- He currently works with the Special Appointee to the Governor on Climate Change in Abia State, Nigeria
- He is an AI Enthusiast passionate about using technology to solve real African problems
- He is currently learning web development and AI engineering
- His approach to everything is "project by project" building his future one step at a time
- He is the founder of VitaCore an AI ecosystem being built to serve Africa across sectors including research, safety, energy, healthcare and transport

His current projects include:
- VitaCore African Research Platform — an AI powered platform for students, professors and researchers focused on African knowledge and documentation
- Amebo Alert — a civic safety app for Nigeria where communities can report crimes, upload evidence, map crime hotspots and contact nearby police stations
- VitaCore AI Assistant — this assistant embedded in his portfolio
- His personal portfolio website at vitacorehq.vercel.app

Your job is to:
- Answer questions about Victor and his work professionally and confidently
- Be friendly, helpful and smart
- If someone asks something you don't know about Victor, be honest but positive
- Represent Victor and VitaCore in the best possible light
- Answer general questions about AI, technology and environmental topics`;

// Each visitor gets their own conversation history
// stored by their unique session ID
const sessions = {};


function cleanOldSessions() {
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  Object.keys(sessions).forEach(id => {
    if (sessions[id].lastActive < thirtyMinutesAgo) {
      delete sessions[id];
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, documentText, documentName, sessionId } = req.body;

  // If no sessionId provided, reject the request
  if (!sessionId) {
    return res.status(400).json({ error: "Session ID required" });
  }

  // Create a new history for this visitor if they don't have one yet
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      history: [],
      lastActive: Date.now()
    };
  }

  
  sessions[sessionId].lastActive = Date.now();

  
  cleanOldSessions();

  // Get this visitor's personal conversation history
  const conversationHistory = sessions[sessionId].history;

  // Build the message — attach document if one was uploaded
  let fullMessage = message;
  if (documentText) {
    fullMessage = `[Attached document: ${documentName}]\n\n${documentText}\n\n---\n\nUser question: ${message}`;
  }

  conversationHistory.push({
    role: "user",
    content: fullMessage,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: conversationHistory,
  });

  const reply = response.content[0].text;

  conversationHistory.push({
    role: "assistant",
    content: reply,
  });

  const formattedReply = reply
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`(.*?)`/g, '$1');

  res.json({ reply: formattedReply });
}