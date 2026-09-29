# MIO Bloggerlar boshqaruvi — reja

## Natija
Ikki asosiy tabli, login/rol nazorati bilan ishlaydigan blogger hamkorlik tracker: katalog va ishlanayotgan hamkorliklar. Katalogdagi nickname Instagram profiliga aniq link beradi; takroriy hamkorliklar bitta blogger yozuvida `history` orqali sanaladi.

## Arxitektura
- **Frontend:** React + TypeScript + Vite, browser-rendered SPA.
- **Backend:** mavjud Express server (`server.ts`) JSON API bilan; development va productionda bir origin.
- **Persistence:** mavjud Supabase `bloggers` jadvali va uning `history` JSON ustuni. Supabase env yo‘q bo‘lsa, lokal `data/bloggers.json` fallback faqat development/demo uchun qoladi.
- **Auth:** server API login endpointi role token beradi; barcha mutatsiyalar serverda admin roli bilan tekshiriladi. Viewer faqat GET qila oladi.
- **Deployment:** mavjud Express container/static SPA oqimi saqlanadi; private API javoblari cache qilinmaydi.

## Asosiy modullar
- `src/App.tsx`: session, ikki tab, modallar, filterlar va data orchestration.
- `src/api.ts`: login va blogger CRUD client.
- `src/types.ts`: role, blogger va history shartnomalari.
- `server.ts`: auth middleware, blogger CRUD, completion va 5 kunlik pending query.
- `src/index.css`: responsive dashboard va modal/input zoom himoyasi.

## Verification
`npm run lint` va `npm run build`; API mutatsiya yo‘llarida viewer bloklanishi va nickname uniqueness/history logikasi source inspection hamda lokal smoke requestlar bilan tekshiriladi.
