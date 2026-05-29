# Despliegue en Kubernetes con Minikube

## Contexto

Despliegue de la aplicación SEIRV (Sistema de Evaluación del Índice de Riesgo Vehicular) en un clúster local de Kubernetes utilizando Minikube, aplicando los objetos **Deployment**, **ReplicaSet** y **Service**.

---

## Arquitectura

```
                    ┌─────────────────────────────────────────┐
                    │              Minikube Node               │
                    │                                          │
  Navegador         │  NodePort:30300      NodePort:30800      │
  ─────────►────────┼──► frontend ────────► backend ─────────►│
                    │    Service            Service             │
                    │       │                   │              │
                    │  2x frontend pods     2x backend pods    │
                    │                           │              │
                    │                     ClusterIP            │
                    │                    postgres              │
                    │                     Service              │
                    │                         │                │
                    │                   1x postgres pod        │
                    └─────────────────────────────────────────┘
```

| Servicio | Imagen | Puerto interno | Acceso externo |
|---|---|---|---|
| Frontend (React + Vite) | `seirv-frontend:latest` | 3000 | NodePort 30300 |
| Backend (FastAPI) | `seirv-backend:latest` | 8000 | NodePort 30800 |
| PostgreSQL | `postgres:15-alpine` | 5432 | ClusterIP (solo interno) |

---

## Archivos YAML

| Archivo | Tipo de objeto | Descripción |
|---|---|---|
| `secret.yaml` | Secret | Credenciales sensibles en base64 |
| `configmap.yaml` | ConfigMap | Variables de configuración no sensibles |
| `postgres-deployment.yaml` | Deployment + Service | Base de datos PostgreSQL |
| `backend-deployment.yaml` | Deployment + Service | API FastAPI con init container |
| `frontend-deployment.yaml` | Deployment + Service | App React servida con `serve` |

---

## Pasos para desplegar

### 1. Iniciar Minikube y apuntar Docker a su daemon

```bash
minikube start
minikube ip                    # Anotar la IP, ej: 192.168.49.2
eval $(minikube docker-env)
```

### 2. Construir las imágenes dentro de Minikube

```bash
# Desde la raíz del proyecto
docker build -t seirv-backend:latest ./seirv-backend

# Reemplazar la IP con el valor real de minikube ip
docker build \
  --build-arg VITE_API_URL=http://192.168.49.2:30800/api/v1 \
  -t seirv-frontend:latest \
  ./seirv-frontend

docker images | grep seirv
```

> `VITE_API_URL` es una variable de **build-time**: Vite la compila dentro del bundle JS durante `npm run build`. Por eso se pasa como `--build-arg` y no como env var en el Deployment.

### 3. Aplicar los manifests en orden de dependencia

```bash
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl wait --for=condition=ready pod -l app=postgres --timeout=60s
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

---

## Evidencia — Pods y Services funcionando

```bash
kubectl get pods
```

```
NAME                                   READY   STATUS    RESTARTS       AGE
backend-deployment-67f6566c89-7lp9b    1/1     Running   0              51s
backend-deployment-67f6566c89-lkj6j    1/1     Running   0              51s
frontend-deployment-69dbcd475c-bcqkv   1/1     Running   0              47s
frontend-deployment-69dbcd475c-fmw2j   1/1     Running   0              47s
myfirstpod                             1/1     Running   1 (3d5h ago)   6d19h
postgres-deployment-74649858f7-pln6r   1/1     Running   0              67s
```

```bash
kubectl get services
```

```
NAME               TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
backend-service    NodePort    10.101.76.238   <none>        8000:30800/TCP   65s
frontend-service   NodePort    10.97.149.164   <none>        3000:30300/TCP   61s
kubernetes         ClusterIP   10.96.0.1       <none>        443/TCP          6d19h
postgres-service   ClusterIP   10.103.148.86   <none>        5432/TCP         81s
```

```bash
kubectl get replicaset
```

```
NAME                             DESIRED   CURRENT   READY   AGE
backend-deployment-67f6566c89    2         2         2       70s
frontend-deployment-69dbcd475c   2         2         2       66s
postgres-deployment-74649858f7   1         1         1       86s
```

---

## Evidencia — Escalamiento

```bash
kubectl scale deployment backend-deployment --replicas=4
kubectl get pods -l app=backend
```

```
NAME                                  READY   STATUS    RESTARTS   AGE
backend-deployment-67f6566c89-7lp9b   1/1     Running   0          102s
backend-deployment-67f6566c89-cm99w   0/1     Running   0          3s
backend-deployment-67f6566c89-lkj6j   1/1     Running   0          102s
backend-deployment-67f6566c89-p2crq   0/1     Running   0          3s
```

Scale down de vuelta a 2 réplicas:

```bash
kubectl scale deployment backend-deployment --replicas=2
kubectl get pods -l app=backend
```

---

## ¿Qué usos tienen Deployment y ReplicaSet?

### Deployment

- **Rolling updates sin downtime**: al cambiar la imagen, Kubernetes reemplaza los pods gradualmente sin interrumpir el servicio.
- **Rollback automático**: si una nueva versión falla sus health checks, se puede revertir con `kubectl rollout undo`.
- **Estado declarativo**: describes el estado deseado (imagen, réplicas, recursos) y Kubernetes se encarga de mantenerlo.

### ReplicaSet

- **Alta disponibilidad**: garantiza que siempre haya N pods corriendo. Si un pod cae, lo recrea automáticamente.
- **Balanceo de carga**: el Service distribuye el tráfico entre todas las réplicas del ReplicaSet.
- **Escalamiento horizontal**: ante mayor demanda, se aumentan réplicas con `kubectl scale` sin reiniciar el servicio.

> En la práctica **nunca se crea un ReplicaSet directamente**. El Deployment lo gestiona automáticamente: cada vez que se actualiza la imagen, crea un nuevo ReplicaSet y elimina el anterior de forma controlada.

---

## Acceso a la aplicación

```bash
minikube service backend-service --url   # http://<ip>:30800
minikube service frontend-service --url  # http://<ip>:30300
```

| URL | Descripción |
|---|---|
| `http://<ip>:30800/docs` | Swagger UI — documentación interactiva del API |
| `http://<ip>:30800/health` | Health check: `{"status":"healthy"}` |
| `http://<ip>:30300` | Aplicación React completa |
