-- Padronizar nomes de turno: Manhã->T1, Tarde->T2, Noite->T3, 1T->T1, 2T->T2, 3T->T3
UPDATE atendentes SET turno = 'T1' WHERE turno IN ('Manhã', '1T');
UPDATE atendentes SET turno = 'T2' WHERE turno IN ('Tarde', '2T');
UPDATE atendentes SET turno = 'T3' WHERE turno IN ('Noite', '3T');

UPDATE cadastro_records SET turno = 'T1' WHERE turno IN ('Manhã', '1T');
UPDATE cadastro_records SET turno = 'T2' WHERE turno IN ('Tarde', '2T');
UPDATE cadastro_records SET turno = 'T3' WHERE turno IN ('Noite', '3T');

UPDATE checklist_records SET turno = 'T1' WHERE turno IN ('Manhã', '1T');
UPDATE checklist_records SET turno = 'T2' WHERE turno IN ('Tarde', '2T');
UPDATE checklist_records SET turno = 'T3' WHERE turno IN ('Noite', '3T');