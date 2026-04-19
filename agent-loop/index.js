// Harness: the loop -- 持续将真实的工具执行结果回传给模型
// The Agent Loop
// 这个文件展示了最小的实用编码代理模式：
//     用户消息
//       -> 模型回复
//       -> 如果有工具调用：执行工具
//       -> 将工具执行结果写回消息历史
//       -> 继续循环
// 它刻意保持循环的简洁性，同时明确暴露了循环状态，
// 以便后续章节可以基于相同的结构进行扩展。
import { saveToJsonFileAsync } from '../utils/file.js'

// index.js
import 'dotenv/config';  // 必须在最顶部导入
import OpenAI from 'openai';

// // 从环境变量读取配置
const client = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: process.env.ZHIPU_BASE_URL,
});

const MODEL_NAME = process.env.ZHIPU_MODEL;

async function chat() {
  try {
    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "你是一个专业的AI助手。" },
        { role: "user", content: "什么是AI Agent？" }
      ],
    });
    saveToJsonFileAsync(response)
    console.log('response========', response.choices[0].message.content);
  } catch (error) {
    console.error("调用失败:", error);
  }
}

chat();


