# SEIRV Frontend — Notas de desarrollo

Pequeñas instrucciones útiles para desarrolladores del frontend.

Comandos principales:

```bash
# Instalar dependencias
npm install

# Levantar en modo desarrollo
npm run dev

# Ejecutar ESLint (y arreglar problemas automáticamente)
npm run lint
npm run lint:fix

# Ejecutar tests (vitest)
npm run test
```

Notas:
- Las pruebas básicas están configuradas con Vitest (hay tests iniciales para util `normalizeRole`).
- Usar `npm run lint:fix` para aplicar arreglos automáticos antes de realizar commits.
