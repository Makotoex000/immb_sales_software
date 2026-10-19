# Instala a impressora térmica (GoldenSky / POS-80) no Windows para o IMMB Vendas imprimir os cupons.
# Rode UMA vez, no PowerShell aberto como Administrador:
#   powershell -ExecutionPolicy Bypass -File scripts\instalar-impressora.ps1
#
# Usa o driver "Generic / Text Only", que já vem no Windows: o backend envia os comandos
# ESC/POS em modo RAW, então não precisa do driver do fabricante.

param(
  [string]$Nome = 'IMMB Termica'
)

$ErrorActionPreference = 'Stop'
$driver = 'Generic / Text Only'

# Porta USB virtual criada pelo Windows quando a impressora é conectada (USB001, USB002...)
$porta = Get-PrinterPort | Where-Object { $_.Name -like 'USB*' } | Sort-Object Name | Select-Object -First 1
if (-not $porta) {
  throw 'Nenhuma porta USB de impressora encontrada. Confira se a impressora está ligada e conectada no USB.'
}
Write-Host "Porta encontrada: $($porta.Name)"

if (-not (Get-PrinterDriver -Name $driver -ErrorAction SilentlyContinue)) {
  Write-Host "Instalando driver '$driver'..."
  Add-PrinterDriver -Name $driver
}

$existente = Get-Printer -Name $Nome -ErrorAction SilentlyContinue
if ($existente) {
  Set-Printer -Name $Nome -PortName $porta.Name -DriverName $driver
  Write-Host "Impressora '$Nome' atualizada para a porta $($porta.Name)."
} else {
  Add-Printer -Name $Nome -DriverName $driver -PortName $porta.Name
  Write-Host "Impressora '$Nome' instalada na porta $($porta.Name)."
}

Write-Host 'Pronto. Reinicie o backend (npm run dev) e faça uma venda para testar.'
