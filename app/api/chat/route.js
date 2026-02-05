import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message, history } = await request.json();

    // In production, use your actual API key
    const API_KEY = process.env.OPENAI_API_KEY;
    const API_URL = 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are Ria, a helpful AI assistant for campaign management. 
            You help users with:
            1. Campaign strategy and execution
            2. Creator/influencer management
            3. Task prioritization
            4. Payment tracking
            5. Analytics and reporting
            
            Be concise, friendly, and use emojis appropriately.
            Format responses with clear sections when needed.
            Keep responses under 300 words unless detailed analysis is requested.
            Use markdown formatting for lists and emphasis.`
          },
          ...history,
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Fallback responses
    const fallbackResponses = [
      "I understand you're asking about campaign management. While I'm experiencing some connectivity issues, here are some quick tips:\n\n• **Track ROI** by monitoring engagement vs spend\n• **Creator selection** should match your target audience\n• **Task priority** - focus on high-impact activities first\n• **Payment automation** saves 3-5 hours weekly\n\nTry asking me about specific metrics or strategies! 📊",
      "I'd love to help with that! Let me share some campaign insights:\n\n🔍 **Quick Analytics**:\n- Engagement rate benchmarks: 3-5%\n- Average CPM: $10-$20\n- Creator response time: 24-48 hrs\n\n💡 **Pro Tip**: Always A/B test your outreach messages for better results!",
      "Campaign management question noted! Here's what I typically help with:\n\n🎯 **Strategy** - Goal setting, KPI definition\n👥 **Creator Management** - Outreach, contracts, briefs\n📊 **Analytics** - Performance tracking, ROI calculation\n💰 **Payments** - Invoicing, tracking, reconciliation\n\nWhat specific area would you like to dive into?"
    ];

    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return NextResponse.json({ reply: randomResponse });
  }
}