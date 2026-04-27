FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ENV NODE_ENV=production
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCAKHqP1nO7FnzhuXWoIpyYS9SRHUHfXkk
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fir-project-f09ad.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=fir-project-f09ad
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fir-project-f09ad.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=617654374792
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:617654374792:web:5f887c9cbb1ac482142a3d
ENV NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://fir-project-f09ad-default-rtdb.firebaseio.com
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCAKHqP1nO7FnzhuXWoIpyYS9SRHUHfXkk
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCAKHqP1nO7FnzhuXWoIpyYS9SRHUHfXkk
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fir-project-f09ad.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=fir-project-f09ad
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fir-project-f09ad.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=617654374792
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:617654374792:web:5f887c9cbb1ac482142a3d
ENV NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://fir-project-f09ad-default-rtdb.firebaseio.com
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCAKHqP1nO7FnzhuXWoIpyYS9SRHUHfXkk

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 8080

CMD ["node", "server.js"]
