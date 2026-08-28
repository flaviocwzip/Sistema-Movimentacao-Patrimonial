<?php
/**
 * backup.php
 * Cria uma cópia do banco.json atual na pasta backup/
 * com o nome backup_AAAA-MM-DD_HH-MM.json
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'erro' => 'Método não permitido. Use POST.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$origem  = __DIR__ . '/../data/banco.json';
$pasta   = __DIR__ . '/../backup';

if (!file_exists($origem)) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'erro' => 'Não há banco de dados para copiar.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!is_dir($pasta)) {
    @mkdir($pasta, 0775, true);
}

$nome    = 'backup_' . date('Y-m-d_H-i') . '.json';
$destino = $pasta . '/' . $nome;

// Evita sobrescrever caso já exista um backup no mesmo minuto.
if (file_exists($destino)) {
    $nome    = 'backup_' . date('Y-m-d_H-i-s') . '.json';
    $destino = $pasta . '/' . $nome;
}

if (!@copy($origem, $destino)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'erro' => 'Falha ao criar o backup. Verifique as permissões da pasta backup/.'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => true, 'arquivo' => $nome], JSON_UNESCAPED_UNICODE);
