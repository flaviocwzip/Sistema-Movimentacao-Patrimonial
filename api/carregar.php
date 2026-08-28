<?php
/**
 * carregar.php
 * Lê o arquivo data/banco.json e devolve seu conteúdo.
 * Se o arquivo não existir, cria a estrutura padrão e a devolve.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$arquivo = __DIR__ . '/../data/banco.json';

$estruturaPadrao = [
    'config' => [
        'tipos'      => ['CPU', 'Monitor', 'Notebook', 'Impressora', 'Scanner', 'Nobreak', 'Outro'],
        'situacoes'  => ['Em uso', 'Disponível', 'Manutenção', 'Baixado', 'Sucata'],
        'setores'    => ['ASTEC', 'AGEQ', 'HEMORREDE', 'Diretoria', 'Laboratório', 'Recepção', 'TI'],
    ],
    'equipamentos'  => [],
    'movimentacoes' => [],
    'seq' => ['equipamento' => 0, 'movimentacao' => 0, 'operacao' => 0],
];

// Cria o arquivo com a estrutura padrão caso não exista.
if (!file_exists($arquivo)) {
    @file_put_contents(
        $arquivo,
        json_encode($estruturaPadrao, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );
    echo json_encode($estruturaPadrao, JSON_UNESCAPED_UNICODE);
    exit;
}

$conteudo = @file_get_contents($arquivo);
if ($conteudo === false) {
    http_response_code(500);
    echo json_encode(['erro' => 'Não foi possível ler o arquivo de dados.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Valida o JSON antes de devolver.
json_decode($conteudo);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo json_encode(['erro' => 'O arquivo de dados está corrompido: ' . json_last_error_msg()], JSON_UNESCAPED_UNICODE);
    exit;
}

echo $conteudo;
