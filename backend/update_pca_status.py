#!/usr/bin/env python3
"""
Script para atualizar os status de atraso e vencimento de todas as contratações
baseado na nova lógica implementada.
"""

import sys
import os
from datetime import date

# Adicionar o diretório backend ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.pca import PCA


def calculate_status_delays(situacao_execucao: str, data_inicio: date, data_conclusao: date, today: date = None):
    """
    Calcula se uma contratação está atrasada ou vencida baseado na nova lógica:
    - Apenas contratações com situação 'Não iniciado' podem estar atrasadas ou vencidas
    - Se passou da data de início = atrasada
    - Se passou da data de conclusão = vencida (não é mais atrasada)
    """
    if today is None:
        today = date.today()
    
    # Só considera contratações "Não iniciadas" (NULL ou "não iniciada")
    is_nao_iniciada = (situacao_execucao is None or 
                      (situacao_execucao and situacao_execucao.lower().strip() == "não iniciada"))
    
    if not is_nao_iniciada:
        return False, False  # atrasada, vencida
    
    # Se não tem datas, não pode estar atrasada nem vencida
    if not data_inicio or not data_conclusao:
        return False, False
    
    # Se passou da data de conclusão = vencida
    if data_conclusao < today:
        return False, True  # não atrasada, vencida
    
    # Se passou da data de início mas não da conclusão = atrasada
    if data_inicio < today:
        return True, False  # atrasada, não vencida
    
    # Se não passou de nenhuma data = no prazo
    return False, False


def update_all_pca_status():
    """Atualiza o status de todas as contratações existentes"""
    db = SessionLocal()
    try:
        # Buscar todas as contratações
        pcas = db.query(PCA).all()
        
        updated_count = 0
        
        for pca in pcas:
            # Calcular novo status
            atrasada, vencida = calculate_status_delays(
                pca.situacao_execucao,
                pca.data_estimada_inicio,
                pca.data_estimada_conclusao
            )
            
            # Verificar se precisa atualizar
            if pca.atrasada != atrasada or pca.vencida != vencida:
                pca.atrasada = atrasada
                pca.vencida = vencida
                updated_count += 1
                
                print(f"Atualizado PCA {pca.numero_contratacao}: atrasada={atrasada}, vencida={vencida}")
        
        # Commit das alterações
        db.commit()
        
        print(f"\nProcessamento concluído!")
        print(f"Total de PCAs processados: {len(pcas)}")
        print(f"Total de PCAs atualizados: {updated_count}")
        
        # Estatísticas finais
        total_atrasadas = db.query(PCA).filter(PCA.atrasada == True).count()
        total_vencidas = db.query(PCA).filter(PCA.vencida == True).count()
        total_no_prazo = len(pcas) - total_atrasadas - total_vencidas
        
        print(f"\nEstatísticas após atualização:")
        print(f"Contratações atrasadas: {total_atrasadas}")
        print(f"Contratações vencidas: {total_vencidas}")
        print(f"Contratações no prazo: {total_no_prazo}")
        
    except Exception as e:
        print(f"Erro durante a atualização: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("Iniciando atualização dos status das contratações...")
    update_all_pca_status()