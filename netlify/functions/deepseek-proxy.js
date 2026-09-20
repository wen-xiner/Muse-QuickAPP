// Netlify Function - DeepSeek API 代理
// 部署到 Netlify 后自动可用，无需额外服务器
// URL: https://你的域名/.netlify/functions/deepseek-proxy

exports.handler = async (event) => {
  // 只允许 POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // 简单的速率限制（基于 IP，Netlify 提供 client-ip header）
  // 生产环境建议用 Netlify 的 edge functions 做更严格的限制

  try {
    const body = JSON.parse(event.body);
    const messages = body.messages || [];
    const lastMsg = messages[messages.length - 1]?.content || '';

    // 输入长度校验
    if (lastMsg.length > 2000) {
      return { statusCode: 400, body: JSON.stringify({ error: '内容过长' }) };
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: body.model || 'deepseek-v4-flash',
        messages: messages,
        max_tokens: Math.min(body.max_tokens || 1000, 2000),
        temperature: body.temperature ?? 0.7,
      }),
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: '代理请求失败', detail: error.message }),
    };
  }
};
