# 🗺️ Map Server (TileServer GL)
FROM maptiler/tileserver-gl:latest

# Set working directory
WORKDIR /data

# Copy configuration and style assets
COPY tileserver-config.json .
COPY styles ./styles
COPY fonts ./fonts

# Note: colombia.mbtiles is mounted as a volume (/data), not baked into the image
EXPOSE 8080

# Start command
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
CMD ["-p", "8080", "-c", "/data/tileserver-config.json"]
