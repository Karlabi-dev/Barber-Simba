INSERT INTO services (slug, nome, descricao, categoria, preco, duracao, icon_key, ordem)
VALUES
  ('corte-premium', 'Corte Premium', 'Corte personalizado e finalização', 'Cabelo', 45, 45, 'tesoura', 1),
  ('barba-completa', 'Barba Completa', 'Modelagem, toalha quente e balm', 'Barba', 35, 35, 'barba', 2),
  ('corte-barba', 'Corte + Barba', 'Experiência completa SIMBA', 'Combos', 70, 75, 'narvalha', 3),
  ('corte-infantil', 'Corte Infantil', 'Cuidado especial para os pequenos', 'Cabelo', 30, 40, 'brilho', 4);

INSERT INTO professionals (slug, nome, especialidade, avaliacao, dias, image_key, ordem)
VALUES
  ('thiago-silva', 'Thiago Silva', 'Corte & Fade', 4.9, 'Sex/Sáb', 'perfil', 1),
  ('marcus-rossi', 'Marcus Rossi', 'Barba & Toalha', 5.0, 'Qua/Qui', 'perfil', 2),
  ('felipe-souza', 'Felipe Souza', 'Pigmentação', 4.8, 'Ter/Qua', 'perfil', 3),
  ('allander', 'Allander', 'Corte Social', 4.9, 'Sex/Sáb', 'allander', 4),
  ('jose-da-silva', 'José da Silva', 'Nevou', 4.8, 'Qua/Qui', 'perfil', 5),
  ('emanuely-santos', 'Emanuely Santos', 'Americano', 5.0, 'Ter/Qua', 'perfil', 6),
  ('fernando-costa', 'Fernando Costa', 'Tailandês', 4.9, 'Dom/Seg', 'perfil', 7),
  ('manuel-gomes', 'Manuel Gomes', 'Japonês', 4.7, 'Qui/Sex', 'perfil', 8);
