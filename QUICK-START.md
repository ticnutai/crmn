# התחלה מהירה - מערכת ניהול לקוחות

## הפעלה מהירה (5 דקות)

### 1. הכנה
```bash
# שכפול/הורדת הפרויקט
git clone <your-repo-url>
cd client-management-system

# או אם הורדת ZIP
unzip client-management-system.zip
cd client-management-system
```

### 2. התקנה
```bash
# התקנת תלויות
npm install

# יצירת קובץ סביבה
cp .env.example .env
```

### 3. הגדרת מסד נתונים (Supabase)

1. **צור חשבון ב-[Supabase](https://supabase.com)**
2. **צור פרויקט חדש**
3. **העתק את Connection String:**
   - לחץ על "Connect" בדף הפרויקט
   - בחר "Connection pooling" 
   - העתק את ה-URI
   - החלף `[YOUR-PASSWORD]` בסיסמת הפרויקט

4. **עדכן את קובץ .env:**
```bash
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@[YOUR-PROJECT].supabase.co:5432/postgres
PORT=5201
HOST=localhost
```

### 4. יצירת טבלאות
```bash
npm run db:push
```

### 5. הפעלת המערכת
```bash
npm run dev
```

**זהו! המערכת תפעל על:**
- 🌐 **ממשק המשתמש:** http://localhost:5200
- 🔌 **API:** http://localhost:5201

## פרטי התחברות ראשונית

**משתמש ברירת מחדל:**
- 📧 אימייל: `admin@example.com`
- 🔑 סיסמה: `admin123`

## פתרון בעיות מהיר

### בעיה: "Cannot find module 'postgres'"
```bash
npm install postgres
```

### בעיה: "DATABASE_URL not defined"
1. וודא שקובץ `.env` קיים ומכיל `DATABASE_URL`
2. הפעל מחדש: `npm run dev`

### בעיה: "Connection refused"
1. וודא שמסד הנתונים פעיל
2. בדוק שכתובת ה-DATABASE_URL נכונה

### בעיה: "Port already in use"
```bash
# שנה פורט בקובץ .env
PORT=5301
```

## תכונות עיקריות להתנסות

1. **🕐 טיימר עבודה** - התחל/עצור/השהה עבודה על לקוחות
2. **📊 מעקב שעות** - צפה בסיכומים יומיים/שבועיים  
3. **🎯 פילטר לקוח** - לחץ על איקון המסמך הכחול ליד לקוח
4. **📝 הערות מהירות** - עריכת הערות ישירות בטבלה
5. **🔔 התראות** - הוסף התראות עם צלילים מותאמים

זהו! אתה מוכן להתחיל לעבוד עם המערכת 🚀