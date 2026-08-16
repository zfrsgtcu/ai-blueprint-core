<!--
  BU DOSYANIN AMACI:
  AI ajanlarına Prometheus + Grafana + Loki docker-compose konfigürasyon şablonları sunar.
  AI, proje ölçeğine göre lightweight veya enterprise stack'i seçer.
-->

# MONITORING STACK TEMPLATES

## Template 1: Lightweight Stack (Prometheus + Grafana + Loki)

Bu şablon, docker-compose.yaml içine eklenmek üzere monitoring servis tanımlarını içerir.
Tüm {PLACEHOLDER} değerleri AI tarafından değiştirilir.

```yaml
  # ===========================================================================
  # MONITORING — LIGHTWEIGHT STACK
  # ===========================================================================
  prometheus:
    image: prom/prometheus:v2.52.0
    container_name: {PROJECT_NAME}-prometheus
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./monitoring/prometheus/alert.rules.yml:/etc/prometheus/alert.rules.yml:ro
      - prometheus_data:/prometheus
    networks:
      - app_network
    command: 
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'

  grafana:
    image: grafana/grafana:11.0.0
    container_name: {PROJECT_NAME}-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin}
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-piechart-panel
      - GF_SERVER_ROOT_URL=https://monitoring.{DOMAIN}
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    volumes:
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - grafana_data:/var/lib/grafana
    networks:
      - app_network
    depends_on:
      - prometheus
      - loki

  loki:
    image: grafana/loki:3.0.0
    container_name: {PROJECT_NAME}-loki
    restart: unless-stopped
    command: -config.file=/etc/loki/loki-config.yaml
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki/loki-config.yaml:/etc/loki/loki-config.yaml:ro
      - loki_data:/loki
    networks:
      - app_network

  node-exporter:
    image: quay.io/prometheus/node-exporter:v1.8.0
    container_name: {PROJECT_NAME}-node-exporter
    restart: unless-stopped
    command:
      - '--path.rootfs=/host'
    pid: host
    volumes:
      - '/:/host:ro,rslave'
    networks:
      - app_network

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.49.1
    container_name: {PROJECT_NAME}-cadvisor
    restart: unless-stopped
    privileged: true
    devices:
      - /dev/kmsg
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    networks:
      - app_network

volumes:
  prometheus_data:
    name: {PROJECT_NAME}_prometheus_data
  grafana_data:
    name: {PROJECT_NAME}_grafana_data
  loki_data:
    name: {PROJECT_NAME}_loki_data
```

---

## Template 2: Prometheus Konfigürasyonu

Dosya yolu: `monitoring/prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    project: '{PROJECT_NAME}'
    environment: 'production'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - 'alert.rules.yml'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: '{PROJECT_NAME}-backend'
    scrape_interval: 15s
    static_configs:
      - targets: ['backend:{BACKEND_PORT}']

  - job_name: '{PROJECT_NAME}-frontend'
    scrape_interval: 15s
    static_configs:
      - targets: ['frontend:{FRONTEND_PORT}']

  - job_name: 'node-exporter'
    scrape_interval: 30s
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    scrape_interval: 30s
    static_configs:
      - targets: ['cadvisor:8080']
```

---

## Template 3: Grafana Datasource Provisioning

Dosya yolu: `monitoring/grafana/datasources/datasources.yml`

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: false
```

---

## Template 4: Loki Konfigürasyonu

Dosya yolu: `monitoring/loki/loki-config.yaml`

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

common:
  instance_addr: 127.0.0.1
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

limits_config:
  retention_period: 30d
  max_entries_limit_per_query: 5000

compactor:
  working_directory: /loki/compactor
```

---

## AI KULLANIM KURALLARI

1. Monitoring stack tipini projenin ölçeğine göre seç:
   - **Lightweight:** Tek sunuculu, düşük-orta trafikli projeler (çoğu proje için yeterli)
   - **Enterprise:** Yüksek trafikli, çok servisli, kritik sistemler
   - **ELK:** Log analizi ve full-text search öncelikli ise

2. Monitoring servislerini ana `docker-compose.yaml` içine ekle veya ayrı `docker-compose.monitoring.yaml` oluştur.

3. `{PROJECT_NAME}` placeholder'ını gerçek proje adıyla değiştir.

4. Grafana admin şifresini `.env` dosyasından al (`GRAFANA_ADMIN_PASSWORD`).

5. Alert notification (email/Slack) konfigürasyonu için gerekli secret'ları `.env` dosyasına ekle.

6. Monitoring dizin yapısını oluştur:
   ```
   monitoring/
   ├── prometheus/
   │   ├── prometheus.yml
   │   └── alert.rules.yml
   ├── grafana/
   │   ├── dashboards/
   │   │   └── app-dashboard.json
   │   └── datasources/
   │       └── datasources.yml
   └── loki/
       └── loki-config.yaml
   ```
