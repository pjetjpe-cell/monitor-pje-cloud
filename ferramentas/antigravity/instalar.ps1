# Instala/atualiza a ponte GAV -> Antigravity no computador do escritorio.
# Rode no PowerShell (nao precisa ser administrador):
#   irm https://raw.githubusercontent.com/pjetjpe-cell/monitor-pje-cloud/<commit>/ferramentas/antigravity/instalar.ps1 | iex
# Rodar de novo = atualizar. Nada e instalado sem voce responder "s".
& {
    $ErrorActionPreference = 'Stop'
    $Ramo = 'claude/cool-faraday-8s4iv9'
    $Destino = Join-Path $env:USERPROFILE 'gav\monitor-pje-cloud'
    Write-Host "GAV - instalando a ponte do Antigravity em $Destino" -ForegroundColor Cyan

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host 'Falta o Node.js. Instale a versao LTS em https://nodejs.org e rode este comando de novo.' -ForegroundColor Yellow
        return
    }

    # 1. Repositorio (zip publico do GitHub; nao precisa de git)
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $zip = Join-Path $env:TEMP 'gav-repo.zip'
    $tmp = Join-Path $env:TEMP ('gav-repo-' + [guid]::NewGuid().ToString('N'))
    Invoke-WebRequest -Uri "https://codeload.github.com/pjetjpe-cell/monitor-pje-cloud/zip/refs/heads/$Ramo" -OutFile $zip -UseBasicParsing
    Expand-Archive -LiteralPath $zip -DestinationPath $tmp -Force
    $raiz = Get-ChildItem -LiteralPath $tmp -Directory | Select-Object -First 1
    New-Item -ItemType Directory -Force -Path $Destino | Out-Null
    Copy-Item -Path (Join-Path $raiz.FullName '*') -Destination $Destino -Recurse -Force
    Remove-Item -LiteralPath $zip, $tmp -Recurse -Force
    Write-Host '  [ok] repositorio atualizado' -ForegroundColor Green

    # 2. Python + PyMuPDF (conferencias). Opcional: sem ele o agente avisa.
    $py = Get-Command py -ErrorAction SilentlyContinue
    if (-not $py) { $py = Get-Command python -ErrorAction SilentlyContinue }
    if ($py) {
        # PowerShell 5.1 transforma stderr de programa em erro: checar sem 'Stop'.
        $ErrorActionPreference = 'Continue'
        & $py.Source -c "import pymupdf" 2>$null | Out-Null
        $okPy = ($LASTEXITCODE -eq 0)
        $ErrorActionPreference = 'Stop'
        if ($okPy) { Write-Host '  [ok] Python com PyMuPDF' -ForegroundColor Green }
        else { Write-Host "  [!] Falta o PyMuPDF. Para instalar: $($py.Name) -m pip install pymupdf" -ForegroundColor Yellow }
    } else { Write-Host '  [!] Python nao encontrado: as conferencias (gav.pasta, --verificar) ficam para a nuvem.' -ForegroundColor Yellow }

    # 3. Antigravity CLI (agy)
    if (Get-Command agy -ErrorAction SilentlyContinue) {
        Write-Host '  [ok] Antigravity CLI (agy) encontrado' -ForegroundColor Green
    } else {
        $r = Read-Host '  O Antigravity CLI (agy) nao esta instalado. Instalar agora pelo instalador oficial do Google? [s/N]'
        if ($r -match '^[sS]') {
            Invoke-RestMethod https://antigravity.google/cli/install.ps1 | Invoke-Expression
            Write-Host '  Depois: feche e abra o PowerShell e rode "agy" uma vez para entrar com a conta Google.' -ForegroundColor Cyan
        } else {
            Write-Host '  Sem o agy, use o modo IDE no painel (abre o Antigravity e cola o pedido).' -ForegroundColor Yellow
        }
    }

    # 4. Atalho "GAV Antigravity" na Area de Trabalho (acorda o vigia)
    $alvo = Join-Path $Destino 'ferramentas\antigravity\acordar.cmd'
    $atalho = Join-Path ([Environment]::GetFolderPath('Desktop')) 'GAV Antigravity.lnk'
    $s = (New-Object -ComObject WScript.Shell).CreateShortcut($atalho)
    $s.TargetPath = $alvo
    $s.WorkingDirectory = $Destino
    $s.Description = 'Acorda o vigia que recebe os pedidos do painel GAV e abre o Antigravity'
    $s.Save()
    Write-Host '  [ok] atalho "GAV Antigravity" na Area de Trabalho' -ForegroundColor Green

    # 5. Token para colar no painel (uma vez)
    $token = & node (Join-Path $Destino 'ferramentas\antigravity\ponte.mjs') token
    Write-Host "`nToken do painel: $token" -ForegroundColor Cyan
    Write-Host 'Cole este token no painel (campo "Token deste PC"). Depois clique duas vezes em "GAV Antigravity".'
}
