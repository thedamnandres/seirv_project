import httpx
from typing import Optional, Dict, List
from fastapi import HTTPException, status


class NHTSAService:
    """
    Servicio para integración con la API de NHTSA
    """
    
    BASE_URL = "https://api.nhtsa.gov"
    RECALLS_URL = f"{BASE_URL}/recalls/recallsByVehicle"
    TIMEOUT = 15.0
    
    @classmethod
    async def verify_vehicle_exists(
        cls, 
        make: str, 
        model: str, 
        year: int
    ) -> bool:
        """
        Verifica que el vehículo existe en la base de datos de NHTSA
        
        Intenta obtener recalls. Si la API responde (incluso con 0 recalls),
        el vehículo existe en NHTSA.
        """
        try:
            recalls = await cls.fetch_recalls(make, model, year)
            # Si retorna algo (incluso lista vacía), el vehículo existe
            return True
        except HTTPException as e:
            # Si es 404 o error de NHTSA, el vehículo no existe
            if e.status_code == status.HTTP_404_NOT_FOUND:
                return False
            # Otros errores, asumimos que existe para no bloquear
            return True
        except Exception:
            # En caso de error de red, asumimos que existe
            return True
    
    @classmethod
    async def fetch_recalls(
        cls,
        make: str,
        model: str,
        year: int
    ) -> List[Dict]:
        """
        Obtiene los recalls de un vehículo desde NHTSA
        """
        
        # Normalizar datos
        make = make.strip().upper()
        model = model.strip().upper()
        
        params = {
            "make": make,
            "model": model,
            "modelYear": year
        }
        
        try:
            async with httpx.AsyncClient(timeout=cls.TIMEOUT) as client:
                response = await client.get(cls.RECALLS_URL, params=params)
                
                # Si la respuesta es 200, continuar
                if response.status_code == 200:
                    data = response.json()
                    
                    # NHTSA retorna los resultados en 'results'
                    if "results" in data and isinstance(data["results"], list):
                        return data["results"]
                    else:
                        return []
                
                # Si es 404, el vehículo no existe en NHTSA
                elif response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"El vehículo {year} {make} {model} no fue encontrado en la base de datos de NHTSA"
                    )
                
                # Otros errores
                else:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Error al consultar NHTSA: {response.status_code}"
                    )
                    
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Timeout al consultar la API de NHTSA. Intenta nuevamente."
            )
        except httpx.ConnectError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No se pudo conectar con la API de NHTSA. Verifica tu conexión a internet o intenta más tarde."
            )
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error de conexión con NHTSA: {str(e)}"
            )
        except HTTPException:
            # Re-lanzar las excepciones HTTP que ya creamos
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error inesperado al consultar NHTSA: {str(e)}"
            )