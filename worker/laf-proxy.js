// Sealos 云开发 (Sealaf) 云函数 — DeepSeek API 代理（安全加固版）
// 包含：令牌验证 + 输入长度校验
// URL 格式：https://<你的AppID>.laf.run/deepseek-proxy

import cloud from '@lafjs/cloud';

// 输入校验配置
const INPUT_LIMITS = {
  MAX_CONTENT_LENGTH: 2000,
  MAX_MESSAGES_COUNT: 60,
  MAX_TOTAL_CHARS: 8000,
};

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

export default async function (ctx: FunctionContext) {
  // CORS 预检
  if (ctx.method === 'OPTIONS') {
    ctx.response.setHeader('Access-Control-Allow-Origin', '*');
    ctx.response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    ctx.response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Access-Token');
    ctx.response.status(204);
    return '';
  }

  // 仅允许 POST
  if (ctx.method !== 'POST') {
    ctx.response.status(405);
    return { code: 1, error: '方法不允许' };
  }

  // 验证令牌
  const token = ctx.headers['x-access-token'];
  if (token !== process.env.ACCESS_TOKEN) {
    ctx.response.status(401);
    return { code: 1, error: '未授权访问' };
  }

  try {
    const body = ctx.body;

    // 输入校验
    const validation = validateInput(body);
    if (!validation.valid) {
      ctx.response.status(400);
      return { code: 1, error: validation.error };
    }

    const res = await cloud.fetch.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: body.model || 'deepseek-v4-flash',
        messages: body.messages,
        max_tokens: Math.min(body.max_tokens || 1000, 2000),
        temperature: body.temperature != null ? body.temperature : 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
      }
    );

    ctx.response.setHeader('Access-Control-Allow-Origin', '*');
    return res.data;
  } catch (error) {
    ctx.response.setHeader('Access-Control-Allow-Origin', '*');
    ctx.response.status(500);
    return { code: 1, error: '代理请求失败', detail: error.message };
  }
}
