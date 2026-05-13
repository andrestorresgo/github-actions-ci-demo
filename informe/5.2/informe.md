# Ejecución del flujo de trabajo

1. **Creación del repositorio en GitHub**: Se creó un nuevo repositorio llamado `github-actions-ci-demo`.

2. **Configuración de GitHub Actions**:

   - Se creó un flujo de trabajo llamado `CD - Build, Push and Deploy`.
   - Se configuraron las siguientes acciones:
     - `docker/login-action@v3`: Para iniciar sesión en Docker Hub.
     - `docker/build-push-action@v5`: Para construir y subir la imagen a Docker Hub.
     - `appleboy/ssh-action@v1.0.0`: Para desplegar la imagen en el servidor remoto.

3. **Ejecución del flujo de trabajo**:
   - Se realizó un push a main y se verificó que el flujo de trabajo se ejecute correctamente.
   - Se verificó que la imagen se construya y se suba correctamente a Docker Hub.
   - Se verificó que el despliegue se realice correctamente en el servidor remoto.

4. **Secretos**:
   - Se configuraron los siguientes secretos en el repositorio de GitHub:
     - `DOCKER_USERNAME`: Usuario de Docker Hub.
     - `DOCKER_TOKEN`: Token de Docker Hub.
     - `SERVER_IP`: Dirección IP del servidor remoto.
     - `SSH_USERNAME`: Usuario del servidor remoto.
     - `SSH_KEY`: Clave SSH del servidor remoto.


# Código

El proyecto consiste en una API REST para usuarios utilizando el framework Hono y Bun como runtime.

El archivo `Dockerfile` define la imagen de Docker para la aplicación. Se utiliza una imagen base de Bun para mantener la imagen pequeña.

```dockerfile
# build stage
FROM oven/bun:1 AS build

WORKDIR /app

# Copy dependencies
COPY bun.lock package.json ./

# Build dependencies
RUN bun install --frozen-lockfile --production --ignore-scripts --verbose

COPY . .

# RUN bun build
RUN bun build --compile --minify --sourcemap ./src --outfile hono-docker-app

# runner stage
FROM gcr.io/distroless/base-debian12:nonroot AS runner

ENV NODE_ENV=production

WORKDIR /app

ARG BUILD_APP_PORT=3000
ENV APP_PORT=${BUILD_APP_PORT}
EXPOSE ${APP_PORT}

# Copy the compiled executable from the build stage
COPY --from=build /app/hono-docker-app .

ENTRYPOINT ["./hono-docker-app"]
```

El archivo `.github/workflows/cd.yml` define el flujo de trabajo de despliegue continuo. Este flujo se ejecuta en cada push a la rama `main` y realiza las siguientes acciones:

1. Inicia sesión en Docker Hub.
2. Construye la imagen de Docker y la etiqueta como `hono-bun-app:latest`.
3. Sube la imagen a Docker Hub.
4. Despliega la imagen en un servidor remoto utilizando SSH.

El flujo de trabajo se define en el archivo `.github/workflows/cd.yml`.

```yaml
name: CD - Build, Push and Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout del codigo
        uses: actions/checkout@v6

      - name: Configurar Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.x"

      - name: Instalar dependencias
        run: bun install

      - name: Ejecutar linting
        run: bun run check

      - name: Ejecutar pruebas
        run: bun run test:coverage

      - name: Login a Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - name: Build y Push de imagen
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/hono-bun-app:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Despliegue en servidor remoto
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          port: 22
          script: |
            set +e
            IMAGE="${{ secrets.DOCKER_USERNAME }}/hono-bun-app:latest"

            # 1. Desplegar la nueva imagen en un puerto alterno (3001) para validación
            sudo docker pull $IMAGE
            sudo docker run -d \
              --name hono-bun-app-new \
              --restart unless-stopped \
              -p 3001:3000 \
              -e APP_PORT=3000 \
              $IMAGE

            # 2. Validar que la nueva versión esté funcionando
            if curl -s http://localhost:3001/health | grep -q "status": \
               && curl -s http://localhost:3001/users | grep -q "users"; then
              echo "Health check exitoso. Activando nuevo contenedor..."
              
              # 4. Detener y eliminar el contenedor viejo (si existe)
              sudo docker stop hono-bun-app || true
              sudo docker rm hono-bun-app || true
              
              # 5. Exponer el nuevo contenedor en el puerto público 80
              sudo docker run -d \
                --name hono-bun-app \
                --restart unless-stopped \
                -p 80:3000 \
                -e APP_PORT=3000 \
                $IMAGE
              
              # 6. Limpiar el contenedor de validación
              sudo docker rm -f hono-bun-app-new || true
            else
              echo "Health check FALLIDO. Cancelando despliegue y manteniendo versión anterior."
              sudo docker rm -f hono-bun-app-new || true
              exit 1
            fi

            # Limpieza final de imágenes no usadas
            sudo docker system prune -f

El linter para el proyecto es Biome. Instalado con reglas de ultracite.
```bash
npx ultracite@latest init --linter biome
```

Se modificó el archivo `src/index.ts` que contiene el endpoint `/health` y un subconjunto de la API REST.

Ahora health también incluye la version como manera de pruebas.

```typescript
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    version: "2.0.0",
  });
});
```



# Resultado

Se realizó un push a una rama nueva. El flujo de trabajo se ejecutó correctamente y se marcaron los checks como aprobados.

![PR 1](images/pr1.png)

Se agregó un ruleset en github para protección del branch main. Este ruleset requiere que se ejecute el flujo de trabajo y que se apruebe el pull request para que se pueda hacer merge.

![PR 2](images/pr2.png)

Se realizó un Pull Request apuntando a main y el flujo de trabajo se ejecutó correctamente. La opción de merge se encontraba deshabilitada hasta el momento en el que los checks se marcaron como aprobados.

![PR 3](images/pr3.png)
