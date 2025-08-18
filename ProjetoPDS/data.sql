CREATE TABLE modalidade (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE
);

INSERT INTO modalidade (nome) VALUES
                                  ('corrida'),
                                  ('musculacao'),
                                  ('natacao'),
                                  ('boxe'),
                                  ('futebol'),
                                  ('volei'),
                                  ('ciclismo'),
                                  ('tenis'),
                                  ('basquete');

--script para povoar modalidades BD