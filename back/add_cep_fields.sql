-- Adicionar campos de endereço completo na tabela imoveis
-- Execute este script manualmente no MySQL

USE cms_news;

-- Adicionar coluna CEP
ALTER TABLE imoveis 
ADD COLUMN cep VARCHAR(191) NULL AFTER valor;

-- Adicionar coluna Bairro
ALTER TABLE imoveis 
ADD COLUMN bairro VARCHAR(191) NULL AFTER endereco;

-- Adicionar coluna Estado
ALTER TABLE imoveis 
ADD COLUMN estado VARCHAR(191) NULL AFTER cidade;

-- Verificar se as colunas foram adicionadas
DESCRIBE imoveis;

