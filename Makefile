REGISTRY ?= ghcr.io/its-gabo
TAG ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo latest)
VITE_API_URL ?=

LOCAL := docker compose -f docker-compose.prod.yml -f docker-compose.local.yml \
	--env-file docker/local/local.env

API_IMAGE := $(REGISTRY)/open-stream-api
WEB_IMAGE := $(REGISTRY)/open-stream-web
NGINX_IMAGE := $(REGISTRY)/open-stream-nginx

.PHONY: docker-build docker-build-api docker-build-web docker-build-nginx docker-push \
	local-up local-down local-logs

docker-build-api:
	docker build -f docker/api/Dockerfile \
		-t $(API_IMAGE):$(TAG) -t $(API_IMAGE):latest .

docker-build-web:
	docker build -f docker/web/Dockerfile --target web \
		--build-arg VITE_API_URL=$(VITE_API_URL) \
		-t $(WEB_IMAGE):$(TAG) -t $(WEB_IMAGE):latest .

docker-build-nginx:
	docker build -f docker/web/Dockerfile --target nginx \
		--build-arg VITE_API_URL=$(VITE_API_URL) \
		-t $(NGINX_IMAGE):$(TAG) -t $(NGINX_IMAGE):latest .

docker-build: docker-build-api docker-build-web docker-build-nginx

docker-push: docker-build
	docker push --all-tags $(API_IMAGE)
	docker push --all-tags $(WEB_IMAGE)
	docker push --all-tags $(NGINX_IMAGE)

local-up:
	$(LOCAL) up -d --build

local-down:
	$(LOCAL) down

# make local-logs s=app
local-logs:
	$(LOCAL) logs -f --tail=200 $(s)
