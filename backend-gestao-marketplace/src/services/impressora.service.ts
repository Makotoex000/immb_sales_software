import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ItemVenda } from '../types';

// Nome da impressora no Windows (Configurações > Impressoras). Instale com scripts/instalar-impressora.ps1
const NOME_IMPRESSORA = process.env.IMPRESSORA_NOME || 'IMMB Termica';

// Fora do Windows, fala direto com a impressora pelo USB (VID/PID da GoldenSky / POS-80)
const VENDOR_ID  = 0x0416;
const PRODUCT_ID = 0x5011;

// Bobina de 80 mm: 48 caracteres por linha na fonte normal
const LARGURA = 48;

const ESC = 0x1b;
const GS  = 0x1d;

const FORMAS_PAGAMENTO: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_debito: 'Cartão de Débito',
  cartao_credito: 'Cartão de Crédito',
  fiado: 'Fiado',
};

// Texto na página de código Windows-1252 (ESC t 16), para os acentos saírem certos.
// Caracteres fora dela (emoji etc.) viram "?".
function texto(conteudo: string): Buffer {
  return Buffer.from(conteudo.replace(/[^\x00-\xff]/g, '?'), 'latin1');
}

function linhaItemFormatada(nome: string, qtd: number, subtotal: number): Buffer {
  const valor = `R$ ${Number(subtotal).toFixed(2)}`;
  const qtdStr = ` x${qtd}`;
  const nomeCorte = nome.substring(0, LARGURA - qtdStr.length - valor.length - 1);
  const espaco = LARGURA - nomeCorte.length - qtdStr.length - valor.length;
  return texto(nomeCorte + qtdStr + ' '.repeat(Math.max(1, espaco)) + valor + '\n');
}

export interface DadosImpressao {
  numeroPedido: string;
  nomeCliente?: string;
  itens: ItemVenda[];
  subtotal?: number;
  desconto?: number;
  total: number;
  formaPagamento: string;
  qrCodePix: string; // string Pix Copia e Cola
}

// Envia bytes ESC/POS para uma impressora do Windows em modo RAW (sem passar pelo driver gráfico)
const SCRIPT_RAW_WINDOWS = `
param([string]$Impressora, [string]$Arquivo)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class RawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public class DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }
  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool OpenPrinter(string name, out IntPtr handle, IntPtr defaults);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool ClosePrinter(IntPtr handle);
  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern int StartDocPrinter(IntPtr handle, int level, DOCINFO info);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool EndDocPrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool StartPagePrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool EndPagePrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool WritePrinter(IntPtr handle, byte[] data, int count, out int written);

  public static void Enviar(string impressora, byte[] dados) {
    IntPtr h;
    if (!OpenPrinter(impressora, out h, IntPtr.Zero))
      throw new Exception("Impressora '" + impressora + "' nao encontrada no Windows (erro " + Marshal.GetLastWin32Error() + ")");
    try {
      DOCINFO info = new DOCINFO { pDocName = "Cupom IMMB", pDataType = "RAW" };
      if (StartDocPrinter(h, 1, info) == 0) throw new Exception("StartDocPrinter falhou (erro " + Marshal.GetLastWin32Error() + ")");
      StartPagePrinter(h);
      int escritos;
      bool ok = WritePrinter(h, dados, dados.Length, out escritos);
      EndPagePrinter(h);
      EndDocPrinter(h);
      if (!ok || escritos != dados.Length) throw new Exception("WritePrinter falhou (erro " + Marshal.GetLastWin32Error() + ")");
    } finally { ClosePrinter(h); }
  }
}
"@
[RawPrinter]::Enviar($Impressora, [System.IO.File]::ReadAllBytes($Arquivo))
`;

class ImpressoraServiceClass {
  private gerarComandosQR(dados: string): number[] {
    const payload = Buffer.from(dados, 'utf8');
    const len = payload.length + 3;
    const pL = len & 0xff;
    const pH = (len >> 8) & 0xff;

    return [
      GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00, // modelo QR
      GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x08,        // tamanho módulo 8
      GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30,        // correção M
      GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30,            // dados
      ...payload,
      GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30,        // imprime QR
    ];
  }

  // Monta o cupom em comandos ESC/POS
  private montarCupom(dados: DadosImpressao): Buffer {
    const separador = texto('-'.repeat(LARGURA) + '\n');
    const formaPagamento = FORMAS_PAGAMENTO[dados.formaPagamento] || dados.formaPagamento;

    const cabecalho = Buffer.concat([
      Buffer.from([
        ESC, 0x40,       // inicializa
        ESC, 0x74, 16,   // página de código WPC1252 (acentos)
        ESC, 0x61, 0x01, // centraliza
        ESC, 0x21, 0x30, // fonte grande (altura e largura dupla)
      ]),
      texto('IMMB Vendas\n'),
      Buffer.from([ESC, 0x21, 0x00]), // fonte normal
      texto(`Pedido #${dados.numeroPedido}\n`),
      texto(`${new Date().toLocaleString('pt-BR')}\n`),
    ]);

    const clienteBuffer = dados.nomeCliente
      ? texto(`Cliente: ${dados.nomeCliente}\n`)
      : Buffer.alloc(0);

    const pagamentoBuffer = texto(`Pagamento: ${formaPagamento}\n`);

    // Itens — alinhado à esquerda
    const itensBuffers = [
      Buffer.from([ESC, 0x61, 0x00]), // alinha esquerda
      separador,
      ...dados.itens.map(item =>
        linhaItemFormatada(item.nomeProduto, item.quantidade, item.subtotal)
      ),
      separador,
    ];

    // Total — alinhado à direita; subtotal e desconto só aparecem quando houve desconto
    const totalBuffer = Buffer.concat([
      Buffer.from([ESC, 0x61, 0x02]), // direita
      dados.desconto && dados.desconto > 0
        ? texto(
            `Subtotal: R$ ${Number(dados.subtotal ?? dados.total + dados.desconto).toFixed(2)}\n` +
            `Desconto: -R$ ${Number(dados.desconto).toFixed(2)}\n`
          )
        : Buffer.alloc(0),
      Buffer.from([ESC, 0x21, 0x10]), // fonte grande
      texto(`TOTAL: R$ ${Number(dados.total).toFixed(2)}\n`),
      Buffer.from([
        ESC, 0x21, 0x00, // normal
        ESC, 0x61, 0x01, // centraliza
      ]),
    ]);

    // QR Code PIX
    const qrTituloBuffer = texto('\nPague pelo PIX:\n');
    const qrComandos = Buffer.from(this.gerarComandosQR(dados.qrCodePix));

    const rodape = Buffer.from([
      0x0a, 0x0a, 0x0a, 0x0a, // linhas em branco antes do corte
      GS, 0x56, 0x42, 0x00,   // corte parcial
    ]);

    return Buffer.concat([
      cabecalho,
      clienteBuffer,
      pagamentoBuffer,
      ...itensBuffers,
      totalBuffer,
      qrTituloBuffer,
      qrComandos,
      rodape,
    ]);
  }

  async imprimir(dados: DadosImpressao): Promise<void> {
    const cupom = this.montarCupom(dados);
    if (process.platform === 'win32') {
      await this.enviarWindows(cupom);
    } else {
      await this.enviarUsb(cupom);
    }
  }

  // Windows: pela fila de impressão (a impressora usa o driver padrão do Windows, que bloqueia o acesso USB direto)
  private async enviarWindows(comandos: Buffer): Promise<void> {
    const pasta = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'immb-cupom-'));
    const arquivoCupom = path.join(pasta, 'cupom.bin');
    const arquivoScript = path.join(pasta, 'imprimir.ps1');

    try {
      await fs.promises.writeFile(arquivoCupom, comandos);
      await fs.promises.writeFile(arquivoScript, SCRIPT_RAW_WINDOWS, 'utf8');

      await new Promise<void>((resolve, reject) => {
        execFile(
          'powershell.exe',
          ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', arquivoScript, NOME_IMPRESSORA, arquivoCupom],
          { timeout: 30000, windowsHide: true },
          (erro, _stdout, stderr) => {
            if (!erro) return resolve();
            const detalhe = (stderr || erro.message).split('\n').find(l => l.trim()) || erro.message;
            reject(new Error(`Falha ao imprimir na impressora "${NOME_IMPRESSORA}": ${detalhe.trim()}`));
          }
        );
      });
    } finally {
      await fs.promises.rm(pasta, { recursive: true, force: true });
    }
  }

  // Outros sistemas: direto pelo USB
  private enviarUsb(comandos: Buffer): Promise<void> {
    const usb = require('usb');

    return new Promise((resolve, reject) => {
      const device = usb.findByIds(VENDOR_ID, PRODUCT_ID);

      if (!device) {
        return reject(new Error('Impressora não encontrada. Verifique o cabo USB.'));
      }

      try {
        device.open();
        const iface = device.interfaces[0];
        iface.claim();
        const endpointOut = iface.endpoints.find((e: any) => e.direction === 'out');

        if (!endpointOut) {
          iface.release(() => device.close());
          return reject(new Error('Endpoint de saída não encontrado na impressora.'));
        }

        endpointOut.transfer(comandos, (err: Error) => {
          iface.release(() => device.close());
          if (err) return reject(err);
          resolve();
        });

      } catch (err) {
        try { device.close(); } catch (_) {}
        reject(err);
      }
    });
  }
}

export const impressoraService = new ImpressoraServiceClass();
