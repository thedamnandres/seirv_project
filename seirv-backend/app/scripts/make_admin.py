"""
Script para convertir un usuario a administrador

Uso:
    python -m app.scripts.make_admin <username_or_email>

Ejemplo:
    python -m app.scripts.make_admin usuario123
    python -m app.scripts.make_admin usuario@ejemplo.com
"""

import sys
from sqlalchemy.orm import Session

from app.database.base import SessionLocal
from app.models.user import User, UserRole


def make_admin(username_or_email: str):
    """
    Convierte un usuario a administrador
    """
    db: Session = SessionLocal()
    try:
        # Buscar por username o email
        user = db.query(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        if not user:
            print(f"❌ Error: No se encontró ningún usuario con username o email: {username_or_email}")
            return False
        
        if user.role == UserRole.ADMIN:
            print(f"ℹ️  El usuario '{user.username}' ya es administrador")
            return True
        
        # Cambiar el rol a admin
        user.role = UserRole.ADMIN
        db.commit()
        db.refresh(user)
        
        print(f"✅ Usuario '{user.username}' ({user.email}) ahora es administrador")
        print(f"   Nombre: {user.full_name}")
        print(f"   Rol actual: {user.role.value if hasattr(user.role, 'value') else user.role}")
        print(f"\n💡 Recuerda:")
        print(f"   - Hacer logout y login nuevamente en el frontend")
        print(f"   - O refrescar la página para ver los cambios")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error al actualizar el usuario: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python -m app.scripts.make_admin <username_or_email>")
        print("\nEjemplo:")
        print("  python -m app.scripts.make_admin usuario123")
        print("  python -m app.scripts.make_admin usuario@ejemplo.com")
        sys.exit(1)
    
    username_or_email = sys.argv[1]
    success = make_admin(username_or_email)
    sys.exit(0 if success else 1)

