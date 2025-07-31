# הוראות העלאה לגיטהב

## יצירת רפוזיטורי חדש

### 1. צור רפוזיטורי בגיטהב
1. לך ל-[GitHub.com](https://github.com)
2. לחץ על **"New Repository"**
3. שם הפרויקט: `client-management-system` 
4. תיאור: `מערכת ניהול לקוחות עברית עם RTL, טיימר ומעקב שעות`
5. בחר **Public** או **Private**
6. **אל** תוסיף README, .gitignore או LICENSE (כבר קיימים)

### 2. העלאה לגיטהב

```bash
# בתיקיית הפרויקט
git init
git add .
git commit -m "Initial commit - מערכת ניהול לקוחות עברית"

# החלף YOUR-USERNAME ו-YOUR-REPO בפרטים שלך
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

### 3. הגדרת README מתקדם (אופציונלי)

הוסף לקובץ README.md:

```markdown
# מערכת ניהול לקוחות עברית 🇮🇱

![GitHub](https://img.shields.io/github/license/YOUR-USERNAME/YOUR-REPO)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-5.0-blue)

מערכת CRM מתקדמת בעברית עם תמיכה מלאה ב-RTL, טיימר עבודה ומעקב שעות.

## 🚀 התחלה מהירה

\`\`\`bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
npm install
cp .env.example .env
# ערוך את .env עם פרטי מסד הנתונים
npm run db:push
npm run dev
\`\`\`

## 🌐 דמו
- **ממשק:** http://localhost:5200
- **API:** http://localhost:5201

## 🛠️ טכנולוגיות
- React 18 + TypeScript
- Express.js + PostgreSQL
- Drizzle ORM + Tailwind CSS
- RTL Support + Hebrew UI

## 📋 תכונות
- ✅ ממשק עברי מלא עם RTL
- ✅ טיימר עבודה מתקדם
- ✅ מעקב שעות ודוחות
- ✅ פילטר לפי לקוח
- ✅ הערות ותיאורים
- ✅ מערכת התראות
- ✅ עיצוב רספונסיבי

[ראה הוראות מפורטות](QUICK-START.md)
```

### 4. הגדרת סביבות GitHub (אופציונלי)

צור קובץ `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build project
      run: npm run build
```

### 5. קבצים שלא להעלות

הקובץ `.gitignore` כבר מוגדר לא להעלות:
- 📁 `node_modules/`
- 📁 `dist/`
- 📄 `.env` (רק `.env.example` יועלה)
- 📄 קבצי לוגים וזמניים

### 6. רישיון

הפרויקט מגיע עם רישיון MIT - תוכל לשנות אותו בקובץ `LICENSE`.

---

**הכל מוכן! הפרויקט שלך כעת זמין בגיטהב וכל מי שיורד אותו יוכל להפעיל אותו בקלות.** 🎉