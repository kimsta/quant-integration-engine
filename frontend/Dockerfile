# STAGE 1: The Build Environment
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for caching
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the React code and compile it
COPY . .
RUN npm run build

# STAGE 2: The Production Server
FROM nginx:alpine

# Copy the compiled static files from Stage 1 into the Nginx serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
