#!/bin/bash

# סקריפט ליצירת חבילה מוכנה להעלאה לגיטהב

echo "🚀 יוצר חבילת GitHub לפרויקט מערכת ניהול לקוחות"

# בדיקת Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js לא מותקן. אנא התקן Node.js 18 או גבוה יותר"
    exit 1
fi

# בדיקת npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm לא מותקן"
    exit 1
fi

# התקנת תלויות
echo "📦 מתקין תלויות..."
npm install

# יצירת קובץ .env מתוך .env.example
if [ ! -f ".env" ]; then
    echo "📝 יוצר קובץ .env מתוך .env.example..."
    cp .env.example .env
    echo "⚠️  אנא ערוך את קובץ .env והוסף את פרטי מסד הנתונים שלך"
fi

# הגדרת מסד נתונים (אם DATABASE_URL הוגדר)
if [ ! -z "$DATABASE_URL" ]; then
    echo "🗄️  מגדיר מסד נתונים..."
    npm run db:push
else
    echo "⚠️  DATABASE_URL לא הוגדר בקובץ .env"
    echo "   אנא הגדר את DATABASE_URL ורוץ: npm run db:push"
fi

echo "✅ החבילה מוכנה!"
echo ""
echo "📋 שלבים הבאים:"
echo "   1. ערוך את קובץ .env והוסף את פרטי מסד הנתונים"
echo "   2. רוץ: npm run db:push (להגדרת מסד הנתונים)"
echo "   3. רוץ: npm run dev (להפעלת השרת)"
echo ""
echo "🌐 השרת יהיה זמין בכתובת: http://localhost:5200"
echo "🎯 שרת API: http://localhost:5201"