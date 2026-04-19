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
// index.js
import 'dotenv/config';  // 必须在最顶部导入
import OpenAI from 'openai';
import { saveToJsonFileAsync } from '../utils/file.js'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// // 从环境变量读取配置
const client = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: process.env.ZHIPU_BASE_URL,
});

const MODEL_NAME = process.env.ZHIPU_MODEL;


// 定义写文件的工具函数
async function writeFile(filename, content) {
  console.log('Write File=======', filename, content)
  try {
    const filePath = join(__dirname, filename);
    await fs.writeFile(filePath, content, 'utf-8');
    return `文件已成功写入: ${filePath}，内容长度: ${content.length} 字符`;
  } catch (error) {
    return `写入文件失败: ${error.message}`;
  }
}


// 工具定义（符合 OpenAI Function Calling 规范）
const tools = [
  {
    type: "function",
    function: {
      name: "writeFile",
      description: "将内容写入到指定的文件中。当用户要求保存、写入或生成文件时使用此工具。",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "要创建的文件名，例如 'output.txt' 或 'result.json'"
          },
          content: {
            type: "string",
            description: "要写入文件的具体内容"
          }
        },
        required: ["filename", "content"]
      }
    }
  }
];

async function chat(userInput) {
  try {
    console.log(`用户问题: ${userInput}\n`);

    // 第一次调用：让模型决定是否调用工具
    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content: "你是一个专业的AI助手，能够使用工具来完成任务。当用户要求你写文件时，请使用 writeFile 工具。"
        },
        { role: "user", content: userInput }
      ],
      tools: tools,
      tool_choice: "auto",  // 让模型自动决定是否调用工具
    });
    saveToJsonFileAsync(response, '第一次调用的结果.json', __dirname);

    const message = response.choices[0].message;

    // 检查模型是否想要调用工具
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log("🤖 模型决定调用工具...");

      // 执行工具调用
      const toolCalls = message.tool_calls;
      const toolResults = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const parameters = JSON.parse(toolCall.function.arguments);

        console.log(`🔧 调用工具: ${functionName}`);
        console.log(`📝 参数:`, parameters);

        let result;
        if (functionName === "writeFile") {
          result = await writeFile(parameters.filename, parameters.content);
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: result
        });
      }
      console.log('toolResult=======', JSON.parse(JSON.stringify(toolResults)))
      // 第二次调用：将工具执行结果返回给模型，让模型生成最终回复
      const secondMessage = [
        { role: "system", content: "你是一个专业的AI助手，能够使用工具来完成任务。" },
        { role: "user", content: userInput },
        message,  // 模型的工具调用请求
        ...toolResults  // 工具执行结果
      ]

      console.log('secondMessage=====', JSON.parse(JSON.stringify(secondMessage)))
      const secondResponse = await client.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "你是一个专业的AI助手，能够使用工具来完成任务。" },
          { role: "user", content: userInput },
          message,  // 模型的工具调用请求
          ...toolResults  // 工具执行结果
        ],
        tools: tools,
      });
      saveToJsonFileAsync(secondResponse, '第二次调用的结果.json', __dirname);

      const finalMessage = secondResponse.choices[0].message.content;
      console.log("\n✅ 任务完成！");
      console.log("📄 模型回复:", finalMessage);

      // 保存完整的对话记录
      const conversationRecord = {
        timestamp: new Date().toISOString(),
        userInput: userInput,
        toolCalls: toolCalls.map(tc => ({
          name: tc.function.name,
          arguments: tc.function.arguments
        })),
        finalResponse: finalMessage
      };
      await saveToJsonFileAsync(conversationRecord, 'conversation_log.json', __dirname);

      return finalMessage;
    } else {
      // 模型没有调用工具，直接输出内容
      console.log("💬 模型直接回复:", response);
      console.log(message.content);
      return message.content;
    }

  } catch (error) {
    console.error("调用失败:", error);
    throw error;
  }
}

// 测试示例
async function main() {
  // 示例1：要求模型写一个关于AI Agent的说明文件
  await chat("请写一个关于AI Agent的简要说明文档，字数在150个字符以内，保存为 ai_agent_intro.txt");

  console.log("\n" + "=".repeat(50) + "\n");

  // 示例2：要求模型生成JSON格式的数据
  // await chat("请生成一个包含3个AI应用场景的JSON文件，保存为 ai_scenarios.json");
}

main();

