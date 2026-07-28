FROM node:18

WORKDIR /app

COPY package*.json ./

# Remove lockfile to avoid cross-platform optional dependency resolution issues
# The package-lock.json was generated on Windows and npm has a known bug
# where platform-specific optional deps (like @rollup/rollup-linux-x64-gnu for Linux)
# are not properly installed from the Windows-generated lockfile.
# See: https://github.com/npm/cli/issues/4828
RUN rm -f package-lock.json && npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

