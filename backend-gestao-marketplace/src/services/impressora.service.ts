import { ItemVenda } from '../types';

const usb = require('usb');

const VENDOR_ID  = 0x0416;
const PRODUCT_ID = 0x5011;

const ESC = 0x1b;
const GS  = 0x1d;

function linha(texto: string, largura = 32): string {
  return texto.substring(0, largura).padEnd(largura, ' ');
}

function linhaItemFormatada(nome: string, qtd: number, subtotal: number): Buffer {
  const valor = `R$${subtotal.toFixed(2)}`;
  const nomeCorte = nome.substring(0, 20);
  const qtdStr = `x${qtd}`;
  const espaco = 32 - nomeCorte.length - qtdStr.length - valor.length;
  const row = nomeCorte + qtdStr + ' '.repeat(Math.max(1, espaco)) + valor;
  return Buffer.from(row + '\n', 'utf8');
}

export interface DadosImpressao {
  numeroPedido: string;
  nomeCliente?: string;
  itens: ItemVenda[];
  total: number;
  formaPagamento: string;
  qrCodePix: string; // string Pix Copia e Cola
}

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

  async imprimir(dados: DadosImpressao): Promise<void> {
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

        const separador = Buffer.from('--------------------------------\n', 'utf8');

        const cabecalho = Buffer.from([
          ESC, 0x40,       // inicializa
          ESC, 0x61, 0x01, // centraliza
          ESC, 0x21, 0x10, // fonte grande
          ...Buffer.from('IMMB Vendas\n', 'utf8'),
          ESC, 0x21, 0x00, // fonte normal
          ...Buffer.from(`Pedido #${dados.numeroPedido}\n`, 'utf8'),
        ]);

        const clienteBuffer = dados.nomeCliente
          ? Buffer.from(`Cliente: ${dados.nomeCliente}\n`, 'utf8')
          : Buffer.alloc(0);

        const pagamentoBuffer = Buffer.from(
          `Pagamento: ${dados.formaPagamento}\n`, 'utf8'
        );

        // Itens — alinhado à esquerda
        const itensBuffers = [
          Buffer.from([ESC, 0x61, 0x00]), // alinha esquerda
          separador,
          ...dados.itens.map(item =>
            linhaItemFormatada(item.nomeProduto, item.quantidade, item.subtotal)
          ),
          separador,
        ];

        // Total — alinhado à direita
        const totalBuffer = Buffer.from([
          ESC, 0x61, 0x02,       // direita
          ESC, 0x21, 0x10,       // fonte grande
          ...Buffer.from(`TOTAL: R$ ${dados.total.toFixed(2)}\n`, 'utf8'),
          ESC, 0x21, 0x00,       // normal
          ESC, 0x61, 0x01,       // centraliza
        ]);

        // QR Code PIX
        const qrTituloBuffer = Buffer.from('\nPague pelo PIX:\n', 'utf8');
        const qrComandos = Buffer.from(this.gerarComandosQR(dados.qrCodePix));

        const rodape = Buffer.from([
          0x0a, 0x0a, 0x0a,       // 3 linhas em branco
          GS, 0x56, 0x42, 0x00,  // corte
        ]);

        const comandos = Buffer.concat([
          cabecalho,
          clienteBuffer,
          pagamentoBuffer,
          ...itensBuffers,
          totalBuffer,
          qrTituloBuffer,
          qrComandos,
          rodape,
        ]);

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