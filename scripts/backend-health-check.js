const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const BACKEND_DIR = path.join(__dirname, '..', 'backend');
const REQUIREMENTS_PATH = path.join(BACKEND_DIR, 'requirements.txt');
const VENV_DIR = path.join(BACKEND_DIR, '.venv');

function logStep(message) {
  console.log(`\n=== ${message} ===`);
}

function logError(message) {
  console.error(`❌ 错误: ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function getPythonExecutable() {
  if (fs.existsSync(VENV_DIR)) {
    if (process.platform === 'win32') {
      return path.join(VENV_DIR, 'Scripts', 'python.exe');
    }
    return path.join(VENV_DIR, 'bin', 'python');
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

function checkDependenciesInstalled(pythonExec) {
  try {
    const installed = execSync(`${pythonExec} -m pip list --format=freeze`, {
      cwd: BACKEND_DIR,
      encoding: 'utf8',
    }).toLowerCase();
    
    const requirements = fs.readFileSync(REQUIREMENTS_PATH, 'utf8')
      .split('\n')
      .map(line => line.trim().toLowerCase())
      .filter(line => line && !line.startsWith('#'));
    
    for (const req of requirements) {
      const pkgName = req.split('==')[0];
      if (!installed.includes(`${pkgName}==`)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function ensureVenvAndDependencies() {
  logStep('检查并安装后端依赖');
  
  let pythonExec = getPythonExecutable();
  
  if (!fs.existsSync(VENV_DIR)) {
    console.log('创建 Python 虚拟环境...');
    try {
      execSync(`${process.platform === 'win32' ? 'python' : 'python3'} -m venv .venv`, {
        cwd: BACKEND_DIR,
        stdio: 'inherit',
      });
      pythonExec = getPythonExecutable();
      logSuccess('虚拟环境创建完成');
    } catch (error) {
      logError('虚拟环境创建失败');
      throw error;
    }
  }
  
  if (!checkDependenciesInstalled(pythonExec)) {
    console.log('安装依赖...');
    try {
      execSync(`${pythonExec} -m pip install --upgrade pip`, {
        cwd: BACKEND_DIR,
        stdio: 'inherit',
      });
      execSync(`${pythonExec} -m pip install -r requirements.txt`, {
        cwd: BACKEND_DIR,
        stdio: 'inherit',
      });
      logSuccess('依赖安装完成');
    } catch (error) {
      logError('依赖安装失败');
      throw error;
    }
  } else {
    logSuccess('依赖已安装');
  }
  
  return pythonExec;
}

function startBackend(pythonExec) {
  return new Promise((resolve, reject) => {
    logStep('启动后端服务');
    
    const server = spawn(pythonExec, ['app.py'], {
      cwd: BACKEND_DIR,
      env: { ...process.env, FLASK_ENV: 'testing' },
    });
    
    let output = '';
    server.stdout.on('data', (data) => {
      output += data.toString();
      console.log(data.toString().trim());
    });
    server.stderr.on('data', (data) => {
      output += data.toString();
      console.error(data.toString().trim());
    });
    
    server.on('error', (err) => {
      logError(`启动失败: ${err.message}`);
      reject(err);
    });
    
    server.on('exit', (code) => {
      if (code !== null && code !== 0) {
        reject(new Error(`后端服务异常退出，退出码: ${code}`));
      }
    });
    
    const startupTimeout = setTimeout(() => {
      reject(new Error('后端服务启动超时'));
    }, 30000);
    
    const checkInterval = setInterval(() => {
      if (output.includes('Running on') || output.includes('Debugger is active')) {
        clearInterval(checkInterval);
        clearTimeout(startupTimeout);
        logSuccess('后端服务启动成功');
        resolve(server);
      }
    }, 500);
  });
}

async function checkHealthEndpoint() {
  logStep('验证健康检查接口');
  
  const maxRetries = 10;
  const retryDelay = 1000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get('http://localhost:3000/api/health', {
        timeout: 5000,
      });
      
      if (response.status === 200 && response.data.status === 'ok') {
        logSuccess('健康检查接口验证通过');
        console.log('响应数据:', JSON.stringify(response.data));
        return;
      } else {
        console.log(`尝试 ${i + 1}/${maxRetries}: 响应不正确，状态码: ${response.status}，数据:`, response.data);
      }
    } catch (error) {
      console.log(`尝试 ${i + 1}/${maxRetries}: ${error.message}`);
    }
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw new Error('健康检查接口验证失败');
}

function stopBackend(server) {
  return new Promise((resolve) => {
    logStep('停止后端服务');
    if (server && !server.killed) {
      if (process.platform === 'win32') {
        execSync(`taskkill /T /F /PID ${server.pid}`, { stdio: 'ignore' });
      } else {
        server.kill('SIGTERM');
      }
      setTimeout(resolve, 1000);
    } else {
      resolve();
    }
  });
}

async function main() {
  let server = null;
  try {
    const pythonExec = ensureVenvAndDependencies();
    server = await startBackend(pythonExec);
    await checkHealthEndpoint();
    await stopBackend(server);
    logSuccess('后端健康检查全部通过');
    process.exit(0);
  } catch (error) {
    logError(error.message);
    if (server) {
      await stopBackend(server);
    }
    process.exit(1);
  }
}

main();
