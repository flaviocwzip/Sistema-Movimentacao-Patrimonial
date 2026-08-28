<?php
/**
 * salvar.php
 * Recebe (POST) o JSON completo do sistema e grava em data/banco.json.
 * Faz validação, escrita atômica (arquivo temporário + rename) e trava exclusiva.
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'erro' => 'Método não permitido. Use POST.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$arquivo = __DIR__ . '/../data/banco.json';

// Lê o corpo bruto da requisição.
$corpo = file_get_contents('php://input');
if ($corpo === false || trim($corpo) === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'erro' => 'Nenhum dado recebido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Valida se é um JSON válido.
$dados = json_decode($corpo, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'erro' => 'JSON inválido: ' . json_last_error_msg()], JSON_UNESCAPED_UNICODE);
    exit;
}

// Garante que a estrutura mínima existe.
if (!isset($dados['equipamentos']) || !is_array($dados['equipamentos']) ||
    !isset($dados['movimentacoes']) || !is_array($dados['movimentacoes'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'erro' => 'Estrutura inválida: faltam "equipamentos" ou "movimentacoes".'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Reserializa de forma consistente (bonito e com acentos preservados).
$saida = json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// Escrita atômica: grava num arquivo temporário e depois renomeia.
$temporario = $arquivo . '.tmp';
$bytes = @file_put_contents($temporario, $saida, LOCK_EX);
if ($bytes === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'erro' => 'Falha ao gravar. Verifique as permissões da pasta data/.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!@rename($temporario, $arquivo)) {
    @unlink($temporario);
    http_response_code(500);
    echo json_encode(['ok' => false, 'erro' => 'Falha ao finalizar a gravação.'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => true, 'bytes' => $bytes], JSON_UNESCAPED_UNICODE);
