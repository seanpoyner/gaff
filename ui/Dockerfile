FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy the openai-adapter
COPY openai-adapter.js ./

# Expose adapter port
EXPOSE 3100

CMD ["node", "openai-adapter.js"]

