export type Market = 'CN' | 'EU' | 'US' | 'HALAL';
export type MatrixCell = {
  level: 'Bắt buộc' | 'Khuyến nghị' | 'Không yêu cầu';
  legalBasis: string;
  sourceUrl: string;
};
export type MatrixRow = {
  id: string;
  labelVi: string;
  labelEn: string;
  cells: Partial<Record<Market, MatrixCell>>;
};
export const markets: Market[] = ['CN', 'EU', 'US', 'HALAL'];
export const marketRows: MatrixRow[] = [
  {
    id: 'traceability',
    labelVi: 'Truy xuất 1 bước trước / 1 bước sau',
    labelEn: 'One step back / one step forward traceability',
    cells: {
      EU: {
        level: 'Bắt buộc',
        legalBasis: 'Regulation (EC) No 178/2002 — Article 18',
        sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2002/178/oj/eng',
      },
    },
  },
  {
    id: 'residues',
    labelVi: 'Giới hạn dư lượng',
    labelEn: 'Pesticide residue limits',
    cells: {
      EU: {
        level: 'Bắt buộc',
        legalBasis: 'Regulation (EC) No 396/2005',
        sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2005/396/oj/eng',
      },
      US: {
        level: 'Bắt buộc',
        legalBasis:
          '40 CFR Part 180 — Tolerances and Exemptions for Pesticide Chemical Residues in Food',
        sourceUrl: 'https://www.ecfr.gov/current/title-40/chapter-I/subchapter-E/part-180',
      },
    },
  },
];
export function sourcedCell(cell: MatrixCell | undefined) {
  return cell?.sourceUrl && cell.legalBasis ? cell : undefined;
}
export const sourcedRows = (rows = marketRows) =>
  rows.filter((row) => Object.values(row.cells).some((cell) => sourcedCell(cell)));
