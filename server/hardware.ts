import os from 'os';
import { execSync } from 'child_process';
import { SystemHardware, RecommendedModel } from './types.js';

const MODEL_CATALOG: RecommendedModel[] = [
  {
    id: 'llama3.2:1b',
    name: 'Llama 3.2 (1B)',
    sizeParam: '1B',
    minRamGB: 4,
    recommendedRamGB: 8,
    family: 'Llama',
    description: 'Ultra-lightweight state-of-the-art edge model. Extremely fast on CPU/consumer laptops.',
    compatible: true,
    speedRating: 'Fast'
  },
  {
    id: 'llama3.2:3b',
    name: 'Llama 3.2 (3B)',
    sizeParam: '3B',
    minRamGB: 6,
    recommendedRamGB: 8,
    family: 'Llama',
    description: 'Balanced speed and coding intelligence. Excellent for laptop local agent execution.',
    compatible: true,
    speedRating: 'Fast'
  },
  {
    id: 'qwen2.5-coder:1.5b',
    name: 'Qwen 2.5 Coder (1.5B)',
    sizeParam: '1.5B',
    minRamGB: 4,
    recommendedRamGB: 6,
    family: 'Qwen',
    description: 'Specialized lightweight coding model with superior syntax generation & tool use.',
    compatible: true,
    speedRating: 'Fast'
  },
  {
    id: 'qwen2.5-coder:7b',
    name: 'Qwen 2.5 Coder (7B)',
    sizeParam: '7B',
    minRamGB: 8,
    recommendedRamGB: 16,
    vramGB: 6,
    family: 'Qwen',
    description: 'High-accuracy full-stack coding & agent tool calling. Recommended for 16GB+ systems.',
    compatible: false,
    speedRating: 'Moderate'
  },
  {
    id: 'phi3:mini',
    name: 'Phi-3 Mini (3.8B)',
    sizeParam: '3.8B',
    minRamGB: 6,
    recommendedRamGB: 8,
    family: 'Phi',
    description: 'Microsoft compact high-reasoning model optimized for complex logic with low RAM footprint.',
    compatible: true,
    speedRating: 'Fast'
  },
  {
    id: 'llama3.1:8b',
    name: 'Llama 3.1 (8B)',
    sizeParam: '8B',
    minRamGB: 10,
    recommendedRamGB: 16,
    vramGB: 8,
    family: 'Llama',
    description: 'Comprehensive general agent reasoning and multi-step tool execution.',
    compatible: false,
    speedRating: 'Moderate'
  },
  {
    id: 'deepseek-r1:7b',
    name: 'DeepSeek R1 (7B Distill)',
    sizeParam: '7B',
    minRamGB: 10,
    recommendedRamGB: 16,
    vramGB: 8,
    family: 'DeepSeek',
    description: 'Chain-of-thought reasoning specialist for complex problem decomposition and debugging.',
    compatible: false,
    speedRating: 'Moderate'
  },
  {
    id: 'mistral:7b',
    name: 'Mistral (7B v0.3)',
    sizeParam: '7B',
    minRamGB: 8,
    recommendedRamGB: 16,
    vramGB: 8,
    family: 'Mistral',
    description: 'Strong instruction following, coding and command generation standard.',
    compatible: false,
    speedRating: 'Moderate'
  }
];

export function detectHardware(): SystemHardware {
  const cpus = os.cpus() || [];
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'Generic CPU';
  const cpuSpeed = cpus.length > 0 ? cpus[0].speed : 2400;
  const cores = cpus.length || 1;

  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;
  const totalGB = Math.round((totalBytes / (1024 ** 3)) * 10) / 10;
  const freeGB = Math.round((freeBytes / (1024 ** 3)) * 10) / 10;
  const usedGB = Math.round((usedBytes / (1024 ** 3)) * 10) / 10;
  const usagePercent = Math.round((usedBytes / totalBytes) * 100);

  // GPU detection via command execution
  let gpu = {
    detected: false,
    name: 'Integrated Graphics / CPU Only',
    vramGB: 0,
    driver: 'Standard Host Driver'
  };

  try {
    const nvidiaCheck = execSync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits', {
      timeout: 1500,
      stdio: ['pipe', 'pipe', 'ignore']
    }).toString().trim();
    if (nvidiaCheck) {
      const parts = nvidiaCheck.split(',');
      const gpuName = parts[0]?.trim() || 'NVIDIA GPU';
      const vramMB = parseFloat(parts[1]?.trim() || '0');
      gpu = {
        detected: true,
        name: gpuName,
        vramGB: Math.round((vramMB / 1024) * 10) / 10,
        driver: 'NVIDIA CUDA'
      };
    }
  } catch {
    // If not nvidia, check for macOS Metal or generic Linux lspci
    try {
      if (os.platform() === 'darwin') {
        const appleMetal = execSync('system_profiler SPDisplaysDataType', { timeout: 1500, stdio: ['pipe', 'pipe', 'ignore'] }).toString();
        if (appleMetal.includes('Apple M')) {
          gpu = {
            detected: true,
            name: 'Apple Unified Memory (Metal)',
            vramGB: totalGB,
            driver: 'Apple Silicon Metal'
          };
        }
      }
    } catch {}
  }

  // Disk space detection
  let disk = {
    totalGB: 100,
    freeGB: 45,
    usedGB: 55
  };

  try {
    const dfOutput = execSync('df -k .', { timeout: 1500, stdio: ['pipe', 'pipe', 'ignore'] }).toString();
    const lines = dfOutput.trim().split('\n');
    if (lines.length > 1) {
      const parts = lines[1].split(/\s+/);
      const totalKB = parseInt(parts[1], 10);
      const usedKB = parseInt(parts[2], 10);
      const freeKB = parseInt(parts[3], 10);
      if (!isNaN(totalKB) && !isNaN(freeKB)) {
        disk = {
          totalGB: Math.round((totalKB / (1024 * 1024)) * 10) / 10,
          usedGB: Math.round((usedKB / (1024 * 1024)) * 10) / 10,
          freeGB: Math.round((freeKB / (1024 * 1024)) * 10) / 10
        };
      }
    }
  } catch {}

  // Filter and configure recommendations based on detected RAM/GPU
  const recommendedModels: RecommendedModel[] = MODEL_CATALOG.map((m) => {
    const compatible = totalGB >= m.minRamGB;
    let reason = compatible
      ? `System has ${totalGB}GB RAM, meeting the ${m.minRamGB}GB minimum.`
      : `System has ${totalGB}GB RAM, but this model requires at least ${m.minRamGB}GB RAM.`;
    
    if (gpu.detected && m.vramGB && gpu.vramGB && gpu.vramGB >= m.vramGB) {
      reason += ` GPU acceleration detected (${gpu.vramGB}GB VRAM).`;
    }

    return {
      ...m,
      compatible,
      reason
    };
  });

  return {
    os: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      type: os.type()
    },
    cpu: {
      model: cpuModel,
      cores,
      speedMhz: cpuSpeed,
      loadAverage: os.loadavg()
    },
    ram: {
      totalBytes,
      freeBytes,
      usedBytes,
      totalGB,
      freeGB,
      usedGB,
      usagePercent
    },
    gpu,
    disk,
    recommendedModels
  };
}
