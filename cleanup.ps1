# Script de limpieza - ejecutar una sola vez
# Elimina archivos obsoletos del proyecto

Write-Host "🧹 Limpiando archivos innecesarios..." -ForegroundColor Cyan

# Archivos individuales obsoletos
$filesToDelete = @(
    "backend\fly.toml",
    "backend\fix_status.py",
    "backend\docker-compose.yml",
    "frontend\docker-compose.yml",
    "frontend\.env",
    "maps\docker-compose.yml",
    "docker-compose.test-prod.yml",
    "docker-compose.local.yml",
    "docker-compose.prod.yml"
)

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Eliminado: $file" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  No encontrado: $file" -ForegroundColor Yellow
    }
}

# Directorios obsoletos
$dirsToDelete = @(
    "backend\scripts",
    "maps\styles\osm-bright"
)

foreach ($dir in $dirsToDelete) {
    if (Test-Path $dir) {
        Remove-Item $dir -Recurse -Force
        Write-Host "  ✅ Eliminado directorio: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  No encontrado: $dir" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✨ Limpieza completada!" -ForegroundColor Green
Write-Host "Los archivos de backend\maps\ se mantienen localmente (están en .gitignore)" -ForegroundColor Gray
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "  git add -A" -ForegroundColor White
Write-Host "  git commit -m 'chore: cleanup for production'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
