@echo off
cd /d C:\Users\silvestr.liskin\Desktop\risale-ai-studio\apps\readest-app
npx dotenv -e .env.web -- npx next dev -p 3000
