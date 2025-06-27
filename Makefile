COMPOSE=docker-compose.yml
OVERRIDE=docker-compose.override.yml
JWT=your_jwt_secret_here

up:
	docker compose -f $(COMPOSE) -f $(OVERRIDE) up --build --force-recreate

down:
	docker compose down

logs:
	docker compose logs -f

migrate:
	docker compose exec backend npx prisma migrate dev

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
