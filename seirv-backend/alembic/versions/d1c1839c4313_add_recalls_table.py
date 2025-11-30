"""add_recalls_table

Revision ID: d1c1839c4313
Revises: 75d127aeea6e
Create Date: 2025-11-30 20:52:54.070030

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1c1839c4313'
down_revision: Union[str, None] = '75d127aeea6e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Verificar si el enum ya existe
    enum_exists = False
    try:
        result = conn.execute(sa.text(
            "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recallseverity')"
        ))
        enum_exists = result.scalar()
    except Exception:
        pass
    
    # Crear enum si no existe
    if not enum_exists:
        op.execute("CREATE TYPE recallseverity AS ENUM ('low', 'medium', 'high', 'critical')")
    
    # Verificar si la tabla ya existe
    tables = inspector.get_table_names()
    
    if 'recalls' not in tables:
        # Crear tabla recalls
        op.create_table(
            'recalls',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('vehicle_id', sa.Integer(), nullable=False),
            sa.Column('nhtsa_campaign_number', sa.String(length=50), nullable=False),
            sa.Column('component', sa.String(length=200), nullable=True),
            sa.Column('summary', sa.Text(), nullable=True),
            sa.Column('consequence', sa.Text(), nullable=True),
            sa.Column('remedy', sa.Text(), nullable=True),
            sa.Column('manufacturer', sa.String(length=100), nullable=True),
            sa.Column('report_received_date', sa.DateTime(timezone=True), nullable=True),
            sa.Column('severity', sa.Enum('low', 'medium', 'high', 'critical', name='recallseverity', create_type=False), nullable=False),
            sa.Column('severity_score', sa.Float(), nullable=True, server_default='1.0'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('last_synced_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        
        # Crear índices
        op.create_index(op.f('ix_recalls_id'), 'recalls', ['id'], unique=False)
        op.create_index(op.f('ix_recalls_nhtsa_campaign_number'), 'recalls', ['nhtsa_campaign_number'], unique=False)
        op.create_index(op.f('ix_recalls_vehicle_id'), 'recalls', ['vehicle_id'], unique=False)
        op.create_index('idx_vehicle_severity', 'recalls', ['vehicle_id', 'severity'], unique=False)
        op.create_index('idx_campaign_number', 'recalls', ['nhtsa_campaign_number'], unique=False)
    else:
        # Verificar índices existentes
        indexes = [idx['name'] for idx in inspector.get_indexes('recalls')]
        
        if 'ix_recalls_id' not in indexes:
            op.create_index(op.f('ix_recalls_id'), 'recalls', ['id'], unique=False)
        if 'ix_recalls_nhtsa_campaign_number' not in indexes:
            op.create_index(op.f('ix_recalls_nhtsa_campaign_number'), 'recalls', ['nhtsa_campaign_number'], unique=False)
        if 'ix_recalls_vehicle_id' not in indexes:
            op.create_index(op.f('ix_recalls_vehicle_id'), 'recalls', ['vehicle_id'], unique=False)
        if 'idx_vehicle_severity' not in indexes:
            op.create_index('idx_vehicle_severity', 'recalls', ['vehicle_id', 'severity'], unique=False)
        if 'idx_campaign_number' not in indexes:
            op.create_index('idx_campaign_number', 'recalls', ['nhtsa_campaign_number'], unique=False)


def downgrade() -> None:
    # Eliminar índices
    op.drop_index('idx_campaign_number', table_name='recalls')
    op.drop_index('idx_vehicle_severity', table_name='recalls')
    op.drop_index(op.f('ix_recalls_vehicle_id'), table_name='recalls')
    op.drop_index(op.f('ix_recalls_nhtsa_campaign_number'), table_name='recalls')
    op.drop_index(op.f('ix_recalls_id'), table_name='recalls')
    
    # Eliminar tabla
    op.drop_table('recalls')
    
    # Eliminar enum
    op.execute("DROP TYPE IF EXISTS recallseverity")
