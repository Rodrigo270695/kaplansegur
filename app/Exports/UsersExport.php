<?php

namespace App\Exports;

use App\Models\User;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Genera el libro XLSX del listado de usuarios con la identidad
 * visual de Kaplansegur (dorado/negro): encabezado con color,
 * filas en cebra, bordes y formato por columna.
 */
class UsersExport
{
    private const BRAND_BLACK = '141210';

    private const BRAND_GOLD = 'D9AF3F';

    private const BRAND_GOLD_ACCENT = '8A6A22';

    private const BRAND_GOLD_SOFT = 'FBF3DA';

    private const ZEBRA_ROW = 'FDF9EC';

    private const SUCCESS_TEXT = '15803D';

    private const DANGER_TEXT = 'B91C1C';

    /**
     * @var array<int, array{header: string, width: int}>
     */
    private const COLUMNS = [
        ['header' => 'Nombre', 'width' => 18],
        ['header' => 'Apellido', 'width' => 18],
        ['header' => 'Usuario', 'width' => 18],
        ['header' => 'Documento', 'width' => 16],
        ['header' => 'Número', 'width' => 16],
        ['header' => 'Teléfono', 'width' => 15],
        ['header' => 'Puesto', 'width' => 22],
        ['header' => 'Unidad', 'width' => 18],
        ['header' => 'Zonal', 'width' => 18],
        ['header' => 'Rol', 'width' => 18],
        ['header' => 'Estado', 'width' => 14],
        ['header' => 'Email', 'width' => 30],
        ['header' => 'Creado', 'width' => 18],
    ];

    /**
     * @param  Collection<int, User>  $users
     */
    public function build(Collection $users): Spreadsheet
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Usuarios');

        $lastColumn = $this->columnLetter(count(self::COLUMNS));

        $this->writeTitle($sheet, $lastColumn);
        $this->writeHeaderRow($sheet, $lastColumn);
        $lastRow = $this->writeDataRows($sheet, $users);
        $this->applyTableFormatting($sheet, $lastColumn, $lastRow);
        $this->applyColumnWidths($sheet);

        return $spreadsheet;
    }

    private function writeTitle(Worksheet $sheet, string $lastColumn): void
    {
        $sheet->mergeCells("A1:{$lastColumn}1");
        $sheet->setCellValue('A1', 'Kaplansegur · Usuarios del panel administrativo');
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
        $sheet->setCellValue('A2', 'Exportado el '.now()->translatedFormat('d \d\e F \d\e Y, H:i'));
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '6B6558']],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(16);
    }

    private function writeHeaderRow(Worksheet $sheet, string $lastColumn): void
    {
        $headers = array_column(self::COLUMNS, 'header');
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
     * @param  Collection<int, User>  $users
     */
    private function writeDataRows(Worksheet $sheet, Collection $users): int
    {
        $row = 5;
        $lastColumn = $this->columnLetter(count(self::COLUMNS));
        $roleColumn = $this->columnLetter($this->columnIndexFor('Rol'));
        $statusColumn = $this->columnLetter($this->columnIndexFor('Estado'));
        $createdColumn = $this->columnLetter($this->columnIndexFor('Creado'));

        foreach ($users as $user) {
            $post = $user->post;
            $unitZone = $post?->unitZone;

            $sheet->fromArray([
                $user->name,
                $user->last_name,
                '@'.$user->username,
                $user->document_type->label(),
                $user->document_number,
                $user->phone,
                $post !== null ? $post->name : '—',
                $unitZone !== null ? $unitZone->unit->name : '—',
                $unitZone !== null ? $unitZone->zone->name : '—',
                $user->role->label(),
                $user->is_active ? 'Activo' : 'Suspendido',
                $user->email,
            ], null, "A{$row}");

            if ($user->created_at !== null) {
                $sheet->setCellValue("{$createdColumn}{$row}", Date::PHPToExcel($user->created_at));
            }
            $sheet->getStyle("{$createdColumn}{$row}")->getNumberFormat()->setFormatCode('dd/mm/yyyy hh:mm');

            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::ZEBRA_ROW]],
                ]);
            }

            $isSuperadmin = $user->isSuperAdmin();
            $sheet->getStyle("{$roleColumn}{$row}")->applyFromArray([
                'font' => [
                    'bold' => $isSuperadmin,
                    'color' => ['rgb' => $isSuperadmin ? self::BRAND_GOLD_ACCENT : '3F3B32'],
                ],
            ]);

            $sheet->getStyle("{$statusColumn}{$row}")->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => $user->is_active ? self::SUCCESS_TEXT : self::DANGER_TEXT],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);

            $row++;
        }

        return $row - 1;
    }

    private function columnIndexFor(string $header): int
    {
        foreach (self::COLUMNS as $index => $column) {
            if ($column['header'] === $header) {
                return $index + 1;
            }
        }

        throw new \RuntimeException("Columna no encontrada: {$header}");
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

    private function applyColumnWidths(Worksheet $sheet): void
    {
        foreach (self::COLUMNS as $index => $column) {
            $letter = $this->columnLetter($index + 1);
            $sheet->getColumnDimension($letter)->setWidth($column['width']);
        }
    }

    private function columnLetter(int $columnNumber): string
    {
        return Coordinate::stringFromColumnIndex($columnNumber);
    }
}
