<?php

namespace App\Exports;

use App\Models\Incident;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Genera el libro XLSX del listado de incidencias con la identidad
 * visual de Kaplansegur (dorado/negro).
 *
 * El contenido depende del rol de quien exporta: el superadmin recibe
 * columnas adicionales de Unidad/Zonal/Puesto (ve incidencias de todos
 * los puestos), mientras que el agente exporta solo lo de su propio
 * puesto, sin esas columnas (ya son todas del mismo puesto). El
 * `Collection` que recibe `build()` ya viene filtrado por el
 * controlador según los filtros activos en pantalla.
 */
class IncidentsExport
{
    private const BRAND_BLACK = '141210';

    private const BRAND_GOLD = 'D9AF3F';

    private const BRAND_GOLD_ACCENT = '8A6A22';

    private const BRAND_GOLD_SOFT = 'FBF3DA';

    private const ZEBRA_ROW = 'FDF9EC';

    private const LINK_BLUE = '1D4ED8';

    private const MUTED_TEXT = '6B6558';

    /**
     * @param  Collection<int, Incident>  $incidents
     */
    public function build(Collection $incidents, bool $includeStructure, string $scopeLabel): Spreadsheet
    {
        $columns = $this->resolveColumns($includeStructure);

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Incidencias');

        $lastColumn = $this->columnLetter(count($columns));

        $this->writeTitle($sheet, $lastColumn, $scopeLabel);
        $this->writeHeaderRow($sheet, $columns, $lastColumn);
        $lastRow = $this->writeDataRows($sheet, $incidents, $includeStructure);
        $this->applyTableFormatting($sheet, $lastColumn, $lastRow);
        $this->applyColumnWidths($sheet, $columns);

        return $spreadsheet;
    }

    /**
     * @return array<int, array{header: string, width: int}>
     */
    private function resolveColumns(bool $includeStructure): array
    {
        $columns = [
            ['header' => 'Motivo', 'width' => 22],
            ['header' => 'Detalle', 'width' => 45],
            ['header' => 'Reportante', 'width' => 22],
        ];

        if ($includeStructure) {
            $columns[] = ['header' => 'Unidad', 'width' => 18];
            $columns[] = ['header' => 'Zonal', 'width' => 18];
            $columns[] = ['header' => 'Puesto', 'width' => 22];
        }

        $columns[] = ['header' => 'Fecha y hora', 'width' => 20];
        $columns[] = ['header' => 'Latitud', 'width' => 12];
        $columns[] = ['header' => 'Longitud', 'width' => 12];
        $columns[] = ['header' => 'Evidencia', 'width' => 16];

        return $columns;
    }

    private function writeTitle(Worksheet $sheet, string $lastColumn, string $scopeLabel): void
    {
        $sheet->mergeCells("A1:{$lastColumn}1");
        $sheet->setCellValue('A1', 'Kaplansegur · Incidencias');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 14,
                'color' => ['rgb' => self::BRAND_BLACK],
            ],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(28);

        $sheet->mergeCells("A2:{$lastColumn}2");
        $sheet->setCellValue(
            'A2',
            "Alcance: {$scopeLabel} · Exportado el ".now()->translatedFormat('d \d\e F \d\e Y, H:i'),
        );
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => self::MUTED_TEXT]],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(16);
    }

    /**
     * @param  array<int, array{header: string, width: int}>  $columns
     */
    private function writeHeaderRow(Worksheet $sheet, array $columns, string $lastColumn): void
    {
        $headers = array_column($columns, 'header');
        $sheet->fromArray($headers, null, 'A4');

        $sheet->getStyle("A4:{$lastColumn}4")->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => self::BRAND_BLACK],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
            'borders' => [
                'bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => self::BRAND_GOLD]],
            ],
        ]);
        $sheet->getRowDimension(4)->setRowHeight(22);
    }

    /**
     * @param  Collection<int, Incident>  $incidents
     */
    private function writeDataRows(Worksheet $sheet, Collection $incidents, bool $includeStructure): int
    {
        $row = 5;
        $lastColumn = $this->columnLetter(
            count($this->resolveColumns($includeStructure)),
        );

        foreach ($incidents as $incident) {
            $reporter = $incident->user;
            $post = $reporter?->post;
            $unitZone = $post?->unitZone;
            $unit = $unitZone?->unit;
            $zone = $unitZone?->zone;

            $values = [
                $incident->reason->name,
                $incident->detail,
                $reporter ? "{$reporter->name} {$reporter->last_name}" : 'Reportante desconocido',
            ];

            if ($includeStructure) {
                $values[] = $unit !== null ? $unit->name : '—';
                $values[] = $zone !== null ? $zone->name : '—';
                $values[] = $post !== null ? $post->name : '—';
            }

            $dateColumn = count($values) + 1;
            $latColumn = $dateColumn + 1;
            $lonColumn = $latColumn + 1;
            $evidenceColumn = $lonColumn + 1;

            $sheet->fromArray($values, null, "A{$row}");

            $dateLetter = $this->columnLetter($dateColumn);
            $sheet->setCellValue("{$dateLetter}{$row}", Date::PHPToExcel($incident->occurred_at));
            $sheet->getStyle("{$dateLetter}{$row}")->getNumberFormat()->setFormatCode('dd/mm/yyyy hh:mm');

            $latLetter = $this->columnLetter($latColumn);
            $lonLetter = $this->columnLetter($lonColumn);
            $sheet->setCellValue("{$latLetter}{$row}", $incident->latitude !== null ? (float) $incident->latitude : null);
            $sheet->setCellValue("{$lonLetter}{$row}", $incident->longitude !== null ? (float) $incident->longitude : null);

            $evidenceLetter = $this->columnLetter($evidenceColumn);
            if ($incident->evidence_url !== null) {
                $sheet->setCellValue("{$evidenceLetter}{$row}", 'Ver archivo');
                $sheet->getCell("{$evidenceLetter}{$row}")->getHyperlink()->setUrl($incident->evidence_url);
                $sheet->getStyle("{$evidenceLetter}{$row}")->applyFromArray([
                    'font' => ['color' => ['rgb' => self::LINK_BLUE], 'underline' => true],
                ]);
            } else {
                $sheet->setCellValue("{$evidenceLetter}{$row}", 'Sin evidencia');
                $sheet->getStyle("{$evidenceLetter}{$row}")->applyFromArray([
                    'font' => ['color' => ['rgb' => self::MUTED_TEXT], 'italic' => true],
                ]);
            }

            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::ZEBRA_ROW]],
                ]);
            }

            $sheet->getStyle("A{$row}")->applyFromArray([
                'font' => ['bold' => true, 'color' => ['rgb' => self::BRAND_GOLD_ACCENT]],
            ]);

            $row++;
        }

        return $row - 1;
    }

    private function applyTableFormatting(Worksheet $sheet, string $lastColumn, int $lastRow): void
    {
        $sheet->getStyle("A4:{$lastColumn}{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::BRAND_GOLD_SOFT]],
            ],
        ]);

        if ($lastRow >= 5) {
            $sheet->setAutoFilter("A4:{$lastColumn}{$lastRow}");
        }

        $sheet->freezePane('A5');
        $sheet->getSheetView()->setZoomScale(100);
    }

    /**
     * @param  array<int, array{header: string, width: int}>  $columns
     */
    private function applyColumnWidths(Worksheet $sheet, array $columns): void
    {
        foreach ($columns as $index => $column) {
            $letter = $this->columnLetter($index + 1);
            $sheet->getColumnDimension($letter)->setWidth($column['width']);
        }
    }

    private function columnLetter(int $columnNumber): string
    {
        return Coordinate::stringFromColumnIndex($columnNumber);
    }
}
