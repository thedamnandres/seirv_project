"""add_irv_raw_and_history

Revision ID: 56c0f733b2f9
Revises: 1fdf20a086b5
Create Date: 2025-11-30 22:06:31.856274

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '56c0f733b2f9'
down_revision: Union[str, None] = '1fdf20a086b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Agregar columna irv_raw a vehicles si no existe
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('vehicles')]
    
    if 'irv_raw' not in columns:
        op.add_column('vehicles', sa.Column('irv_raw', sa.Float(), nullable=True, server_default='0.0'))
        op.alter_column('vehicles', 'irv_raw', nullable=False, server_default='0.0')
    
    # Crear tabla irv_history si no existe
    tables = inspector.get_table_names()
    
    if 'irv_history' not in tables:
        op.create_table(
            'irv_history',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('vehicle_id', sa.Integer(), nullable=False),
            sa.Column('irv_value', sa.Float(), nullable=False),
            sa.Column('irv_raw', sa.Float(), nullable=False),
            sa.Column('irv_level', sa.String(length=20), nullable=False),
            sa.Column('total_recalls', sa.Integer(), nullable=True, server_default='0'),
            sa.Column('mileage_factor', sa.Float(), nullable=True),
            sa.Column('category_factor', sa.Float(), nullable=True),
            sa.Column('calculation_reason', sa.String(length=100), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('calculated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        
        # Crear índices
        op.create_index(op.f('ix_irv_history_id'), 'irv_history', ['id'], unique=False)
        op.create_index(op.f('ix_irv_history_vehicle_id'), 'irv_history', ['vehicle_id'], unique=False)
        op.create_index(op.f('ix_irv_history_calculated_at'), 'irv_history', ['calculated_at'], unique=False)
        op.create_index('idx_vehicle_calculated_at', 'irv_history', ['vehicle_id', 'calculated_at'], unique=False)


def downgrade() -> None:
    # Eliminar tabla irv_history
    op.drop_index('idx_vehicle_calculated_at', table_name='irv_history')
    op.drop_index(op.f('ix_irv_history_calculated_at'), table_name='irv_history')
    op.drop_index(op.f('ix_irv_history_vehicle_id'), table_name='irv_history')
    op.drop_index(op.f('ix_irv_history_id'), table_name='irv_history')
    op.drop_table('irv_history')
    
    # Eliminar columna irv_raw de vehicles
    op.drop_column('vehicles', 'irv_raw')
