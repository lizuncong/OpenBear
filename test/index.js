import { saveToJsonFileAsync } from '../utils/file.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 调用时传入 agent-loop 目录
await saveToJsonFileAsync({ test: '33' }, 'result.json', __dirname);