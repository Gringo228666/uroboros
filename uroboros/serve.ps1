# Локальный сервер для сайта и редактора.
# Запускается двойным кликом по «Редактор сайта.bat» — вручную открывать не нужно.

$root = $PSScriptRoot
$port = 8123
$url  = "http://localhost:$port/admin.html"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
  $listener.Start()
} catch {
  Write-Host ""
  Write-Host "  Не удалось занять порт $port — возможно, редактор уже запущен." -ForegroundColor Yellow
  Write-Host "  Откройте в браузере: $url"
  Write-Host ""
  Read-Host "  Нажмите Enter, чтобы закрыть окно"
  exit
}

Write-Host ""
Write-Host "  УРОБОРОС — редактор запущен" -ForegroundColor Green
Write-Host "  Редактор: $url"
Write-Host "  Сайт:     http://localhost:$port/index.html"
Write-Host ""
Write-Host "  Не закрывайте это окно, пока работаете. Для выхода нажмите Ctrl+C." -ForegroundColor DarkGray
Write-Host ""

Start-Process $url

$types = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
  ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }
    $path = Join-Path $root $rel

    # не выпускаем запросы за пределы папки сайта
    $full = [System.IO.Path]::GetFullPath($path)
    if (-not $full.StartsWith([System.IO.Path]::GetFullPath($root))) {
      $ctx.Response.StatusCode = 403
      $ctx.Response.Close()
      continue
    }

    if (Test-Path $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $ct = $types[$ext]
      if (-not $ct) { $ct = "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ctx.Response.ContentType = $ct
      $ctx.Response.Headers.Add("Cache-Control", "no-store")
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
  } catch { }
}
