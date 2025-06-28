COMPOSE=docker-compose.yml
OVERRIDE=docker-compose.override.yml

up:
	docker compose -f $(COMPOSE) build --build-arg BUILD_DATE=$(shell date +%Y%m%d%H%M%S) backend
	docker compose -f $(COMPOSE) build frontend
	docker compose -f $(COMPOSE) up --force-recreate

up-no-cache:
	docker compose -f $(COMPOSE) build --no-cache --build-arg BUILD_DATE=$(shell date +%Y%m%d%H%M%S) backend
	docker compose -f $(COMPOSE) build --no-cache frontend
	docker compose -f $(COMPOSE) up --force-recreate

down:
	docker compose down

rmi:
	docker compose -f $(COMPOSE) down --rmi all --volumes --remove-orphans
rm:
	docker compose -f $(COMPOSE) down --remove-orphans
logs:
	docker compose logs -f

migrate:
	docker compose exec backend npx prisma migrate dev
seed:
	docker compose exec backend npm run prisma:seed

generate:
	docker compose exec backend npx prisma generate

studio:
	docker compose exec backend npx prisma studio

dbshell:
	docker compose exec db psql -U user -d event_management_db

sh-backend:
	docker compose exec backend sh

sh-frontend:
	docker compose exec frontend sh

sh-db:
	docker compose exec db sh

sh-redis:
	docker compose exec redis sh


####TESTE####

# Faz login e salva o token admin numa variável temporária no shell
test-token:
	@echo "Fazendo login para obter token admin..."
	@TOKEN=$$(curl -s -X POST http://localhost:3001/api/users/login -H "Content-Type: application/json" -d '{"email":"admin@admin.com","password":"password123"}' | jq -r '.token'); \
	echo "Token gerado:" $$TOKEN

# Testa endpoint /me usando token obtido via login
test-me:
	@TOKEN=$$(curl -s -X POST http://localhost:3001/api/users/login -H "Content-Type: application/json" -d '{"email":"admin@admin.com","password":"password123"}' | jq -r '.token'); \
	echo "Token: $$TOKEN"; \
	curl -s -H "Authorization: Bearer $$TOKEN" http://localhost:3001/api/users/me | jq

test-reservations:
	@echo "Fazendo teste de leitura de reservas..."
	@TOKEN=$$(curl -s -X POST http://localhost:3001/api/users/login \
		-H "Content-Type: application/json" \
		-d '{"email":"admin@admin.com","password":"password123"}' | jq -r '.token'); \
	echo "Token gerado: $$TOKEN"; \
	echo "Requisição para /reservations/my-reservations..."; \
	curl -s -H "Authorization: Bearer $$TOKEN" \
		http://localhost:3001/api/reservations/my-reservations | jq

# deploy-vercel:
# 	@echo "Iniciando deploy no Vercel..."
# 	cd ../frontend && vercel deploy --prod
# 	@echo "Deploy concluído. Verifique o status no painel do Vercel."

