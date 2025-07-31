#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 מפעיל מערכת ניהול לקוחות...');

// בדיקת סביבה
if (!process.env.DATABASE_URL) {
  console.error('❌ שגיאה: DATABASE_URL לא הוגדר');
  console.error('   אנא ערוך את קובץ .env והוסף את פרטי מסד הנתונים');
  process.exit(1);
}

// הפעלת השרת והלקוח במקביל
const serverProcess = spawn('npm', ['run', 'server'], {
  stdio: 'inherit',
  shell: true
});

const clientProcess = spawn('npm', ['run', 'client'], {
  stdio: 'inherit', 
  shell: true
});

// טיפול בסגירה
process.on('SIGINT', () => {
  console.log('🛑 סוגר את המערכת...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
});

serverProcess.on('error', (err) => {
  console.error('❌ שגיאה בשרת:', err);
});

clientProcess.on('error', (err) => {
  console.error('❌ שגיאה בלקוח:', err);
});