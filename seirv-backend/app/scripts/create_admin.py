"""
Script para crear o actualizar un usuario como admin
"""
from app.database.base import SessionLocal
from app.models.user import User, UserRole
from app.services.auth_service import AuthService

def create_or_update_admin():
    db = SessionLocal()
    
    try:
        # Pedir datos del admin
        username = input("Username del admin: ").strip()
        
        # Buscar si existe
        user = db.query(User).filter(User.username == username).first()
        
        if user:
            print(f"\n✅ Usuario '{username}' encontrado.")
            print(f"   Email: {user.email}")
            print(f"   Rol actual: {user.role}")
            
            confirm = input("\n¿Actualizar a ADMIN? (s/n): ").strip().lower()
            if confirm == 's':
                user.role = UserRole.ADMIN
                db.commit()
                print(f"\n🎉 Usuario '{username}' ahora es ADMIN")
            else:
                print("\nOperación cancelada")
        else:
            print(f"\n❌ Usuario '{username}' no encontrado.")
            create_new = input("¿Crear nuevo usuario admin? (s/n): ").strip().lower()
            
            if create_new == 's':
                email = input("Email: ").strip()
                full_name = input("Nombre completo: ").strip()
                password = input("Contraseña: ").strip()
                
                # Crear usuario
                new_user = User(
                    username=username,
                    email=email,
                    full_name=full_name,
                    hashed_password=AuthService.hash_password(password),
                    role=UserRole.ADMIN,
                    is_active=True
                )
                
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                
                print(f"\n🎉 Usuario admin '{username}' creado exitosamente")
                print(f"   ID: {new_user.id}")
                print(f"   Email: {new_user.email}")
            else:
                print("\nOperación cancelada")
                
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 50)
    print("CREAR O ACTUALIZAR USUARIO ADMIN")
    print("=" * 50)
    create_or_update_admin()
