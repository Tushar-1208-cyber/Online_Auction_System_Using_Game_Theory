/**
 * pythonBridge.js
 * ───────────────
 * Calls the Python game_theory.py script from Node.js using child_process.
 * Sends JSON via stdin, receives JSON via stdout.
 *
 * Usage:
 *   const { callPython } = require('./pythonBridge');
 *   const result = await callPython({ action: 'nash_calculator', valuation: 100, num_bidders: 3 });
 */

const { spawn } = require('child_process');
const path = require('path');

const PYTHON_SCRIPT = path.join(__dirname, '..', '..', 'python', 'game_theory.py');

/**
 * Call Python game theory engine.
 * @param {object} inputData - JSON data to pass to Python
 * @returns {Promise<object>} - Parsed JSON result from Python
 */
function callPython(inputData) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [PYTHON_SCRIPT]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python error (code ${code}): ${errorOutput}`));
      }
      try {
        const result = JSON.parse(output.trim());
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse Python output: ${output}`));
      }
    });

    python.on('error', (err) => {
      reject(new Error(`Failed to start Python: ${err.message}`));
    });

    // Send input data to Python via stdin
    python.stdin.write(JSON.stringify(inputData));
    python.stdin.end();
  });
}

module.exports = { callPython };
