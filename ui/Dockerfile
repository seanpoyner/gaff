FROM node:22.23.4-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy the openai-adapter
COPY openai-adapter.js ./

# Expose adapter port
EXPOSE 3100

CMD ["node", "openai-adapter.js"]

