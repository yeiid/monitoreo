# 🗺️ optimized Map Server (TileServer GL)
FROM maptiler/tileserver-gl:latest

# Set working directory
WORKDIR /data

# Copy configuration and assets
# We copy them so the container can run standalone if needed
COPY tileserver-config.json .
COPY styles ./styles
# Ensure fonts directory is copied (it now has a .gitkeep)
COPY fonts ./fonts

# Note: .mbtiles files should still be mounted as volumes for size/persistence
# but we expose the standard port
EXPOSE 8080

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Healthcheck for the map server
HEALTHCHECK --interval=40s --timeout=15s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Start command
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
CMD ["-p", "8080", "-c", "tileserver-config.json"]
