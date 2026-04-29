FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html/ai-challenge-2
RUN printf 'server {\n  listen 8080;\n  location /ai-challenge-2/ {\n    alias /usr/share/nginx/html/ai-challenge-2/;\n    try_files $uri $uri/ /ai-challenge-2/index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 8080
