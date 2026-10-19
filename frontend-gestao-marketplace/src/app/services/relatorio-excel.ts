import type { Workbook, Worksheet, Cell } from 'exceljs';

// Cores do tema (mesmas do styles.css), no formato ARGB do Excel
const COR = {
  verde: 'FF17302B',
  verdeClaro: 'FFEEF2EF',
  dourado: 'FFC9A030',
  creme: 'FFF5F4EF',
  borda: 'FFE4E1D8',
  textoSuave: 'FF78746A',
  texto: 'FF1F2B27',
  branco: 'FFFFFFFF',
  terracota: 'FF9F4833',
};

const FORMATO_MOEDA = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
const FORMATO_PORCENTAGEM = '0.0%';
const FORMATO_DESCONTO = '"R$" #,##0.00;-"R$" #,##0.00;"—"'; // zero aparece como "—"

const FORMAS_PAGAMENTO: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao: 'Cartão',
  cartao_debito: 'Cartão de Débito',
  cartao_credito: 'Cartão de Crédito',
  fiado: 'Fiado',
};

export interface ResumoProdutoExcel {
  nomeProduto: string;
  quantidadeVendida: number;
  valorTotalVenda: number;
  lucro: number;
}

export interface VendaExcel {
  id: string;
  dataVenda: string;
  nomeCliente?: string;
  formaPagamento: string;
  status: string;
  subtotal?: number;
  desconto?: number;
  total: number;
  itens?: { nomeProduto: string; quantidade: number }[];
}

export interface DadosRelatorioExcel {
  dataCaixa: string; // AAAA-MM-DD
  totalVendas: number;
  resumoProdutos: ResumoProdutoExcel[];
  vendas: VendaExcel[] | null; // null quando não foi possível carregar as vendas do dia
}

function dataBR(iso: string): string {
  const [ano, mes, dia] = iso.split('T')[0].split('-');
  return `${dia}/${mes}/${ano}`;
}

function preencher(celula: Cell, cor: string) {
  celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cor } };
}

function bordaInferior(celula: Cell, cor = COR.borda) {
  celula.border = { bottom: { style: 'thin', color: { argb: cor } } };
}

// Faixa verde de título + linha de subtítulo, ocupando "colunas" colunas
function cabecalhoPlanilha(planilha: Worksheet, colunas: number, titulo: string, subtitulo: string) {
  planilha.mergeCells(1, 1, 1, colunas);
  const celTitulo = planilha.getCell(1, 1);
  celTitulo.value = titulo;
  celTitulo.font = { name: 'Georgia', size: 16, bold: true, color: { argb: COR.branco } };
  celTitulo.alignment = { vertical: 'middle', indent: 1 };
  preencher(celTitulo, COR.verde);
  planilha.getRow(1).height = 34;

  planilha.mergeCells(2, 1, 2, colunas);
  const celSub = planilha.getCell(2, 1);
  celSub.value = subtitulo;
  celSub.font = { size: 10, color: { argb: COR.dourado } };
  celSub.alignment = { vertical: 'middle', indent: 1 };
  preencher(celSub, COR.verde);
  planilha.getRow(2).height = 20;
}

// Linha de cabeçalho de tabela: fundo verde-claro, texto escuro em negrito, borda dourada embaixo
function cabecalhoTabela(planilha: Worksheet, linha: number, titulos: string[], alinhamentos: ('left' | 'center' | 'right')[]) {
  const row = planilha.getRow(linha);
  titulos.forEach((titulo, i) => {
    const cel = row.getCell(i + 1);
    cel.value = titulo.toUpperCase();
    cel.font = { size: 9, bold: true, color: { argb: COR.verde } };
    cel.alignment = { horizontal: alinhamentos[i], vertical: 'middle', indent: alinhamentos[i] === 'left' ? 1 : 0 };
    preencher(cel, COR.verdeClaro);
    cel.border = { bottom: { style: 'medium', color: { argb: COR.dourado } } };
  });
  row.height = 24;
}

// Linha de dados com zebra suave e borda fina
function estilizarLinhaDados(planilha: Worksheet, linha: number, colunas: number, zebra: boolean, alinhamentos: ('left' | 'center' | 'right')[]) {
  const row = planilha.getRow(linha);
  row.height = 20;
  for (let c = 1; c <= colunas; c++) {
    const cel = row.getCell(c);
    cel.font = { size: 11, color: { argb: COR.texto } };
    cel.alignment = { horizontal: alinhamentos[c - 1], vertical: 'middle', indent: alinhamentos[c - 1] === 'left' ? 1 : 0 };
    if (zebra) preencher(cel, COR.creme);
    bordaInferior(cel);
  }
}

// Linha de total: negrito, borda dupla em cima
function estilizarLinhaTotal(planilha: Worksheet, linha: number, colunas: number) {
  const row = planilha.getRow(linha);
  row.height = 24;
  for (let c = 1; c <= colunas; c++) {
    const cel = row.getCell(c);
    cel.font = { size: 11, bold: true, color: { argb: COR.verde } };
    cel.border = { top: { style: 'double', color: { argb: COR.verde } } };
    if (!cel.alignment) cel.alignment = { vertical: 'middle' };
  }
}

function montarAbaResumo(livro: Workbook, dados: DadosRelatorioExcel) {
  const aba = livro.addWorksheet('Resumo', {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  aba.columns = [
    { width: 34 }, // Produto
    { width: 10 }, // Qtd
    { width: 15 }, // Preço médio
    { width: 20 }, // Total vendido
    { width: 20 }, // Custo
    { width: 20 }, // Lucro
    { width: 12 }, // Margem
  ];

  const geradoEm = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  cabecalhoPlanilha(aba, 7, 'IMMB Vendas · Fechamento de Caixa', `Caixa de ${dataBR(dados.dataCaixa)}   ·   Gerado em ${geradoEm}`);

  // Tabela de produtos (começa na linha 9; os indicadores ficam nas linhas 4-6 e usam fórmulas dela)
  const colunas = ['Produto', 'Qtd.', 'Preço médio', 'Total vendido', 'Custo', 'Lucro', 'Margem'];
  const alinh: ('left' | 'center' | 'right')[] = ['left', 'center', 'right', 'right', 'right', 'right', 'right'];
  const linhaTituloTabela = 8;
  const linhaCabecalho = 9;
  const primeira = linhaCabecalho + 1;

  const tituloTabela = aba.getCell(linhaTituloTabela, 1);
  tituloTabela.value = 'Vendas por produto';
  tituloTabela.font = { name: 'Georgia', size: 13, bold: true, color: { argb: COR.verde } };
  aba.getRow(linhaTituloTabela).height = 26;
  tituloTabela.alignment = { vertical: 'bottom' };

  cabecalhoTabela(aba, linhaCabecalho, colunas, alinh);

  // Mais vendidos (em valor) primeiro
  const produtos = [...dados.resumoProdutos].sort((a, b) => b.valorTotalVenda - a.valorTotalVenda);

  produtos.forEach((p, i) => {
    const l = primeira + i;
    const row = aba.getRow(l);
    row.getCell(1).value = p.nomeProduto;
    row.getCell(2).value = p.quantidadeVendida;
    row.getCell(3).value = { formula: `IF(B${l}=0,0,D${l}/B${l})`, result: p.quantidadeVendida ? p.valorTotalVenda / p.quantidadeVendida : 0 };
    row.getCell(4).value = Number(p.valorTotalVenda);
    row.getCell(5).value = { formula: `D${l}-F${l}`, result: p.valorTotalVenda - p.lucro };
    row.getCell(6).value = Number(p.lucro);
    row.getCell(7).value = { formula: `IF(D${l}=0,0,F${l}/D${l})`, result: p.valorTotalVenda ? p.lucro / p.valorTotalVenda : 0 };
    estilizarLinhaDados(aba, l, colunas.length, i % 2 === 1, alinh);
  });

  const ultima = primeira + Math.max(produtos.length, 1) - 1;
  const linhaTotal = ultima + 1;
  const somaVendido = produtos.reduce((s, p) => s + Number(p.valorTotalVenda), 0);
  const somaLucro = produtos.reduce((s, p) => s + Number(p.lucro), 0);
  const somaQtd = produtos.reduce((s, p) => s + Number(p.quantidadeVendida), 0);

  const total = aba.getRow(linhaTotal);
  total.getCell(1).value = 'Total';
  total.getCell(2).value = { formula: `SUM(B${primeira}:B${ultima})`, result: somaQtd };
  total.getCell(4).value = { formula: `SUM(D${primeira}:D${ultima})`, result: somaVendido };
  total.getCell(5).value = { formula: `SUM(E${primeira}:E${ultima})`, result: somaVendido - somaLucro };
  total.getCell(6).value = { formula: `SUM(F${primeira}:F${ultima})`, result: somaLucro };
  total.getCell(7).value = { formula: `IF(D${linhaTotal}=0,0,F${linhaTotal}/D${linhaTotal})`, result: somaVendido ? somaLucro / somaVendido : 0 };
  estilizarLinhaTotal(aba, linhaTotal, colunas.length);
  total.getCell(1).alignment = { vertical: 'middle', indent: 1 };
  total.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
  [4, 5, 6, 7].forEach(c => (total.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' }));

  // Formatos numéricos da tabela
  for (let l = primeira; l <= linhaTotal; l++) {
    [3, 4, 5, 6].forEach(c => (aba.getCell(l, c).numFmt = FORMATO_MOEDA));
    aba.getCell(l, 7).numFmt = FORMATO_PORCENTAGEM;
    aba.getCell(l, 2).numFmt = '0';
  }

  if (produtos.length > 0) {
    aba.autoFilter = { from: { row: linhaCabecalho, column: 1 }, to: { row: ultima, column: colunas.length } };
  }

  // Indicadores no topo: rótulo pequeno (linha 4) e valor grande (linha 5)
  // Cada indicador ocupa as colunas [de, ate] (Itens vendidos usa B:C, que são estreitas sozinhas)
  const indicadores: { rotulo: string; valor: any; formato?: string; cor?: string; de: number; ate: number }[] = [
    { rotulo: 'Vendas no dia', valor: dados.totalVendas, formato: '0', de: 1, ate: 1 },
    { rotulo: 'Itens vendidos', valor: { formula: `B${linhaTotal}`, result: somaQtd }, formato: '0', de: 2, ate: 3 },
    { rotulo: 'Total vendido', valor: { formula: `D${linhaTotal}`, result: somaVendido }, formato: FORMATO_MOEDA, de: 4, ate: 4 },
    { rotulo: 'Custo', valor: { formula: `E${linhaTotal}`, result: somaVendido - somaLucro }, formato: FORMATO_MOEDA, cor: COR.terracota, de: 5, ate: 5 },
    { rotulo: 'Lucro', valor: { formula: `F${linhaTotal}`, result: somaLucro }, formato: FORMATO_MOEDA, de: 6, ate: 6 },
    { rotulo: 'Margem', valor: { formula: `G${linhaTotal}`, result: somaVendido ? somaLucro / somaVendido : 0 }, formato: FORMATO_PORCENTAGEM, de: 7, ate: 7 },
  ];
  indicadores.forEach(ind => {
    if (ind.ate > ind.de) {
      aba.mergeCells(4, ind.de, 4, ind.ate);
      aba.mergeCells(5, ind.de, 5, ind.ate);
    }

    const rot = aba.getCell(4, ind.de);
    rot.value = ind.rotulo.toUpperCase();
    rot.font = { size: 8, bold: true, color: { argb: COR.textoSuave } };
    rot.alignment = { horizontal: 'left', vertical: 'bottom', indent: 1 };

    const val = aba.getCell(5, ind.de);
    val.value = ind.valor;
    val.numFmt = ind.formato || 'General';
    val.font = { name: 'Georgia', size: 14, bold: true, color: { argb: ind.cor || COR.verde } };
    // shrinkToFit: se um valor muito grande não couber, a fonte diminui em vez de virar "####"
    val.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, shrinkToFit: true };

    for (let c = ind.de; c <= ind.ate; c++) {
      preencher(aba.getCell(4, c), COR.creme);
      preencher(aba.getCell(5, c), COR.creme);
      aba.getCell(5, c).border = { bottom: { style: 'medium', color: { argb: COR.dourado } } };
    }
  });
  aba.getRow(4).height = 20;
  aba.getRow(5).height = 30;

  aba.getCell(6, 1).value = 'O custo é estimado pelo sistema no fechamento do caixa.';
  aba.getCell(6, 1).font = { size: 8, italic: true, color: { argb: COR.textoSuave } };
}

function montarAbaVendas(livro: Workbook, dados: DadosRelatorioExcel) {
  const aba = livro.addWorksheet('Vendas do dia', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  aba.columns = [
    { width: 8 },  // Hora
    { width: 12 }, // Pedido
    { width: 24 }, // Cliente
    { width: 20 }, // Pagamento
    { width: 44 }, // Itens
    { width: 14 }, // Subtotal
    { width: 13 }, // Desconto
    { width: 14 }, // Total
  ];

  cabecalhoPlanilha(aba, 8, 'Vendas do dia', `Caixa de ${dataBR(dados.dataCaixa)}`);

  const colunas = ['Hora', 'Pedido', 'Cliente', 'Pagamento', 'Itens', 'Subtotal', 'Desconto', 'Total'];
  const alinh: ('left' | 'center' | 'right')[] = ['center', 'left', 'left', 'left', 'left', 'right', 'right', 'right'];
  const linhaCabecalho = 4;
  cabecalhoTabela(aba, linhaCabecalho, colunas, alinh);

  const vendas = [...(dados.vendas || [])].sort((a, b) => a.dataVenda.localeCompare(b.dataVenda));
  const rotuloPagamento = (v: VendaExcel) => {
    const forma = FORMAS_PAGAMENTO[v.formaPagamento] || v.formaPagamento;
    return v.status === 'fiado' ? `${forma} (fiado pago)` : forma;
  };
  const primeira = linhaCabecalho + 1;

  vendas.forEach((v, i) => {
    const l = primeira + i;
    const row = aba.getRow(l);
    const desconto = Number(v.desconto) || 0;

    row.getCell(1).value = new Date(v.dataVenda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    row.getCell(2).value = '#' + v.id.substring(0, 8).toUpperCase();
    row.getCell(3).value = v.nomeCliente || '—';
    row.getCell(4).value = rotuloPagamento(v);
    row.getCell(5).value = (v.itens || []).map(item => `${item.quantidade}x ${item.nomeProduto}`).join(', ');
    row.getCell(6).value = Number(v.subtotal ?? v.total + desconto);
    row.getCell(7).value = desconto;
    row.getCell(8).value = Number(v.total);
    estilizarLinhaDados(aba, l, colunas.length, i % 2 === 1, alinh);
    row.getCell(5).alignment = { vertical: 'middle', wrapText: true, indent: 1 };
    if (desconto > 0) row.getCell(7).font = { size: 11, color: { argb: COR.terracota } };
  });

  const ultima = primeira + Math.max(vendas.length, 1) - 1;
  const linhaTotal = ultima + 1;
  const total = aba.getRow(linhaTotal);
  total.getCell(1).value = 'Total';
  total.getCell(2).value = `${vendas.length} venda${vendas.length === 1 ? '' : 's'}`;
  total.getCell(6).value = { formula: `SUM(F${primeira}:F${ultima})`, result: vendas.reduce((s, v) => s + Number(v.subtotal ?? v.total + (Number(v.desconto) || 0)), 0) };
  total.getCell(7).value = { formula: `SUM(G${primeira}:G${ultima})`, result: vendas.reduce((s, v) => s + (Number(v.desconto) || 0), 0) };
  total.getCell(8).value = { formula: `SUM(H${primeira}:H${ultima})`, result: vendas.reduce((s, v) => s + Number(v.total), 0) };
  estilizarLinhaTotal(aba, linhaTotal, colunas.length);
  [6, 7, 8].forEach(c => (total.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' }));

  for (let l = primeira; l <= linhaTotal; l++) {
    [6, 8].forEach(c => (aba.getCell(l, c).numFmt = FORMATO_MOEDA));
    aba.getCell(l, 7).numFmt = FORMATO_DESCONTO;
  }

  if (vendas.length > 0) {
    aba.autoFilter = { from: { row: linhaCabecalho, column: 1 }, to: { row: ultima, column: colunas.length } };
  }

  // Quadro "Por forma de pagamento" (para conferir o caixa), com SOMASE sobre a tabela acima
  const formas = Array.from(new Set(vendas.map(rotuloPagamento)));
  if (formas.length > 0) {
    const inicioQuadro = linhaTotal + 3;
    const titulo = aba.getCell(inicioQuadro, 3);
    titulo.value = 'Por forma de pagamento';
    titulo.font = { name: 'Georgia', size: 13, bold: true, color: { argb: COR.verde } };

    const alinhQuadro: ('left' | 'center' | 'right')[] = ['left', 'right', 'right'];
    ['Forma', 'Vendas', 'Total'].forEach((t, i) => {
      const cel = aba.getCell(inicioQuadro + 1, i + 3);
      cel.value = t.toUpperCase();
      cel.font = { size: 9, bold: true, color: { argb: COR.verde } };
      cel.alignment = { horizontal: alinhQuadro[i], vertical: 'middle', indent: i === 0 ? 1 : 0 };
      preencher(cel, COR.verdeClaro);
      cel.border = { bottom: { style: 'medium', color: { argb: COR.dourado } } };
    });

    formas.forEach((forma, i) => {
      const l = inicioQuadro + 2 + i;
      const doGrupo = vendas.filter(v => rotuloPagamento(v) === forma);
      aba.getCell(l, 3).value = forma;
      aba.getCell(l, 4).value = { formula: `COUNTIF(D${primeira}:D${ultima},C${l})`, result: doGrupo.length };
      aba.getCell(l, 5).value = { formula: `SUMIF(D${primeira}:D${ultima},C${l},H${primeira}:H${ultima})`, result: doGrupo.reduce((s, v) => s + Number(v.total), 0) };
      for (let c = 3; c <= 5; c++) {
        const cel = aba.getCell(l, c);
        cel.font = { size: 11, color: { argb: COR.texto } };
        cel.alignment = { horizontal: alinhQuadro[c - 3], vertical: 'middle', indent: c === 3 ? 1 : 0 };
        bordaInferior(cel);
      }
      aba.getCell(l, 5).numFmt = FORMATO_MOEDA;
    });
  }
}

// Monta a planilha do fechamento de caixa e devolve o conteúdo do .xlsx
export async function gerarFechamentoExcel(dados: DadosRelatorioExcel): Promise<ArrayBuffer> {
  // exceljs é CommonJS: conforme o empacotador, vem direto ou dentro de "default"
  const modulo: any = await import('exceljs');
  const ExcelJS: typeof import('exceljs') = modulo.default ?? modulo;
  const livro = new ExcelJS.Workbook();
  livro.creator = 'IMMB Vendas';
  livro.created = new Date();

  montarAbaResumo(livro, dados);
  if (dados.vendas) montarAbaVendas(livro, dados);

  return livro.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

// Gera o .xlsx do fechamento de caixa e dispara o download no navegador
export async function exportarFechamentoExcel(dados: DadosRelatorioExcel): Promise<void> {
  const buffer = await gerarFechamentoExcel(dados);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fechamento_caixa_${dados.dataCaixa}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
