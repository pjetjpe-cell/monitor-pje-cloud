# Abre o Antigravity com um pedido ja conferido pela ponte (ponte.mjs).
# Chamado pela ponte numa janela propria:  acordar.ps1 -Pedido <arquivo.json>
# O pedido traz: rotulo, prompt, modo (cli|ide) e repo.
param([Parameter(Mandatory = $true)][string]$Pedido)

$ErrorActionPreference = 'Stop'
$p = Get-Content -LiteralPath $Pedido -Raw -Encoding UTF8 | ConvertFrom-Json
Remove-Item -LiteralPath $Pedido -ErrorAction SilentlyContinue

$Host.UI.RawUI.WindowTitle = "GAV - $($p.rotulo)"
Set-Location -LiteralPath $p.repo
Write-Host "GAV -> Antigravity: $($p.rotulo)" -ForegroundColor Cyan
Write-Host "Pasta: $($p.repo)`n" -ForegroundColor DarkGray
Write-Host $p.prompt
Write-Host ''

# O texto do pedido fica tambem na area de transferencia, para colar se preciso.
try { Set-Clipboard -Value $p.prompt } catch { }

if ($p.modo -eq 'ide') {
    $ide = Get-Command antigravity -ErrorAction SilentlyContinue
    if ($ide) { & $ide.Source $p.repo } else { Write-Host 'Abra o Antigravity nesta pasta (comando "antigravity" nao encontrado).' -ForegroundColor Yellow }
    Write-Host 'O pedido esta copiado: no Antigravity, abra o Agent Manager e cole (Ctrl+V).' -ForegroundColor Green
    return
}

$agy = Get-Command agy -ErrorAction SilentlyContinue
if (-not $agy) {
    Write-Host 'O Antigravity CLI (agy) nao esta instalado neste PC.' -ForegroundColor Yellow
    Write-Host 'Rode ferramentas\antigravity\instalar.ps1 ou escolha o modo IDE no painel.'
    return
}
Write-Host 'Abrindo o agy. Cada acao dele pede a sua aprovacao aqui nesta janela.' -ForegroundColor Green
& $agy.Source -i $p.prompt
if ($LASTEXITCODE) {
    Write-Host "`nSe o agy nao aceitou a opcao -i, digite: agy   e cole o pedido (ja esta copiado)." -ForegroundColor Yellow
}
