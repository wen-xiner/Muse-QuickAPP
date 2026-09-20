// Cloudflare Worker - DeepSeek API 代理（安全加固版）
// 包含：令牌验证 + 速率限制 + 输入长度校验

// 速率限制配置
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 30,   // 每 IP 每分钟最多 30 次
  WINDOW_MS: 60 * 1000,           // 时间窗口 1 分钟
};

// 输入校验配置
const INPUT_LIMITS = {
  MAX_CONTENT_LENGTH: 2000,       // 单条消息最大长度
  MAX_MESSAGES_COUNT: 60,         // 单次请求最多消息数
  MAX_TOTAL_CHARS: 8000,          // 单次请求总字符数上限
};

// 内存速率限制存储（Cloudflare Workers 的简易实现）
// 生产环境建议改用 Workers KV 或 Durable Objects
const rateLimitMap = new Map();

function checkRateLimit(clientIP) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;

  // 清理过期记录
  for (const [ip, timestamps] of rateLimitMap) {
    const valid = timestamps.filter(t => t > windowStart);
    if (valid.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, valid);
    }
  }

  const timestamps = rateLimitMap.get(clientIP) || [];
  const recentRequests = timestamps.filter(t => t > windowStart);

  if (recentRequests.length >= RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, remaining: 0 };
  }

  recentRequests.push(now);
  rateLimitMap.set(clientIP, recentRequests);

  return {
    allowed: true,
    remaining: RATE_LIMIT.MAX_REQUESTS_PER_MINUTE - recentRequests.length
  };
}

function validateInput(body) {
  const messages = body.messages || [];

  if (messages.length > INPUT_LIMITS.MAX_MESSAGES_COUNT) {
    return { valid: false, error: `消息数量超过限制（最多${INPUT_LIMITS.MAX_MESSAGES_COUNT}条）` };
  }

  let totalChars = 0;
  for (const msg of messages) {
    const content = String(msg.content || '');
    if (content.length > INPUT_LIMITS.MAX_CONTENT_LENGTH) {
      return { valid: false, error: `单条消息长度超过限制（最多${INPUT_LIMITS.MAX_CONTENT_LENGTH}字符）` };
    }
    totalChars += content.length;
  }

  if (totalChars > INPUT_LIMITS.MAX_TOTAL_CHARS) {
    return { valid: false, error: `消息总长度超过限制（最多${INPUT_LIMITS.MAX_TOTAL_CHARS}字符）` };
  }

  return { valid: true };
}

export default {
  async fetch(request, env) {
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

    // 访问令牌验证
    const token = request.headers.get('X-Access-Token');
    if (token !== env.ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: '未授权访问' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 速率限制检查
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return new Response(JSON.stringify({
        error: '请求过于频繁，请稍后再试',
        retryAfter: 60
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': '60',
          'X-RateLimit-Remaining': '0',
        },
      });
    }

    try {
      const body = await request.json();

      // 输入校验
      const validation = validateInput(body);
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: body.model || 'deepseek-v4-flash',
          messages: body.messages,
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
          'X-RateLimit-Remaining': String(rateCheck.remaining),
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: '代理请求失败', detail: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
