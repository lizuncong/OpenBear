// utils/file.js
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { dirname } from 'path';

export async function saveToJsonFileAsync(data, filename = 'result.json', saveDir = null) {
  try {
    // 如果没指定保存目录，使用当前工作目录
    const targetDir = saveDir || process.cwd();
    const filepath = join(targetDir, filename);

    // 确保目录存在
    const dir = dirname(filepath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const jsonString = JSON.stringify(data, null, 2);
    await writeFile(filepath, jsonString, 'utf8');

    console.log(`✅ 结果已保存到: ${filepath}`);
    return { success: true, path: filepath };
  } catch (error) {
    console.error(`❌ 保存失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}