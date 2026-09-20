// Cloudflare Pages Function - DeepSeek API 代理
// 部署后 URL: https://你的域名/deepseek-proxy

export async function onRequest(context) {
  const { request, env } = context;

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Access-Token',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 只允许 POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '方法不允许' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // 访问令牌验证（如果设置了 ACCESS_TOKEN 环境变量）
  if (env.ACCESS_TOKEN) {
    const token = request.headers.get('X-Access-Token');
    if (token !== env.ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: '未授权访问' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  try {
    const body = await request.json();
    const messages = body.messages || [];
    const lastMsg = messages[messages.length - 1]?.content || '';

    // 输入长度校验
    if (lastMsg.length > 2000) {
      return new Response(JSON.stringify({ error: '内容过长' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY;

    if (!DEEPSEEK_API_KEY) {
      return new Response(JSON.stringify({ error: 'API Key 未配置' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

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

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '代理请求失败', detail: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
