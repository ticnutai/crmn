# מערכת ניהול לקוחות עברית

מערכת CRM מתקדמת בעברית עם תמיכה מלאה ב-RTL, טיימר עבודה, ומעקב שעות.

## תכונות עיקריות

- 🇮🇱 **ממשק עברי מלא** - תמיכה מלאה ב-RTL ובעברית
- ⏱️ **טיימר עבודה מתקדם** - עם השהיה, חידוש ושמירה
- 📊 **מעקב שעות עבודה** - סיכומים יומיים, שבועיים וחודשיים
- 🎯 **פילטר לפי לקוח** - הצגת פרטי עבודה לכל לקוח בנפרד
- 📝 **הערות ותיאורים** - הוספת הערות לכל סשן עבודה
- 🔔 **מערכת התראות** - התראות מותאמות אישית עם צלילים
- 📱 **עיצוב רספונסיבי** - מותאם לנייד ושולחן עבודה
- 🎨 **ערכות נושא** - כמה ערכות עיצוב לבחירה

## התקנה מהירה

### דרישות מוקדמות
- Node.js 18+ 
- PostgreSQL או Supabase
- npm או yarn

### שלבי התקנה

1. **שכפול הפרויקט**
```bash
git clone <repository-url>
cd client-management-system
```

2. **התקנת תלויות**
```bash
npm install
```

3. **הגדרת מסד נתונים**
```bash
# העתק את קובץ התצורה
cp .env.example .env

# ערוך את .env והכנס את פרטי מסד הנתונים שלך
nano .env
```

4. **הגדרת מסד הנתונים**
```bash
# יצירת טבלאות
npm run db:push
```

5. **הפעלת השרת**
```bash
npm run dev
```

האתר יהיה זמין בכתובת: `http://localhost:5200`

## הגדרת Supabase

1. צור פרויקט חדש ב-[Supabase](https://supabase.com)
2. בדף הפרויקט, לחץ על "Connect"
3. העתק את ה-URI מתחת ל-"Connection string"
4. החלף `[YOUR-PASSWORD]` בסיסמת מסד הנתונים
5. הכנס את הכתובת לקובץ `.env`:

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres
```

## מבנה הפרויקט

```
├── client/           # קוד הצד לקוח (React)
│   ├── src/
│   │   ├── components/   # רכיבי UI
│   │   ├── hooks/        # React hooks
│   │   ├── lib/          # ספריות עזר
│   │   └── pages/        # דפי האפליקציה
├── server/           # קוד השרת (Express)
│   ├── routes.ts     # מסלולי API
│   └── storage.ts    # שכבת נתונים
├── shared/           # קוד משותף
│   └── schema.ts     # סכמת מסד הנתונים
└── public/           # קבצים סטטיים
```

## API עיקרי

### לקוחות
- `GET /api/clients` - רשימת לקוחות
- `POST /api/clients` - יצירת לקוח חדש
- `PATCH /api/clients/:id` - עדכון לקוח
- `DELETE /api/clients/:id` - מחיקת לקוח

### רשומות זמן
- `GET /api/time-entries` - רשימת רשומות זמן
- `POST /api/time-entries` - יצירת רשומה חדשה
- `PATCH /api/time-entries/:id` - עדכון רשומה

### אימות
- `POST /api/auth/login` - התחברות
- `POST /api/auth/logout` - התנתקות
- `GET /api/auth/user` - פרטי המשתמש הנוכחי

## טכנולוגיות

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL עם Drizzle ORM
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Build Tool**: Vite

## תמיכה ב-RTL

המערכת מותאמת לחלוטין לכתיבה מימין לשמאל:
- כל הטקסטים בעברית
- פריסה מותאמת לכיוון עברי
- תמיכה בטפסים עבריים
- תאריכים ושעות בפורמט עברי

## פיתוח

להפעלת סביבת פיתוח:

```bash
# הפעלת שרת פיתוח
npm run dev

# בניית הפרויקט לייצור
npm run build

# הצגת גרסת ייצור
npm run preview
```

## רישיון

MIT License - ראה קובץ LICENSE לפרטים נוספים.

## תרומה

מוזמנים לתרום לפרויקט! אנא פתחו Issue או Pull Request.