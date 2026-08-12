<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\IOFactory;

uses(RefreshDatabase::class);

test('guests cannot export users', function () {
    $response = $this->get(route('users.export'));

    $response->assertRedirect(route('login'));
});

test('agents cannot export users', function () {
    $agent = User::factory()->agent()->create();
    $this->actingAs($agent);

    $response = $this->get(route('users.export'));

    $response->assertForbidden();
});

test('superadmins can export users as a styled xlsx workbook', function () {
    $superAdmin = User::factory()->superAdmin()->create(['name' => 'Ana']);
    User::factory()->agent()->create(['name' => 'Beto']);
    $this->actingAs($superAdmin);

    $response = $this->get(route('users.export'));

    $response->assertOk();
    $response->assertHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    $tempFile = tempnam(sys_get_temp_dir(), 'usuarios').'.xlsx';
    file_put_contents($tempFile, $response->streamedContent());

    $spreadsheet = IOFactory::load($tempFile);
    $sheet = $spreadsheet->getActiveSheet();

    expect($sheet->getCell('A4')->getValue())->toBe('Nombre');
    expect($sheet->getStyle('A4')->getFont()->getColor()->getRGB())->toBe('FFFFFF');

    $names = [$sheet->getCell('A5')->getValue(), $sheet->getCell('A6')->getValue()];
    expect($names)->toContain('Ana');
    expect($names)->toContain('Beto');

    unlink($tempFile);
});
