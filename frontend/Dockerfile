FROM node:18-alpine

WORKDIR /app

# Копируем зависимости
COPY frontend/package*.json ./

RUN npm install

# Копируем исходники фронтенда
COPY frontend/ .

# При сборке Next.js может потребоваться API URL, но можно пробросить его и в рантайме.
# Для статичной генерации Next.js лучше иметь его на этапе билда. 
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG INTERNAL_API_URL=http://backend-service:3001
ENV INTERNAL_API_URL=$INTERNAL_API_URL

# Собираем production билд
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
