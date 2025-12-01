"""change_severity_to_numeric

Revision ID: 1fdf20a086b5
Revises: d1c1839c4313
Create Date: 2025-11-30 21:09:47.841064

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1fdf20a086b5'
down_revision: Union[str, None] = 'd1c1839c4313'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Cambiar el campo severity de Enum a Integer
    # Primero agregar una columna temporal
    op.add_column('recalls', sa.Column('severity_new', sa.Integer(), nullable=True))
    
    # Migrar datos: convertir enum a valores numéricos
    # LOW -> 1, MEDIUM -> 2, HIGH -> 3, CRITICAL -> 3
    op.execute("""
        UPDATE recalls 
        SET severity_new = CASE 
            WHEN severity::text = 'low' THEN 1
            WHEN severity::text = 'medium' THEN 2
            WHEN severity::text = 'high' THEN 3
            WHEN severity::text = 'critical' THEN 3
            ELSE 2  -- Default a MEDIA si no se reconoce
        END
    """)
    
    # Hacer la columna NOT NULL
    op.alter_column('recalls', 'severity_new', nullable=False)
    
    # Eliminar la columna antigua y el índice que la usa
    op.drop_index('idx_vehicle_severity', table_name='recalls')
    op.drop_column('recalls', 'severity')
    
    # Renombrar la nueva columna
    op.alter_column('recalls', 'severity_new', new_column_name='severity')
    
    # Recrear el índice
    op.create_index('idx_vehicle_severity', 'recalls', ['vehicle_id', 'severity'], unique=False)
    
    # Agregar constraint de validación
    op.create_check_constraint(
        'check_severity_range',
        'recalls',
        'severity >= 1 AND severity <= 3'
    )
    
    # Eliminar el tipo enum si ya no se usa
    op.execute("DROP TYPE IF EXISTS recallseverity")


def downgrade() -> None:
    # Recrear el enum
    op.execute("CREATE TYPE recallseverity AS ENUM ('low', 'medium', 'high', 'critical')")
    
    # Eliminar constraint
    op.drop_constraint('check_severity_range', 'recalls', type_='check')
    
    # Eliminar índice
    op.drop_index('idx_vehicle_severity', table_name='recalls')
    
    # Agregar columna enum temporal
    op.add_column('recalls', sa.Column('severity_old', sa.Enum('low', 'medium', 'high', 'critical', name='recallseverity'), nullable=True))
    
    # Migrar datos: convertir numérico a enum
    op.execute("""
        UPDATE recalls 
        SET severity_old = CASE 
            WHEN severity = 1 THEN 'low'::recallseverity
            WHEN severity = 2 THEN 'medium'::recallseverity
            WHEN severity = 3 THEN 'high'::recallseverity
            ELSE 'medium'::recallseverity
        END
    """)
    
    op.alter_column('recalls', 'severity_old', nullable=False)
    op.drop_column('recalls', 'severity')
    op.alter_column('recalls', 'severity_old', new_column_name='severity')
    
    # Recrear índice
    op.create_index('idx_vehicle_severity', 'recalls', ['vehicle_id', 'severity'], unique=False)
