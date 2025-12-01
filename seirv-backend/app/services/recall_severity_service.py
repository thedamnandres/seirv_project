import json
import os
import re
from typing import Dict, Tuple
from pathlib import Path


class RecallSeverityService:
    """
    Servicio para calcular la severidad de un recall basado en reglas determinísticas
    
    Usa un sistema de 3 niveles numéricos:
    - Alta (3): Fallas en sistemas críticos que pueden generar pérdida de control,
      incendio, falla de frenos, airbag defectuoso, riesgo de choque, lesiones graves o muerte.
    - Media (2): Fallas mecánicas o eléctricas importantes que afectan el funcionamiento,
      pero con riesgo indirecto de accidente.
    - Baja (1): Problemas cosméticos, etiquetas, información incorrecta, infotainment,
      luces secundarias o elementos que no afecten la seguridad del ocupante.
    """
    
    _rules = None
    
    @classmethod
    def _load_rules(cls) -> dict:
        """
        Carga las reglas de severidad desde el archivo JSON
        """
        if cls._rules is None:
            # Obtener la ruta del archivo de reglas
            current_dir = Path(__file__).parent
            rules_file = current_dir / "recall_severity_rules.json"
            
            with open(rules_file, 'r', encoding='utf-8') as f:
                cls._rules = json.load(f)
        
        return cls._rules
    
    @classmethod
    def calculate_severity(cls, recall_data: Dict) -> Tuple[int, float]:
        """
        Calcula la severidad de un recall basado en reglas determinísticas
        
        Analiza los campos Component, Summary y Consequence del recall y busca
        coincidencias con palabras clave y patrones definidos en las reglas.
        
        Args:
            recall_data: Diccionario con los datos del recall de NHTSA
                Debe contener al menos: Component, Summary, Consequence
            
        Returns:
            Tuple con (severity_level, severity_score)
            - severity_level: 1 (Baja), 2 (Media), o 3 (Alta)
            - severity_score: Valor numérico para cálculos (1.0, 2.0, o 3.0)
        """
        rules = cls._load_rules()
        
        # Obtener y normalizar textos
        component = (recall_data.get("Component") or "").lower()
        summary = (recall_data.get("Summary") or "").lower()
        consequence = (recall_data.get("Consequence") or "").lower()
        
        # Combinar todos los textos para análisis
        combined_text = f"{component} {summary} {consequence}"
        
        # Contadores de coincidencias por nivel
        high_matches = 0
        medium_matches = 0
        low_matches = 0
        
        # Verificar palabras clave de ALTA severidad (3)
        high_keywords = rules["HIGH"]["keywords"]
        for keyword in high_keywords:
            if keyword.lower() in combined_text:
                high_matches += 1
        
        # Verificar patrones de ALTA severidad (3)
        high_patterns = rules["HIGH"].get("patterns", [])
        for pattern in high_patterns:
            if re.search(pattern, combined_text, re.IGNORECASE):
                high_matches += 1
        
        # Verificar palabras clave de MEDIA severidad (2)
        medium_keywords = rules["MEDIUM"]["keywords"]
        for keyword in medium_keywords:
            if keyword.lower() in combined_text:
                medium_matches += 1
        
        # Verificar patrones de MEDIA severidad (2)
        medium_patterns = rules["MEDIUM"].get("patterns", [])
        for pattern in medium_patterns:
            if re.search(pattern, combined_text, re.IGNORECASE):
                medium_matches += 1
        
        # Verificar palabras clave de BAJA severidad (1)
        low_keywords = rules["LOW"]["keywords"]
        for keyword in low_keywords:
            if keyword.lower() in combined_text:
                low_matches += 1
        
        # Verificar patrones de BAJA severidad (1)
        low_patterns = rules["LOW"].get("patterns", [])
        for pattern in low_patterns:
            if re.search(pattern, combined_text, re.IGNORECASE):
                low_matches += 1
        
        # Lógica de decisión determinística
        # Prioridad: ALTA > MEDIA > BAJA
        
        if high_matches > 0:
            # ALTA severidad (3)
            # El score es 3.0 base, con incremento por cantidad de coincidencias
            severity_score = min(5.0, 3.0 + (high_matches - 1) * 0.2)
            return 3, severity_score
        
        elif medium_matches > 0:
            # MEDIA severidad (2)
            # El score es 2.0 base, con incremento por cantidad de coincidencias
            severity_score = min(2.9, 2.0 + (medium_matches - 1) * 0.1)
            return 2, severity_score
        
        elif low_matches > 0:
            # BAJA severidad (1)
            # El score es 1.0 base
            return 1, 1.0
        
        else:
            # Sin coincidencias: Por defecto MEDIA (2) para ser conservador
            # Esto asegura que recalls sin información clara se traten con precaución
            return 2, 2.0
    
    @classmethod
    def get_severity_score_for_irv(cls, recalls: list) -> float:
        """
        Calcula un score total de severidad para usar en fórmulas IRV
        
        Args:
            recalls: Lista de objetos Recall con atributo severity_score
            
        Returns:
            Score total (suma ponderada de severity_scores)
        """
        if not recalls:
            return 0.0
        
        # Sumar los scores de severidad
        total_score = sum(recall.severity_score for recall in recalls)
        
        # Aplicar factor de penalización por cantidad
        # Más recalls = mayor riesgo acumulado
        recall_count_factor = 1.0 + (len(recalls) - 1) * 0.1
        
        return total_score * recall_count_factor
    
    @classmethod
    def get_severity_description(cls, severity_level: int) -> str:
        """
        Obtiene la descripción de un nivel de severidad
        
        Args:
            severity_level: Nivel de severidad (1, 2, o 3)
            
        Returns:
            Descripción del nivel de severidad
        """
        rules = cls._load_rules()
        
        if severity_level == 3:
            return rules["HIGH"]["description"]
        elif severity_level == 2:
            return rules["MEDIUM"]["description"]
        elif severity_level == 1:
            return rules["LOW"]["description"]
        else:
            return "Severidad desconocida"
    
    @staticmethod
    def calculate_severity_score_from_level(severity_level: int) -> float:
        """
        Calcula un severity_score por defecto basado en el nivel de severidad
        
        Se usa cuando un admin actualiza manualmente la severidad y no proporciona
        un severity_score específico.
        
        Args:
            severity_level: Nivel de severidad (1, 2, o 3)
            
        Returns:
            Score numérico por defecto para ese nivel
        """
        if severity_level == 3:
            return 3.0  # Alta severidad: score base 3.0
        elif severity_level == 2:
            return 2.0  # Media severidad: score base 2.0
        elif severity_level == 1:
            return 1.0  # Baja severidad: score base 1.0
        else:
            return 2.0  # Por defecto: media
