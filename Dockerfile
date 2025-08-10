FROM node:20-alpine

WORKDIR /app

# Copy only necessary files first (for better cache)
COPY package*.json ./

# Install all dependencies (including dev, since you’re building here)
RUN npm install

# Copy the rest of the app
COPY . .


EXPOSE 3000

CMD ["npm", "start"]
