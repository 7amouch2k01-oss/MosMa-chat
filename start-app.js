#!/usr/bin/env node
/**
 * MosMA Chat Application - Local Server Launcher
 * This script can be compiled to EXE using: pkg start-app.js -o MosMA-Chat.exe
 */

const { spawn, exec } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');
const open = require('open');

const appName = 'MosMA Chat Application';
const appDir = __dirname;
const frontendPort = 3000;
const backendPort = 5000;

console.log('\n========================================');
console.log('   ' + appName);
console.log('   Local Server Launcher');
console.log('========================================\n');

// Check if Node.js is available
function checkNode() {
    return new Promise((resolve) => {
        exec('node --version', (error) => {
            if (error) {
                console.error('❌ ERROR: Node.js is not installed!');
                console.error('Download from: https://nodejs.org/\n');
                process.exit(1);
            }
            console.log('✓ Node.js is installed');
            resolve();
        });
    });
}

// Install dependencies if needed
function installDependencies() {
    return new Promise((resolve) => {
        // Check server deps
        if (!existsSync(join(appDir, 'node_modules'))) {
            console.log('📦 Installing server dependencies...');
            const npm1 = spawn('npm', ['install', '--silent'], { cwd: appDir });
            npm1.on('close', () => {
                console.log('✓ Server dependencies installed');
                
                // Check client deps
                if (!existsSync(join(appDir, 'client', 'node_modules'))) {
                    console.log('📦 Installing client dependencies...');
                    const npm2 = spawn('npm', ['install', '--silent'], { cwd: join(appDir, 'client') });
                    npm2.on('close', () => {
                        console.log('✓ Client dependencies installed');
                        resolve();
                    });
                } else {
                    console.log('✓ Client dependencies already installed');
                    resolve();
                }
            });
        } else {
            console.log('✓ Server dependencies already installed');
            
            if (!existsSync(join(appDir, 'client', 'node_modules'))) {
                console.log('📦 Installing client dependencies...');
                const npm2 = spawn('npm', ['install', '--silent'], { cwd: join(appDir, 'client') });
                npm2.on('close', () => {
                    console.log('✓ Client dependencies installed');
                    resolve();
                });
            } else {
                console.log('✓ Client dependencies already installed');
                resolve();
            }
        }
    });
}

// Start the application
function startApp() {
    console.log('\n========================================');
    console.log('   Starting Servers');
    console.log('========================================\n');
    
    console.log('Frontend: http://localhost:' + frontendPort);
    console.log('Backend:  http://localhost:' + backendPort);
    console.log('\n✓ Opening browser in 3 seconds...\n');
    
    setTimeout(() => {
        open('http://localhost:' + frontendPort).catch(() => {
            console.log('ℹ Open manually: http://localhost:' + frontendPort);
        });
    }, 3000);
    
    // Start npm dev server
    const devServer = spawn('npm', ['run', 'dev'], { 
        cwd: appDir,
        stdio: 'inherit'
    });
    
    devServer.on('close', (code) => {
        console.log('\n✓ Server stopped (code: ' + code + ')');
        process.exit(code);
    });
}

// Main execution
async function main() {
    try {
        await checkNode();
        console.log('✓ npm is installed\n');
        
        await installDependencies();
        
        startApp();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
