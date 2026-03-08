# 🗺️ Dockerfile para el Servidor de Mapas (TileServer GL)
FROM maptiler/tileserver-gl:latest

# Copiar configuración y activos de mapas
COPY ./tileserver-config.json /data/tileserver-config.json
COPY ./styles /data/styles
COPY ./fonts /data/fonts

# Nota: El archivo .mbtiles se montará vía volumen para persistencia y tamaño
# o se puede copiar aquí si es pequeño, pero en este proyecto preferimos volúmenes.

EXPOSE 8080

CMD ["-p", "8080", "-c", "/data/tileserver-config.json"]
